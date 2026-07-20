import { StreamRequest, Emit, pickModel } from './types';

// Google Gemini —— 使用 SSE 流式端点
export const streamGoogle = async (
  provider: import('../../types').Provider,
  req: StreamRequest,
  emit: Emit,
  post: import('../streamHttp').SSEPost
) => {
  const base = (provider.baseURL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const url =
    `${base}/v1beta/models/${req.modelId}:streamGenerateContent` +
    `?alt=sse&key=${encodeURIComponent(provider.apiKey)}`;

  const contents = req.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const model = pickModel(provider, req.modelId);
  const generationConfig: Record<string, unknown> = { temperature: req.temperature ?? 0.7 };
  if (req.maxTokens && req.maxTokens > 0) generationConfig.maxOutputTokens = req.maxTokens;
  if (model?.supportsThinking) generationConfig.thinkingConfig = { includeThoughts: true };

  const body: Record<string, unknown> = { contents, generationConfig };
  if (req.systemPrompt) body.systemInstruction = { parts: [{ text: req.systemPrompt }] };

  await post(
    {
      url,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    (data) => {
      try {
        const json = JSON.parse(data);
        const parts = json.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.thought || part.thoughtSignature) {
            if (part.text) emit({ type: 'reasoning', reasoning: part.text });
          } else if (part.text) {
            emit({ type: 'text', content: part.text });
          }
        }
      } catch {
        /* ignore */
      }
    }
  );
};
