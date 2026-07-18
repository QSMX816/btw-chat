import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC } from '../src/types';

const api = {
  // 配置
  getProviders: () => ipcRenderer.invoke(IPC.GET_PROVIDERS),
  saveProviders: (providers: unknown) => ipcRenderer.invoke(IPC.SAVE_PROVIDERS, providers),
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  saveSettings: (settings: unknown) => ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings),

  // 对话
  getConversations: () => ipcRenderer.invoke(IPC.GET_CONVERSATIONS),
  getConversation: (id: string) => ipcRenderer.invoke(IPC.GET_CONVERSATION, id),
  saveConversation: (conv: unknown) => ipcRenderer.invoke(IPC.SAVE_CONVERSATION, conv),
  deleteConversation: (id: string) => ipcRenderer.invoke(IPC.DELETE_CONVERSATION, id),

  // 流式聊天
  chatStream: (
    payload: unknown,
    onChunk: (data: { requestId?: string; type: string; content?: string; reasoning?: string; done?: boolean; error?: string }) => void
  ) => {
    const handler = (_e: IpcRendererEvent, data: Parameters<typeof onChunk>[0]) => onChunk(data);
    ipcRenderer.on(`${IPC.CHAT_STREAM}:chunk`, handler);
    ipcRenderer.invoke(IPC.CHAT_STREAM, payload);
    return () => {
      ipcRenderer.removeListener(`${IPC.CHAT_STREAM}:chunk`, handler);
    };
  },
  cancelStream: (id: string) => ipcRenderer.invoke(IPC.CANCEL_STREAM, id),

  // 网络搜索
  webSearch: (query: string) => ipcRenderer.invoke(IPC.WEB_SEARCH, query),

  // 嗅探模型列表
  sniffModels: (params: { kind: string; baseURL?: string; apiKey: string }) =>
    ipcRenderer.invoke(IPC.SNIFF_MODELS, params),

  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    maximize: () => ipcRenderer.invoke('win:maximize'),
    close: () => ipcRenderer.invoke('win:close'),
    onMaximizeChange: (cb: (maximized: boolean) => void) => {
      const handler = (_e: IpcRendererEvent, v: boolean) => cb(v);
      ipcRenderer.on('win:maximize-changed', handler);
      return () => ipcRenderer.removeListener('win:maximize-changed', handler);
    },
  },

  platform: process.platform,
};

contextBridge.exposeInMainWorld('btw', api);

export type BtwAPI = typeof api;
