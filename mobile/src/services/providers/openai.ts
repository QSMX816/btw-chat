import { Message, ModelConfig } from '../../types';
import { SSEPost } from '../streamHttp';
import { StreamRequest, Emit, pickModel } from './types';

// OpenAI / 兼容协议（DeepSeek、Moonshot、智谱、本地等）
export const streamOpenAI = async (
  provider: import('../../types').Provider,
  req: StreamRequest,
  emit: Emit,
  post: SSEPost
) => {
  const url = (provider.baseURL || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';
  const model = pickModel(provider, req.modelId);

  const body: Record<string, unknown> = {
    model: req.modelId,
    messages: buildOpenAIMessages(req, model),
    stream: true,
    temperature: req.temperature ?? 0.7,
    stream_options: { include_usage: false },
  };
  if (req.maxTokens) body.max_tokens = req.maxTokens;

  await post(
    {
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    (data) => {
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta ?? {};
        if (delta.reasoning_content) emit({ type: 'reasoning', reasoning: delta.reasoning_content });
        if (delta.reasoning) {
          const r = typeof delta.reasoning === 'string' ? delta.reasoning : delta.reasoning?.content || '';
          if (r) emit({ type: 'reasoning', reasoning: r });
        }
        if (delta.content) emit({ type: 'text', content: delta.content });
      } catch {
        /* ignore */
      }
    }
  );
};

function buildOpenAIMessages(req: StreamRequest, model?: ModelConfig) {
  const msgs: Array<{ role: string; content: unknown }> = [];
  if (req.systemPrompt) msgs.push({ role: 'system', content: req.systemPrompt });
  for (const m of req.messages) {
    if (m.role === 'system') {
      msgs.push({ role: 'system', content: m.content });
      continue;
    }
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
