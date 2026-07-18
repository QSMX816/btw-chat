import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import {
  Conversation,
  Message,
  BtwConversation,
} from '../types';
import { streamChat, cancelChat } from '../services/chat';
import { useConfig } from './config';

interface ConvListItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  providerId: string;
  pinned?: boolean;
  messageCount: number;
  btwCount: number;
}

interface ChatState {
  list: ConvListItem[];
  activeId: string | null;
  active: Conversation | null;
  loadingList: boolean;
  loadingDetail: boolean;
  streaming: boolean;
  activeRequestId: string | null;

  // BTW UI 状态
  openBtwId: string | null;        // 当前展开的 btw id
  btwAnchorId: string | null;      // 绑定到哪条主消息

  loadList: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  newConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;

  sendMessage: (text: string, attachments?: Message['attachments']) => Promise<void>;
  stopStreaming: () => Promise<void>;
  regenerateLast: () => Promise<void>;

  // BTW 操作
  startBtw: (anchorMessageId: string) => string;
  sendBtwMessage: (btwId: string, text: string) => Promise<void>;
  closeBtw: (btwId: string) => void;
  reopenBtw: (btwId: string) => void;
  deleteBtw: (btwId: string) => Promise<void>;
}

function makeEmptyConversation(): Conversation {
  const { settings } = useConfig.getState();
  return {
    id: uuid(),
    title: '新对话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    modelId: settings.activeModelId,
    providerId: settings.activeProviderId,
    btwConversations: [],
  };
}

function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 24 ? clean.slice(0, 24) + '…' : clean || '新对话';
}

async function persist(conv: Conversation) {
  conv.updatedAt = Date.now();
  await window.btw.saveConversation(conv);
}

