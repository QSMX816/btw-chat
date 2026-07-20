import { ProviderKind, SniffedModel } from '../../types';
import { StreamHttp } from '../streamHttp';
import { parseHttpError } from '../sse';

// 根据模型 id 命名规律猜是否支持深度思考 / 视觉
const THINKING_RE = /(\br1\b|reason|think|qwq|\bo[1-9]\b|deepseek-r|glm-z|kimi-k3|glm-5|glm-4\.6|glm-4\.7)/i;
const VISION_RE = /(vision|\bvl\b|gpt-4o|gpt-5|gemini|claude|multimodal|glm-4v|qwen-vl|kimi-k3|minimax-vl|internvl)/i;

function guessAbilities(id: string) {
  return {
    supportsThinking: THINKING_RE.test(id) || undefined,
    supportsVision: VISION_RE.test(id) || undefined,
  };
}

export async function sniffModels(params: {
  kind: ProviderKind;
  baseURL?: string;
  apiKey: string;
}): Promise<SniffedModel[]> {
  if (params.kind === 'anthropic') {
    throw new Error('Anthropic 官方不提供模型列表接口，请手动添加');
  }
  if (params.kind === 'google') return sniffGoogle(params.apiKey, params.baseURL);
  return sniffOpenAI(params.baseURL, params.apiKey);
}

async function sniffOpenAI(baseURL: string | undefined, apiKey: string): Promise<SniffedModel[]> {
  if (!baseURL) throw new Error('请填写 Base URL');
  const base = baseURL.replace(/\/$/, '');
  const url = base.endsWith('/models') ? base : `${base}/models`;

  const { status, body } = await StreamHttp.request({
    url,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  if (status >= 400) throw new Error(parseHttpError(body, status));

  const json = JSON.parse(body || '{}');
  const list: any[] = json.data || json.models || json;
  if (!Array.isArray(list)) throw new Error('返回格式无法识别');

  const out: SniffedModel[] = [];
  for (const m of list) {
    const id = typeof m === 'string' ? m : m.id || m.name;
    if (id && !out.some((x) => x.id === id)) out.push({ id, name: id, ...guessAbilities(id) });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

async function sniffGoogle(apiKey: string, baseURL?: string): Promise<SniffedModel[]> {
  if (!apiKey) throw new Error('请填写 API Key');
  const base = (baseURL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const url = `${base}/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`;

  const { status, body } = await StreamHttp.request({ url });
  if (status >= 400) throw new Error(parseHttpError(body, status));

  const json = JSON.parse(body || '{}');
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
