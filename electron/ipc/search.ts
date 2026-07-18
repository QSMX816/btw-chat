import { ipcMain } from 'electron';
import { IPC } from '../../src/types';

// 联网搜索：使用 DuckDuckGo HTML（无需 API Key），解析即时结果
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export function registerSearchHandlers() {
  ipcMain.handle(IPC.WEB_SEARCH, async (_e, query: string): Promise<{ results: SearchResult[]; formatted: string }> => {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
      });
      const html = await res.text();
      const results = parseDuckDuckGo(html).slice(0, 8);

      const formatted = results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
        .join('\n\n');

      return { results, formatted };
    } catch (err: any) {
      return { results: [], formatted: `搜索失败: ${err?.message}` };
    }
  });
}

function parseDuckDuckGo(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  // 结果块
  const blockRe = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(html)) && results.length < 10) {
    const url = decodeDuckUrl(m[1]);
    const title = stripTags(m[2]).trim();
    const snippet = stripTags(m[3]).trim();
    if (title && url) results.push({ title, url, snippet });
  }
  return results;
}

function decodeDuckUrl(href: string): string {
  const match = href.match(/uddg=([^&]+)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return href;
    }
  }
  return href.startsWith('http') ? href : 'https://duckduckgo.com' + href;
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'");
}
