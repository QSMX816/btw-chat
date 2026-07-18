import { ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC, Conversation } from '../../src/types';

interface ConvSchema {
  conversations: Conversation[];
}

const store = new Store<ConvSchema>({
  name: 'conversations',
  defaults: { conversations: [] },
});

export function registerConversationHandlers() {
  ipcMain.handle(IPC.GET_CONVERSATIONS, () => {
    // 返回精简列表（不含完整消息，加速启动）
    const all = store.get('conversations');
    return all.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      modelId: c.modelId,
      providerId: c.providerId,
      pinned: c.pinned,
      messageCount: c.messages.length,
      btwCount: c.btwConversations?.length ?? 0,
    }));
  });

  ipcMain.handle(IPC.GET_CONVERSATION, (_e, id: string) => {
    const all = store.get('conversations');
    return all.find((c) => c.id === id) ?? null;
  });

  ipcMain.handle(IPC.SAVE_CONVERSATION, (_e, conv: Conversation) => {
    const all = store.get('conversations');
    const idx = all.findIndex((c) => c.id === conv.id);
    conv.updatedAt = Date.now();
    if (idx >= 0) all[idx] = conv;
    else all.unshift(conv);
    // 保留最近 500 条
    const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 500);
    store.set('conversations', sorted);
    return true;
  });

  ipcMain.handle(IPC.DELETE_CONVERSATION, (_e, id: string) => {
    const all = store.get('conversations');
    store.set('conversations', all.filter((c) => c.id !== id));
    return true;
  });
}
