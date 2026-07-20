import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { v4 as uuid } from 'uuid';
import { Conversation, Message, BtwConversation, Attachment } from '../types';
import { useConfig } from './config';
import { runChat, cancelChat } from '../services/chat';

const STORE_KEY = 'conversations';

// 把文档附件抽取出的文本注入到用户消息正文（仅用于发给 API，不改变存储的消息）
function injectDoc(m: Message): Message {
  const docs = m.attachments?.filter((a) => a.kind === 'document' && a.extractedText);
  if (!docs?.length) return m;
  const head = docs
    .map((d) => `【附件：${d.name}${d.pages ? `（${d.pages} 页）` : ''}${d.truncated ? '，已截断' : ''}】\n${d.extractedText}`)
    .join('\n\n');
  return { ...m, content: `${head}\n\n${m.content}` };
}

function apiMessages(msgs: Message[]): Message[] {
  return msgs.filter((m) => !m.error).map(injectDoc);
}

function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t ? t.slice(0, 24) + (t.length > 24 ? '…' : '') : '新对话';
}

interface ConvState {
  conversations: Conversation[];
  activeId: string | null;
  loaded: boolean;
  streaming: boolean;
  activeRequestId: string | null;
  // 打开的 BTW 面板
  btwOpen: { convId: string; btwId: string } | null;
  btwStreaming: boolean;

  load(): Promise<void>;
  newConversation(): string;
  select(id: string): void;
  remove(id: string): Promise<void>;
  rename(id: string, title: string): Promise<void>;
  togglePin(id: string): Promise<void>;
  switchModel(providerId: string, modelId: string): Promise<void>;

  send(text: string, attachments?: Attachment[]): Promise<void>;
  cancel(): void;
  regenerate(): Promise<void>;
  compact(): Promise<void>;

  startBtw(convId: string, anchorMsgId: string): void;
  closeBtw(): void;
  reopenBtw(convId: string, btwId: string): void;
  closeBtwThread(convId: string, btwId: string): Promise<void>;
  sendBtw(text: string): Promise<void>;
}