export const useChat = create<ChatState>((set, get) => ({
  list: [],
  activeId: null,
  active: null,
  loadingList: false,
  loadingDetail: false,
  streaming: false,
  activeRequestId: null,
  openBtwId: null,
  btwAnchorId: null,

  loadList: async () => {
    set({ loadingList: true });
    const list = await window.btw.getConversations();
    set({ list, loadingList: false });
  },

  openConversation: async (id) => {
    set({ loadingDetail: true, openBtwId: null, btwAnchorId: null });
    const conv = await window.btw.getConversation(id);
    set({ activeId: id, active: conv, loadingDetail: false });
  },

  newConversation: async () => {
    const conv = makeEmptyConversation();
    await persist(conv);
    set({
      active: conv,
      activeId: conv.id,
      openBtwId: null,
      btwAnchorId: null,
    });
    await get().loadList();
  },

  deleteConversation: async (id) => {
    await window.btw.deleteConversation(id);
    if (get().activeId === id) {
      set({ active: null, activeId: null, openBtwId: null });
    }
    await get().loadList();
  },

  renameConversation: async (id, title) => {
    const { active } = get();
    if (active && active.id === id) {
      active.title = title;
      await persist(active);
    }
    await get().loadList();
  },

  togglePin: async (id) => {
    const { active } = get();
    if (active && active.id === id) {
      active.pinned = !active.pinned;
      await persist(active);
    }
    await get().loadList();
  },

  sendMessage: async (text, attachments) => {
    const { active } = get();
    if (!active || !text.trim()) return;
    const { settings } = useConfig.getState();
    const provider = useConfig.getState().getActiveProvider();
    if (!provider) return;

    const userMsg: Message = {
      id: uuid(),
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
      attachments,
    };
    active.messages.push(userMsg);

    // 首条消息自动命名
    if (active.messages.filter((m) => m.role === 'user').length === 1) {
      active.title = deriveTitle(text);
    }

    const assistantMsg: Message = {
      id: uuid(),
      role: 'assistant',
      content: '',
      reasoning: '',
      createdAt: Date.now(),
      model: settings.activeModelId,
      thinkingDone: false,
    };
    active.messages.push(assistantMsg);
    set({ active: { ...active }, streaming: true });

    // 同步到主进程设置里的 provider/model（以防用户在侧栏切换）
    active.providerId = settings.activeProviderId;
    active.modelId = settings.activeModelId;

    await runStream(get, set, active, assistantMsg);
  },

  stopStreaming: async () => {
    const rid = get().activeRequestId;
    if (rid) await cancelChat(rid);
    set({ streaming: false, activeRequestId: null });
  },

  regenerateLast: async () => {
    const { active } = get();
    if (!active) return;
    // 移除最后一条 assistant
    const msgs = active.messages;
    while (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop();
    if (!msgs.length) return;

    const assistantMsg: Message = {
      id: uuid(),
      role: 'assistant',
      content: '',
      reasoning: '',
      createdAt: Date.now(),
      model: useConfig.getState().settings.activeModelId,
      thinkingDone: false,
    };
    msgs.push(assistantMsg);
    set({ active: { ...active }, streaming: true });
    await runStream(get, set, active, assistantMsg);
  },

  // ============ BTW ============
  startBtw: (anchorMessageId) => {
    const { active } = get();
    if (!active) return '';
    // 同一锚点消息已有关闭的 btw？创建新的
    const btwId = uuid();
    const btw: BtwConversation = {
      id: btwId,
      anchorMessageId,
      title: 'BTW',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      closed: false,
    };
    active.btwConversations.push(btw);
    // 在锚点消息上挂引用
    const anchor = active.messages.find((m) => m.id === anchorMessageId);
    if (anchor) anchor.btwThreadId = btwId;
    set({ active: { ...active }, openBtwId: btwId, btwAnchorId: anchorMessageId });
    persist(active);
    return btwId;
  },

  sendBtwMessage: async (btwId, text) => {
    const { active } = get();
    if (!active) return;
    const btw = active.btwConversations.find((b) => b.id === btwId);
    if (!btw || !text.trim()) return;

    const { settings } = useConfig.getState();
    btw.messages.push({
      id: uuid(),
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
    });
    const assistantMsg: Message = {
      id: uuid(),
      role: 'assistant',
      content: '',
      reasoning: '',
      createdAt: Date.now(),
      model: settings.activeModelId,
      thinkingDone: false,
    };
    btw.messages.push(assistantMsg);
    set({ active: { ...active } });

    // 用 btw 的历史 + 当前主对话最近若干条做上下文
    const contextMsgs = buildBtwContext(active, btw);
    const provider = useConfig.getState().getActiveProvider();
    if (!provider) return;

    const requestId = uuid();
    set({ streaming: true, activeRequestId: requestId });

    const unsubscribe = streamChat({
      requestId,
      providerId: provider.id,
      modelId: settings.activeModelId,
      messages: contextMsgs,
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      onChunk: (chunk) => {
        if (chunk.type === 'reasoning') assistantMsg.reasoning += chunk.reasoning || '';
        else if (chunk.type === 'text') assistantMsg.content += chunk.content || '';
        else if (chunk.type === 'error') assistantMsg.error = true, assistantMsg.content += `\n\n⚠️ ${chunk.error}`;
        else if (chunk.type === 'done') assistantMsg.thinkingDone = true;
        // 局部刷新
        set({ active: { ...active, btwConversations: [...active.btwConversations] } });
      },
      onDone: () => {
        assistantMsg.thinkingDone = true;
        set({ streaming: false, activeRequestId: null, active: { ...active } });
        persist(active);
      },
    });
    (get() as any).__btwUnsub?.();
    (get() as any).__btwUnsub = unsubscribe;
  },

  closeBtw: (btwId) => {
    const { active } = get();
    if (!active) return;
    const btw = active.btwConversations.find((b) => b.id === btwId);
    if (btw) btw.closed = true;
    set({ openBtwId: null, btwAnchorId: null, active: { ...active } });
    persist(active);
  },

  reopenBtw: (btwId) => {
    const { active } = get();
    if (!active) return;
    const btw = active.btwConversations.find((b) => b.id === btwId);
    if (!btw) return;
    btw.closed = false;
    set({ openBtwId: btwId, btwAnchorId: btw.anchorMessageId, active: { ...active } });
  },

  deleteBtw: async (btwId) => {
    const { active } = get();
    if (!active) return;
    active.btwConversations = active.btwConversations.filter((b) => b.id !== btwId);
    // 清理锚点引用
    active.messages.forEach((m) => {
      if (m.btwThreadId === btwId) m.btwThreadId = undefined;
    });
    set({ openBtwId: null, btwAnchorId: null, active: { ...active } });
    await persist(active);
  },
}));

// ============ helpers ============

async function runStream(
  get: () => ChatState,
  set: (patch: Partial<ChatState>) => void,
  active: Conversation,
  assistantMsg: Message
) {
  const { settings } = useConfig.getState();
  const provider = useConfig.getState().getActiveProvider();
  if (!provider) {
    set({ streaming: false });
    return;
  }

  const requestId = uuid();
  set({ activeRequestId: requestId });

  // 如果开启联网搜索，先抓取结果注入
  let contextMessages = [...active.messages.filter((m) => m.id !== assistantMsg.id)];

  if (settings.webSearchEnabled) {
    const lastUser = [...contextMessages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      try {
        const { formatted } = await window.btw.webSearch(lastUser.content);
        contextMessages.push({
          id: 'search-context',
          role: 'system',
          content: `以下是关于用户问题的最新联网搜索结果，可作参考：\n\n${formatted}`,
          createdAt: Date.now(),
        });
      } catch {
        /* 搜索失败不阻断 */
      }
    }
  }

  const unsubscribe = streamChat({
    requestId,
    providerId: provider.id,
    modelId: settings.activeModelId,
    messages: contextMessages,
    systemPrompt: settings.systemPrompt,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    onChunk: (chunk) => {
      if (chunk.type === 'reasoning') {
        assistantMsg.reasoning += chunk.reasoning || '';
      } else if (chunk.type === 'text') {
        assistantMsg.content += chunk.content || '';
      } else if (chunk.type === 'error') {
        assistantMsg.error = true;
        assistantMsg.content += `\n\n⚠️ ${chunk.error}`;
      } else if (chunk.type === 'done') {
        assistantMsg.thinkingDone = true;
      }
      set({ active: { ...active, messages: [...active.messages] } });
    },
    onDone: () => {
      assistantMsg.thinkingDone = true;
      set({ streaming: false, activeRequestId: null, active: { ...active } });
      persist(active);
      get().loadList();
    },
  });

  // 保存 unsub 以便停止
  (get() as any).__mainUnsub = unsubscribe;
}

function buildBtwContext(active: Conversation, btw: BtwConversation): Message[] {
  // 锚点消息之前的主对话内容（提供主线背景）+ 锚点之后的内容
  const anchorIdx = active.messages.findIndex((m) => m.id === btw.anchorMessageId);
  const mainContext =
    anchorIdx >= 0 ? active.messages.slice(0, anchorIdx + 1) : active.messages.slice(-4);

  const sys: Message = {
    id: 'btw-sys',
    role: 'system',
    content:
      '这是主对话之外的"顺便问一下"(by the way)分支对话。' +
      '以下是主线对话的背景供参考，现在请专注回答当前用户的顺便提问：\n\n' +
      mainContext.map((m) => `[${m.role}]: ${m.content.slice(0, 600)}`).join('\n'),
    createdAt: Date.now(),
  };
  return [sys, ...btw.messages.filter((m) => m.role !== 'system')];
}
