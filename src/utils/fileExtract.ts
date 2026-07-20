// 客户端文档抽文本：PDF / Word / Excel / 纯文本与代码，统一成纯文本喂给模型。
// 通用方案，不依赖各家原生文档 API。
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';

// pdfjs 需要 worker。Vite 会把这条 new Worker(new URL(...)) 单独打包。
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' }
);

// 抽取文本上限（字符数），避免把上下文撑爆。超出截断。
const MAX_CHARS = 120000;

export interface ExtractResult {
  text: string;
  truncated: boolean;
  pages?: number;
}

// 常见纯文本 / 代码扩展名
const TEXT_EXT = [
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'html', 'htm', 'log',
  'yaml', 'yml', 'ini', 'conf', 'toml', 'tex', 'srt', 'vtt',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'h', 'cpp', 'hpp',
  'cc', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'kts', 'scala', 'sh', 'bash',
  'zsh', 'ps1', 'sql', 'r', 'lua', 'pl', 'dart', 'vue', 'svelte', 'css', 'scss', 'less',
];

function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function isImage(file: { name: string; type: string }): boolean {
  return (file.type || '').startsWith('image/');
}

const DOC_EXT = new Set(['pdf', 'docx', 'xlsx', 'xls', ...TEXT_EXT]);

/** 是否是「可抽文本」的文档（非图片） */
export function isDocument(file: { name: string; type: string }): boolean {
  if (isImage(file)) return false;
  return DOC_EXT.has(ext(file.name));
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const e = ext(file.name);
  let text = '';
  let pages: number | undefined;
  try {
    if (e === 'pdf') {
      const r = await extractPdf(file);
      text = r.text;
      pages = r.pages;
    } else if (e === 'docx') {
      text = await extractDocx(file);
    } else if (e === 'xlsx' || e === 'xls') {
      text = await extractXlsx(file);
    } else {
      text = await file.text();
    }
  } catch (err: any) {
    throw new Error(err?.message || 'extract failed');
  }
  const truncated = text.length > MAX_CHARS;
  return {
    text: truncated ? text.slice(0, MAX_CHARS) : text,
    truncated,
    pages,
  };
}

async function extractPdf(file: File): Promise<{ text: string; pages: number }> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it: any) => ('str' in it ? it.str : '')).join(' '));
  }
  return { text: parts.join('\n\n'), pages: doc.numPages };
}

async function extractDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value || '';
}

async function extractXlsx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    parts.push(`# Sheet: ${name}\n` + XLSX.utils.sheet_to_csv(sheet));
  }
  return parts.join('\n\n');
}
