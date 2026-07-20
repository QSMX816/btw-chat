import { Provider, Message } from '../types';
import { postSSE, StreamHttp, type SSEPost } from './streamHttp';
import { streamOpenAI } from './providers/openai';
import { streamAnthropic } from './providers/anthropic';
import { streamGoogle } from './providers/google';
import type { ChunkEmitter, StreamRequest } from './providers/types';

export interface ChatParams {
  requestId: string;
  provider: Provider;
  modelId: string;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk: (c: ChunkEmitter) => void;
}

// 发起一次流式聊天。取消用 cancelChat(requestId)：原生端中断 OkHttp 后会以 done 收尾。
export async function runChat(params: ChatParams): Promise<void> {
  const { provider, requestId } = params;
  const post: SSEPost = (httpReq, onData) => postSSE(requestId, httpReq, onData);
  const emit = params.onChunk;

  if (!provider.apiKey) {
    emit({ type: 'error', error: `请先在设置中填写 ${provider.name} 的 API Key` });
    return;
  }

  const req: StreamRequest = {
    requestId,
    modelId: params.modelId,
    messages: params.messages,
    systemPrompt: params.systemPrompt,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  };

  try {
    switch (provider.kind) {
      case 'anthropic':
        await streamAnthropic(provider, req, emit, post);
        break;
      case 'google':
        await streamGoogle(provider, req, emit, post);
        break;
      case 'openai':
      case 'openai-compatible':
      case 'custom':
      default:
        await streamOpenAI(provider, req, emit, post);
        break;
    }
    emit({ type: 'done', done: true });
  } catch (err: any) {
    emit({ type: 'error', error: err?.message ?? '请求失败' });
  }
}

export function cancelChat(requestId: string) {
  return StreamHttp.cancel({ requestId });
}
