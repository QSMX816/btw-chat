import { Message, ModelConfig } from '../../types';
import { SSEPost } from '../streamHttp';

export interface StreamRequest {
  requestId: string;
  modelId: string;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChunkEmitter {
  type: 'text' | 'reasoning' | 'done' | 'error' | 'tool';
  content?: string;
  reasoning?: string;
  done?: boolean;
  error?: string;
}

export type Emit = (c: ChunkEmitter) => void;
export type StreamFn = (
  provider: import('../../types').Provider,
  req: StreamRequest,
  emit: Emit,
  post: SSEPost
) => Promise<void>;

export function pickModel(provider: { models: ModelConfig[] }, id: string) {
  return provider.models.find((m) => m.id === id);
}
