import { ipcMain } from 'electron';
import { IPC, ProviderKind } from '../../src/types';

interface SniffParams {
  kind: ProviderKind;
  baseURL?: string;
  apiKey: string;
}

interface SniffedModel {
  id: string;
  name: string;
}

// 根据协议嗅探可用模型列表
export function registerSniffHandlers() {
  ipcMain.handle(IPC.SNIFF_MODELS, async (_e, params: SniffParams): Promise<{ models: SniffedModel[]; error?: string }> => {
    try {
      const models = await sniff(params);
      return { models };
    } catch (err: any) {
      return { models: [], error: err?.message || '嗅探失败' };
    }
  });
}

async function sniff({ kind, baseURL, apiKey }: SniffParams): Promise<SniffedModel[]> {
  if (kind === 'anthropic') {
    throw new Error('Anthropic 官方不提供模型列表接口，请手动添加或使用内置模型');
  }

  if (kind === 'google') {
    return sniffGoogle(apiKey, baseURL);
  }

  // openai / openai-compatible / custom → 标准 /models
  return sniffOpenAI(baseURL, apiKey);
}

async function sniffOpenAI(baseURL: string | undefined, apiKey: string): Promise<SniffedModel[]> {
  if (!baseURL) throw new Error('请填写 Base URL');
  const base = baseURL.replace(/\/$/, '');
  const url = base.endsWith('/models') ? base : `${base}/models`;

  const res = await fetch(url, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();

  // 兼容 { data: [...] } 或裸数组
  const list: any[] = json.data || json.models || json;
  if (!Array.isArray(list)) throw new Error('返回格式无法识别');

  const out: SniffedModel[] = [];
  for (const m of list) {
    const id = typeof m === 'string' ? m : m.id || m.name;
    if (id && !out.some((x) => x.id === id)) out.push({ id, name: id });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

async function sniffGoogle(apiKey: string, baseURL?: string): Promise<SniffedModel[]> {
  if (!apiKey) throw new Error('请填写 API Key');
  const base = (baseURL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const url = `${base}/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();

  const list: any[] = json.models || [];
  const out: SniffedModel[] = [];
  for (const m of list) {
    const methods: string[] = m.supportedGenerationMethods || [];
    if (!methods.includes('generateContent') && !methods.includes('streamGenerateContent')) continue;
    const id = (m.name || '').replace(/^models\//, '');
    if (id && !out.some((x) => x.id === id)) out.push({ id, name: m.displayName || id });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
