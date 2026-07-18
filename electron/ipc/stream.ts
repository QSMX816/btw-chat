import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IPC, Provider, Message } from '../../src/types';
import { configStore } from './config';
import { streamOpenAI } from '../providers/openai';
import { streamAnthropic } from '../providers/anthropic';
import { streamGoogle } from '../providers/google';

interface StreamRequest {
  requestId: string;
  providerId: string;
  modelId: string;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  webSearch?: boolean;
}

const activeStreams = new Map<string, AbortController>();

export interface ChunkEmitter {
  type: 'text' | 'reasoning' | 'done' | 'error' | 'tool';
  content?: string;
  reasoning?: string;
  done?: boolean;
  error?: string;
}

export function emitChunk(event: IpcMainInvokeEvent, requestId: string, chunk: ChunkEmitter) {
  event.sender.send(`${IPC.CHAT_STREAM}:chunk`, { requestId, ...chunk });
}

export function getProvider(id: string): Provider {
  const providers = configStore.get('providers');
  return providers.find((p) => p.id === id)!;
}

async function runStream(event: IpcMainInvokeEvent, req: StreamRequest) {
  const ctrl = new AbortController();
  activeStreams.set(req.requestId, ctrl);

  const provider = getProvider(req.providerId);
  if (!provider) {
    emitChunk(event, req.requestId, { type: 'error', error: '未找到该提供商' });
    return;
  }
  if (!provider.apiKey) {
    emitChunk(event, req.requestId, { type: 'error', error: `请先在设置中填写 ${provider.name} 的 API Key` });
    return;
  }

  const emit = (c: ChunkEmitter) => emitChunk(event, req.requestId, c);

  try {
    switch (provider.kind) {
      case 'anthropic':
        await streamAnthropic(provider, req, emit, ctrl.signal);
        break;
      case 'google':
        await streamGoogle(provider, req, emit, ctrl.signal);
        break;
      case 'openai':
      case 'openai-compatible':
      case 'custom':
      default:
        await streamOpenAI(provider, req, emit, ctrl.signal);
        break;
    }
    emit({ type: 'done', done: true });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      emit({ type: 'done', done: true });
    } else {
      emit({ type: 'error', error: err?.message ?? '请求失败' });
    }
  } finally {
    activeStreams.delete(req.requestId);
  }
}

export function registerStreamHandlers() {
  ipcMain.handle(IPC.CHAT_STREAM, async (event, req: StreamRequest) => {
    runStream(event, req);
    return true;
  });

  ipcMain.handle(IPC.CANCEL_STREAM, (_e, requestId: string) => {
    activeStreams.get(requestId)?.abort();
    activeStreams.delete(requestId);
    return true;
  });
}
