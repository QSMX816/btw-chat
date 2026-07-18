import { Provider, Message } from '../../src/types';
import { extractError } from './sse';
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

// Google Gemini —— 使用 SSE 流式端点
export async function streamGoogle(
  provider: Provider,
  req: StreamRequest,
  emit: (c: ChunkEmitter) => void,
  signal: AbortSignal
) {
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

  const model = provider.models.find((m) => m.id === req.modelId);
  const generationConfig: Record<string, unknown> = {
    temperature: req.temperature ?? 0.7,
  };
  // maxTokens = 0 表示不限：不传 maxOutputTokens，让模型用默认上限
  if (req.maxTokens && req.maxTokens > 0) {
    generationConfig.maxOutputTokens = req.maxTokens;
  }
  if (model?.supportsThinking) {
    generationConfig.thinkingConfig = { includeThoughts: true };
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig,
  };
  if (req.systemPrompt) {
    body.systemInstruction = { parts: [{ text: req.systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await extractError(res));
  }

  // Gemini SSE 每条是 candidates[0].content.parts[]
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const parts = json.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.thought || part.thoughtSignature) {
            // Gemini 2.5 thinking (thought=true 标记)
            if (part.text) emit({ type: 'reasoning', reasoning: part.text });
          } else if (part.text) {
            emit({ type: 'text', content: part.text });
          }
        }
        // ground metadata / 思考摘要
        const grounding = json.candidates?.[0]?.groundingMetadata;
        if (grounding) emit({ type: 'tool', content: 'grounding' });
      } catch {
        /* ignore */
      }
    }
  }
}
