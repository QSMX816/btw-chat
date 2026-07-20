// 把 HTTP 错误响应体解析成可读消息（从 JSON 里挖 error.message，否则返回原文）
export function parseHttpError(body: string | undefined, status: number): string {
  if (!body) return `HTTP ${status}`;
  try {
    const j = JSON.parse(body);
    return j.error?.message || j.error?.code || j.message || body;
  } catch {
    return body || `HTTP ${status}`;
  }
}
