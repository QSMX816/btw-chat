import { Provider, Message, ModelConfig } from '../../src/types';
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

// OpenAI / 兼容协议（DeepSeek、Moonshot、智谱、本地等）
export async function streamOpenAI(
  provider: Provider,
  req: StreamRequest,
  emit: (c: ChunkEmitter) => void,
  signal: AbortSignal
) {
  const url = (provider.baseURL || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';
  const model = provider.models.find((m) => m.id === req.modelId);

  const body: Record<string, unknown> = {
    model: req.modelId,
    messages: buildOpenAIMessages(req, model),
    stream: true,
    temperature: req.temperature ?? 0.7,
    stream_options: { include_usage: false },
  };
  if (req.maxTokens) body.max_tokens = req.maxTokens;

  // DeepSeek R1 / 智谱 GLM 思考通过 reasoning_content 字段返回
  // OpenAI o 系列通过 reasoning.summary 返回，这里统一尽力提取

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
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
      const delta = json.choices?.[0]?.delta ?? {};

      // 思考内容（DeepSeek reasoning_content / 智谱 reasoning_content）
      if (delta.reasoning_content) {
        emit({ type: 'reasoning', reasoning: delta.reasoning_content });
      }
      // OpenAI o 系列 reasoning
      if (delta.reasoning) {
        const r = typeof delta.reasoning === 'string' ? delta.reasoning : delta.reasoning?.content || '';
        if (r) emit({ type: 'reasoning', reasoning: r });
      }
      if (delta.content) {
        emit({ type: 'text', content: delta.content });
      }
    } catch {
      /* ignore parse error */
    }
  });
}

function buildOpenAIMessages(req: StreamRequest, model?: ModelConfig) {
  const msgs: Array<{ role: string; content: unknown }> = [];
  if (req.systemPrompt) {
    msgs.push({ role: 'system', content: req.systemPrompt });
  }
  for (const m of req.messages) {
    if (m.role === 'system') {
      msgs.push({ role: 'system', content: m.content });
      continue;
    }
    // 带图片
    const images = m.attachments?.filter((a) => a.type.startsWith('image/'));
    if (images?.length && model?.supportsVision) {
      msgs.push({
        role: m.role,
        content: [
          { type: 'text', text: m.content },
          ...images.map((img) => ({
            type: 'image_url',
            image_url: { url: `data:${img.type};base64,${img.data}` },
          })),
        ],
      });
    } else {
      msgs.push({ role: m.role, content: m.content });
    }
  }
  return msgs;
}
