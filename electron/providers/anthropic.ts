import { Provider, Message } from '../../src/types';
import { parseSSE, extractError } from './sse';
import { ChunkEmitter } from '../ipc/stream';

interface StreamRequest {
  requestId: string;
  modelId: string;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  webSearch?: boolean;
}

export async function streamAnthropic(
  provider: Provider,
  req: StreamRequest,
  emit: (c: ChunkEmitter) => void,
  signal: AbortSignal
) {
  const url = (provider.baseURL || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages';
  const systemPrompt = req.systemPrompt || 'You are a helpful assistant.';

  const maxTokens = req.maxTokens || 4096;
  const model = provider.models.find((m) => m.id === req.modelId);
  const wantsThinking = !!model?.supportsThinking;

  const body: Record<string, unknown> = {
    model: req.modelId,
    max_tokens: maxTokens,
    stream: true,
    system: systemPrompt,
    messages: buildAnthropicMessages(req.messages),
  };

  if (wantsThinking) {
    // 扩展思考：budget 必须显著小于 max_tokens
    const budget = Math.min(Math.max(1024, Math.floor(maxTokens * 0.6)), maxTokens - 1024);
    body.thinking = { type: 'enabled', budget_tokens: budget };
    // 思考模式下 temperature 必须为 1
    body.temperature = 1;
  } else {
    body.temperature = req.temperature ?? 0.7;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await extractError(res));
  }

  await parseSSE(res.body as unknown as ReadableStream<Uint8Array>, (data) => {
    try {
      const json = JSON.parse(data);
      if (json.type === 'content_block_delta') {
        const delta = json.delta;
        if (delta?.type === 'thinking_delta' || delta?.type === 'reasoning_delta') {
          emit({ type: 'reasoning', reasoning: delta.thinking || delta.reasoning || '' });
        } else if (delta?.type === 'text_delta') {
          emit({ type: 'text', content: delta.text });
        }
      }
    } catch {
      /* ignore */
    }
  });
}

function buildAnthropicMessages(messages: Message[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
}
