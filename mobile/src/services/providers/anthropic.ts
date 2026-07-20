import { StreamRequest, Emit, pickModel } from './types';

export const streamAnthropic = async (
  provider: import('../../types').Provider,
  req: StreamRequest,
  emit: Emit,
  post: import('../streamHttp').SSEPost
) => {
  const url = (provider.baseURL || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages';
  const systemPrompt = req.systemPrompt || 'You are a helpful assistant.';

  const maxTokens = req.maxTokens && req.maxTokens > 0 ? req.maxTokens : 32000;
  const model = pickModel(provider, req.modelId);
  const wantsThinking = !!model?.supportsThinking;

  const body: Record<string, unknown> = {
    model: req.modelId,
    max_tokens: maxTokens,
    stream: true,
    system: systemPrompt,
    messages: buildAnthropicMessages(req.messages),
  };

  if (wantsThinking) {
    const budget = Math.min(Math.max(1024, Math.floor(maxTokens * 0.6)), maxTokens - 1024);
    body.thinking = { type: 'enabled', budget_tokens: budget };
    body.temperature = 1;
  } else {
    body.temperature = req.temperature ?? 0.7;
  }

  await post(
    {
      url,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    },
    (data) => {
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
    }
  );
};

function buildAnthropicMessages(messages: import('../../types').Message[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));
}