export const useConversations = create<ConvState>((set, get) => {
  // 持久化（仅结构变更时调用，流式 token 不触发）
  const persist = async (convs: Conversation[]) => {
    try {
      await Preferences.set({ key: STORE_KEY, value: JSON.stringify(convs) });
    } catch {
      /* ignore */
    }
  };
  const snapshot = () => get().conversations;

  // 原地更新某条主消息（流式追加用），不持久化
  const patchMainMsg = (convId: string, msgId: string, fn: (m: Message) => Message) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id !== convId
          ? c
          : { ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)), updatedAt: Date.now() }
      ),
    }));
  };
  const patchBtwMsg = (convId: string, btwId: string, msgId: string, fn: (m: Message) => Message) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id !== convId
          ? c
          : {
              ...c,
              btwConversations: c.btwConversations.map((b) =>
                b.id !== btwId ? b : { ...b, messages: b.messages.map((m) => (m.id === msgId ? fn(m) : m)) }
              ),
            }
      ),
    }));
  };

  // 通用流式跑批：把增量写进指定位置（主聊或 BTW）
  const streamInto = async (
    where: { convId: string; btwId?: string },
    provider: ReturnType<typeof useConfig.getState>['providers'][number],
    modelId: string,
    history: Message[],
    assistant: Message
  ) => {
    const { settings } = useConfig.getState();
    const requestId = uuid();
    set({ streaming: !where.btwId, btwStreaming: !!where.btwId, activeRequestId: requestId });

    const patch = where.btwId
      ? (fn: (m: Message) => Message) => patchBtwMsg(where.convId, where.btwId!, assistant.id, fn)
      : (fn: (m: Message) => Message) => patchMainMsg(where.convId, assistant.id, fn);

    await runChat({
      requestId,
      provider,
      modelId,
      messages: history,
      systemPrompt: settings.systemPrompt || undefined,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens || undefined,
      onChunk: (c) => {
        if (c.type === 'text' && c.content) {
          patch((m) => ({ ...m, content: m.content + c.content }));
        } else if (c.type === 'reasoning' && c.reasoning) {
          patch((m) => ({ ...m, reasoning: (m.reasoning || '') + c.reasoning }));
        } else if (c.type === 'error') {
          patch((m) => ({ ...m, error: true, content: m.content || `⚠️ ${c.error}` }));
        }
      },
    });

    patch((m) => ({ ...m, thinkingDone: true }));
    set({ streaming: false, btwStreaming: false, activeRequestId: null });
    await persist(snapshot());
  };

  const resolveProvider = (conv: Conversation) => {
    const { providers, settings } = useConfig.getState();
    return (
      providers.find((p) => p.id === conv.providerId) ||
      providers.find((p) => p.id === settings.activeProviderId) ||
      providers[0]
    );
  };

  return {
    conversations: [],
    activeId: null,
    loaded: false,
    streaming: false,
    activeRequestId: null,
    btwOpen: null,
    btwStreaming: false,

    async load() {
      try {
        const { value } = await Preferences.get({ key: STORE_KEY });
        const conversations: Conversation[] = value ? JSON.parse(value) : [];
        conversations.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
        set({ conversations, loaded: true, activeId: conversations[0]?.id ?? null });
      } catch {
        set({ loaded: true });
      }
    },

    newConversation() {
      const { settings } = useConfig.getState();
      const conv: Conversation = {
        id: uuid(),
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: settings.activeModelId,
        providerId: settings.activeProviderId,
        btwConversations: [],
      };
      set((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }));
      void persist(get().conversations);
      return conv.id;
    },

    select(id) {
      set({ activeId: id, btwOpen: null });
    },

    async remove(id) {
      const convs = get().conversations.filter((c) => c.id !== id);
      set((s) => ({
        conversations: convs,
        activeId: s.activeId === id ? convs[0]?.id ?? null : s.activeId,
        btwOpen: null,
      }));
      await persist(convs);
    },

    async rename(id, title) {
      const convs = get().conversations.map((c) => (c.id === id ? { ...c, title } : c));
      set({ conversations: convs });
      await persist(convs);
    },

    async togglePin(id) {
      const convs = get().conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
      convs.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
      set({ conversations: convs });
      await persist(convs);
    },

    async switchModel(providerId, modelId) {
      await useConfig.getState().updateSettings({ activeProviderId: providerId, activeModelId: modelId });
      const aid = get().activeId;
      if (aid) {
        const convs = get().conversations.map((c) =>
          c.id === aid ? { ...c, providerId, modelId } : c
        );
        set({ conversations: convs });
        await persist(convs);
      }
    },

    async send(text, attachments) {
      let convId = get().activeId;
      if (!convId) convId = get().newConversation();
      const conv = get().conversations.find((c) => c.id === convId);
      if (!conv) return;

      const userMsg: Message = {
        id: uuid(),
        role: 'user',
        content: text.trim(),
        createdAt: Date.now(),
        attachments,
      };
      const assistant: Message = { id: uuid(), role: 'assistant', content: '', createdAt: Date.now() };

      const msgs = [...conv.messages, userMsg, assistant];
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? { ...c, messages: msgs, title: c.messages.length === 0 ? titleFrom(text) : c.title, updatedAt: Date.now() } : c
        ),
      }));

      const provider = resolveProvider(conv);
      await streamInto({ convId }, provider, conv.modelId, apiMessages(conv.messages.concat(userMsg)), assistant);
    },

    cancel() {
      const rid = get().activeRequestId;
      if (rid) void cancelChat(rid);
    },

    async regenerate() {
      const conv = get().conversations.find((c) => c.id === get().activeId);
      if (!conv) return;
      // 找到最后一条 user，丢掉其后的 assistant，重新生成
      let lastUserIdx = -1;
      for (let i = conv.messages.length - 1; i >= 0; i--) {
        if (conv.messages[i].role === 'user') { lastUserIdx = i; break; }
      }
      if (lastUserIdx < 0) return;
      const history = conv.messages.slice(0, lastUserIdx + 1);
      const assistant: Message = { id: uuid(), role: 'assistant', content: '', createdAt: Date.now() };
      const msgs = [...history, assistant];
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === conv.id ? { ...c, messages: msgs, updatedAt: Date.now() } : c)),
      }));
      const provider = resolveProvider(conv);
      await streamInto({ convId: conv.id }, provider, conv.modelId, apiMessages(history), assistant);
    },

    async compact() {
      const conv = get().conversations.find((c) => c.id === get().activeId);
      if (!conv || conv.messages.length < 4) return;
      const provider = resolveProvider(conv);
      const requestId = uuid();
      set({ streaming: true, activeRequestId: requestId });

      const summaryMsg: Message = { id: uuid(), role: 'assistant', content: '📝 **上下文已压缩**\n\n', createdAt: Date.now() };
      const compactPrompt: Message = {
        id: uuid(),
        role: 'user',
        content:
          '请把以下对话精炼成一份结构化摘要，保留关键事实、结论、代码要点与待办，丢掉寒暄。用中文，尽量简洁：\n\n' +
          conv.messages.map((m) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content.slice(0, 1200)}`).join('\n\n'),
        createdAt: Date.now(),
      };

      await runChat({
        requestId,
        provider,
        modelId: conv.modelId,
        messages: [compactPrompt],
        maxTokens: 2048,
        onChunk: (c) => {
          if (c.type === 'text' && c.content) summaryMsg.content += c.content;
          else if (c.type === 'error') summaryMsg.content += `\n⚠️ ${c.error}`;
        },
      });

      const replaced: Conversation = {
        ...conv,
        messages: [{ ...summaryMsg, thinkingDone: true }],
        updatedAt: Date.now(),
      };
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === conv.id ? replaced : c)),
        streaming: false,
        activeRequestId: null,
      }));
      await persist(get().conversations);
    },

    startBtw(convId, anchorMsgId) {
      const conv = get().conversations.find((c) => c.id === convId);
      if (!conv) return;
      const anchor = conv.messages.find((m) => m.id === anchorMsgId);
      if (!anchor) return;
      const btw: BtwConversation = {
        id: uuid(),
        anchorMessageId: anchorMsgId,
        title: '顺便聊聊',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        closed: false,
      };
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id !== convId
            ? c
            : {
                ...c,
                messages: c.messages.map((m) => (m.id === anchorMsgId ? { ...m, btwThreadId: btw.id } : m)),
                btwConversations: [...c.btwConversations, btw],
              }
        ),
        btwOpen: { convId, btwId: btw.id },
      }));
      void persist(get().conversations);
    },

    closeBtw() {
      set({ btwOpen: null });
    },

    reopenBtw(convId, btwId) {
      set({ btwOpen: { convId, btwId } });
    },

    async closeBtwThread(convId, btwId) {
      const convs = get().conversations.map((c) =>
        c.id !== convId
          ? c
          : {
              ...c,
              btwConversations: c.btwConversations.map((b) => (b.id === btwId ? { ...b, closed: true } : b)),
            }
      );
      set({ conversations: convs, btwOpen: null });
      await persist(convs);
    },

    async sendBtw(text) {
      const open = get().btwOpen;
      if (!open) return;
      const conv = get().conversations.find((c) => c.id === open.convId);
      const btw = conv?.btwConversations.find((b) => b.id === open.btwId);
      if (!conv || !btw) return;

      const userMsg: Message = { id: uuid(), role: 'user', content: text.trim(), createdAt: Date.now() };
      const assistant: Message = { id: uuid(), role: 'assistant', content: '', createdAt: Date.now() };

      // 把锚点 AI 回答作为背景塞进上下文
      const anchor = conv.messages.find((m) => m.id === btw.anchorMessageId);
      const bg: Message[] = anchor
        ? [{ id: 'bg', role: 'user', content: '（背景）这是我之前得到的一段回答，接下来我会针对它追问，请基于这段回答作答：\n\n' + anchor.content, createdAt: 0 }]
        : [];
      const history = [...bg, ...btw.messages, userMsg];

      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id !== conv.id
            ? c
            : {
                ...c,
                btwConversations: c.btwConversations.map((b) =>
                  b.id !== btw.id ? b : { ...b, messages: [...b.messages, userMsg, assistant], updatedAt: Date.now() }
                ),
              }
        ),
      }));

      const provider = resolveProvider(conv);
      await streamInto({ convId: conv.id, btwId: btw.id }, provider, conv.modelId, apiMessages(history), assistant);
    },
  };
});

export const activeConv = (s: ConvState) => s.conversations.find((c) => c.id === s.activeId) || null;
