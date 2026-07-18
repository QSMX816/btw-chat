// 简单的 SSE 流解析：把 fetch 的 ReadableStream 拆成 data: 行
export async function parseSSE(
  body: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  onEvent: (data: string) => void
): Promise<void> {
  const reader = isWebStream(body)
    ? (body as ReadableStream<Uint8Array>).getReader()
    : null;

  let buffer = '';

  if (reader) {
    // Web ReadableStream (fetch)
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data && data !== '[DONE]') onEvent(data);
        }
      }
    }
  } else {
    // Node stream
    const nodeStream = body as NodeJS.ReadableStream;
    for await (const chunk of nodeStream as any) {
      buffer += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data && data !== '[DONE]') onEvent(data);
        }
      }
    }
  }
  // flush
  if (buffer.startsWith('data:')) {
    const data = buffer.slice(5).trim();
    if (data && data !== '[DONE]') onEvent(data);
  }
}

function isWebStream(b: unknown): b is ReadableStream<Uint8Array> {
  return typeof ReadableStream !== 'undefined' && b instanceof ReadableStream;
}

// 检查响应并抛出带含义的错误
export async function extractError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      return j.error?.message || j.error?.code || j.message || text;
    } catch {
      return text || `HTTP ${res.status}`;
    }
  } catch {
    return `HTTP ${res.status}`;
  }
}
