import { Message } from '../types';

export interface StreamChunk {
  requestId?: string;
  type: 'text' | 'reasoning' | 'done' | 'error' | 'tool';
  content?: string;
  reasoning?: string;
  done?: boolean;
  error?: string;
}

export interface StreamParams {
  requestId: string;
  providerId: string;
  modelId: string;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  webSearch?: boolean;
  onChunk: (c: StreamChunk) => void;
  onDone: () => void;
}

export function streamChat(params: StreamParams): () => void {
  const { requestId, onChunk, onDone } = params;

  const cleanup = window.btw.chatStream(
    {
      requestId,
      providerId: params.providerId,
      modelId: params.modelId,
      messages: params.messages,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      webSearch: params.webSearch,
    },
    (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      onChunk(data as StreamChunk);
      if (data.type === 'done') onDone();
    }
  );

  return cleanup;
}

export async function cancelChat(requestId: string) {
  await window.btw.cancelStream(requestId);
}
