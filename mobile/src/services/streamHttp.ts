// 移动端流式 HTTP：通过原生 OkHttp 插件发请求，逐行回流，绕过 WebView 的 CORS。
// 插件名 StreamHttp，在 MainActivity 里 registerPlugin 注册（见 android/）。
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { parseHttpError } from './sse';

export interface HttpReq {
  url: string;
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
  body: string;
}

interface LineEvent { requestId: string; line: string }
interface EndEvent { requestId: string }
interface ErrEvent { requestId: string; status?: number; body?: string; error?: string }

export interface HttpResponse { status: number; body: string }

export interface StreamHttpPlugin {
  // 一次性请求（非流式）：用于嗅探模型列表等需要读完整响应的场景
  request(options: { url: string; method?: string; headers?: Record<string, string>; body?: string }): Promise<HttpResponse>;
  postStream(options: { requestId: string; url: string; method?: string; headers?: Record<string, string>; body: string }): Promise<void>;
  cancel(options: { requestId: string }): Promise<void>;
  addListener(eventName: 'streamLine', listenerFn: (e: LineEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'streamEnd', listenerFn: (e: EndEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'streamError', listenerFn: (e: ErrEvent) => void): Promise<PluginListenerHandle>;
}

export const StreamHttp = registerPlugin<StreamHttpPlugin>('StreamHttp', {
  // web 端兜底（vite dev / 浏览器调试时）：request 用真 fetch（受 CORS 限制），postStream 不可用。
  web: {
    request: async (opts: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => {
      const res = await fetch(opts.url, { method: opts.method || 'GET', headers: opts.headers, body: opts.body });
      return { status: res.status, body: await res.text() };
    },
    postStream: async () => { throw new Error('StreamHttp 原生插件未注入（web 环境）'); },
    cancel: async () => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addListener: async (_e: string, _l: unknown) => ({ remove: async () => {} } as PluginListenerHandle),
  },
});

export type SSEPost = (req: HttpReq, onData: (data: string) => void) => Promise<void>;

/**
 * 以 requestId 为键发起一次流式 POST，把每条 `data:` 行（已剥前缀、去 [DONE]）回调 onData。
 * 非 2xx 响应：插件会读完整 body 并经 streamError 上报，这里转成抛错（消息已解析）。
 * 调用方如需取消：直接 StreamHttp.cancel({ requestId })。
 */
export function postSSE(requestId: string, req: HttpReq, onData: (data: string) => void): Promise<void> {
  let lineHandle: PluginListenerHandle | null = null;
  let endHandle: PluginListenerHandle | null = null;
  let errHandle: PluginListenerHandle | null = null;
  let buffer = '';

  const cleanup = async () => {
    await lineHandle?.remove();
    await endHandle?.remove();
    await errHandle?.remove();
  };

  return new Promise<void>(async (resolve, reject) => {
    try {
      [lineHandle, endHandle, errHandle] = await Promise.all([
        StreamHttp.addListener('streamLine', (e) => {
          if (e.requestId !== requestId) return;
          buffer += e.line + '\n';
          // 逐行处理（按 \n 切），保留未完结尾行到 buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data && data !== '[DONE]') onData(data);
          }
        }),
        StreamHttp.addListener('streamEnd', (e) => {
          if (e.requestId !== requestId) return;
          // flush
          if (buffer.startsWith('data:')) {
            const data = buffer.slice(5).trim();
            if (data && data !== '[DONE]') onData(data);
          }
          cleanup().finally(() => resolve());
        }),
        StreamHttp.addListener('streamError', (e) => {
          if (e.requestId !== requestId) return;
          cleanup().finally(() => {
            const msg = e.body
              ? parseHttpError(e.body, e.status ?? 0)
              : e.error || `HTTP ${e.status ?? '??'}`;
            reject(new Error(msg));
          });
        }),
      ]);

      await StreamHttp.postStream({
        requestId,
        url: req.url,
        method: req.method || 'POST',
        headers: req.headers,
        body: req.body,
      });
    } catch (err: any) {
      await cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
