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
  supportsThinking?: boolean;
  supportsVision?: boolean;
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

// 启发式：根据模型 id 判断是否支持深度思考 / 视觉。/models 接口不返回这些能力，
// 只能按命名规律猜；猜不中的用户可在设置里手动开关。
const THINKING_RE = /(\br1\b|reason|think|qwq|\bo[1-9]\b|deepseek-r|glm-z|kimi-k3|glm-5|glm-4\.6|glm-4\.7)/i;
const VISION_RE = /(vision|\bvl\b|gpt-4o|gpt-5|gemini|claude|multimodal|glm-4v|qwen-vl|kimi-k3|minimax-vl|internvl)/i;

function guessAbilities(id: string): { supportsThinking?: boolean; supportsVision?: boolean } {
  return {
    supportsThinking: THINKING_RE.test(id) || undefined,
    supportsVision: VISION_RE.test(id) || undefined,
  };
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
    if (id && !out.some((x) => x.id === id)) {
      out.push({ id, name: id, ...guessAbilities(id) });
    }
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
    if (id && !out.some((x) => x.id === id)) {
      out.push({ id, name: m.displayName || id, ...guessAbilities(id) });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
