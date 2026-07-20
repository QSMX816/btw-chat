import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { Provider, Settings, ModelConfig } from '../types';

// ============ 默认提供商（与桌面端一致）============
export function defaultProviders(): Provider[] {
  return [
    {
      id: 'openai', kind: 'openai', name: 'OpenAI', apiKey: '', baseURL: 'https://api.openai.com/v1',
      enabled: true, builtIn: true,
      models: [
        { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', contextWindow: 400000, supportsVision: true, supportsThinking: true, inputPricePerM: 5, outputPricePerM: 30 },
        { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', contextWindow: 400000, supportsVision: true, inputPricePerM: 2.5, outputPricePerM: 15 },
        { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', contextWindow: 400000, supportsVision: true, inputPricePerM: 1, outputPricePerM: 6 },
      ],
    },
    {
      id: 'anthropic', kind: 'anthropic', name: 'Anthropic', apiKey: '', baseURL: 'https://api.anthropic.com',
      enabled: true, builtIn: true,
      models: [
        { id: 'claude-fable-5', name: 'Claude Fable 5', contextWindow: 1000000, supportsVision: true, supportsThinking: true, inputPricePerM: 10, outputPricePerM: 50 },
        { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', contextWindow: 1000000, supportsVision: true, supportsThinking: true, inputPricePerM: 5, outputPricePerM: 25 },
        { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', contextWindow: 1000000, supportsVision: true, supportsThinking: true, inputPricePerM: 3, outputPricePerM: 15 },
        { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, supportsVision: true, inputPricePerM: 1, outputPricePerM: 5 },
      ],
    },
    {
      id: 'google', kind: 'google', name: 'Google Gemini', apiKey: '', enabled: true, builtIn: true,
      models: [
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro', contextWindow: 2000000, supportsVision: true, supportsThinking: true, inputPricePerM: 2, outputPricePerM: 12 },
        { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', contextWindow: 2000000, supportsVision: true, supportsThinking: true, inputPricePerM: 2, outputPricePerM: 12 },
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', contextWindow: 1000000, supportsVision: true, supportsThinking: true, inputPricePerM: 1.5, outputPricePerM: 9 },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash', contextWindow: 1000000, supportsVision: true, inputPricePerM: 0.5, outputPricePerM: 3 },
      ],
    },
    {
      id: 'deepseek', kind: 'openai-compatible', name: 'DeepSeek', apiKey: '', baseURL: 'https://api.deepseek.com/v1',
      enabled: false, builtIn: true,
      models: [
        { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', contextWindow: 1000000, supportsThinking: true, inputPricePerM: 0.435, outputPricePerM: 0.87 },
        { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', contextWindow: 1000000, inputPricePerM: 0.14, outputPricePerM: 0.28 },
        { id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: 64000, inputPricePerM: 0.27, outputPricePerM: 1.1 },
      ],
    },
    {
      id: 'moonshot', kind: 'openai-compatible', name: 'Moonshot (Kimi)', apiKey: '', baseURL: 'https://api.moonshot.cn/v1',
      enabled: false, builtIn: true,
      models: [
        { id: 'kimi-k3', name: 'Kimi K3', contextWindow: 1000000, supportsThinking: true, supportsVision: true, inputPricePerM: 3, outputPricePerM: 15 },
        { id: 'kimi-k2.6', name: 'Kimi K2.6', contextWindow: 256000, supportsThinking: true, inputPricePerM: 0.9, outputPricePerM: 3.75 },
      ],
    },
    {
      id: 'zhipu', kind: 'openai-compatible', name: '智谱 GLM', apiKey: '', baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      enabled: false, builtIn: true,
      models: [
        { id: 'glm-5.2', name: 'GLM-5.2', contextWindow: 128000, supportsThinking: true, inputPricePerM: 1.1, outputPricePerM: 3.9 },
        { id: 'glm-4.7', name: 'GLM-4.7', contextWindow: 128000, supportsThinking: true, inputPricePerM: 0.6, outputPricePerM: 2.2 },
        { id: 'glm-4.7-flash', name: 'GLM-4.7 Flash', contextWindow: 128000, inputPricePerM: 0.15, outputPricePerM: 0.6 },
        { id: 'glm-4.6', name: 'GLM-4.6', contextWindow: 128000, supportsThinking: true, inputPricePerM: 0.5, outputPricePerM: 1.8 },
        { id: 'glm-4.5', name: 'GLM-4.5', contextWindow: 128000, supportsThinking: true, inputPricePerM: 0.84, outputPricePerM: 3.36 },
      ],
    },
  ];
}

export function defaultSettings(): Settings {
  return {
    theme: 'aurora',
    themeMode: 'auto',
    language: 'auto',
    fontScale: 100,
    activeProviderId: 'openai',
    activeModelId: 'gpt-5.6-sol',
    webSearchEnabled: false,
    sendOnEnter: false, // 移动端默认关：用键盘发送键换行
    streamResponses: true,
    temperature: 0.7,
    maxTokens: 0,
    systemPrompt: '',
  };
}

// 把内置提供商刷新成最新默认（保留用户 apiKey/enabled/baseURL 与自定义提供商）
function mergeProviders(stored: Provider[]): Provider[] {
  const defaults = defaultProviders();
  const out: Provider[] = [];
  const seen = new Set<string>();
  for (const d of defaults) {
    const p = stored.find((s) => s.id === d.id);
    out.push({
      ...d,
      apiKey: p?.apiKey ?? '',
      enabled: p?.enabled ?? d.enabled,
      baseURL: p?.baseURL || d.baseURL,
    });
    seen.add(d.id);
  }
  for (const s of stored) if (!seen.has(s.id)) out.push(s);
  return out;
}

function fixActiveModel(providers: Provider[], settings: Settings): Settings {
  const exists = providers.some((p) => p.models.some((m) => m.id === settings.activeModelId));
  if (exists) return settings;
  const first = providers.find((p) => p.enabled && p.apiKey) || providers.find((p) => p.enabled) || providers[0];
  if (first) return { ...settings, activeProviderId: first.id, activeModelId: first.models[0]?.id ?? settings.activeModelId };
  return settings;
}

interface ConfigState {
  providers: Provider[];
  settings: Settings;
  loaded: boolean;
  load(): Promise<void>;
  setProviders(p: Provider[]): Promise<void>;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  activeProvider(): Provider | undefined;
  activeModel(): ModelConfig | undefined;
}

export const useConfig = create<ConfigState>((set, get) => ({
  providers: defaultProviders(),
  settings: defaultSettings(),
  loaded: false,

  async load() {
    try {
      const [{ value: pv }, { value: sv }] = await Promise.all([
        Preferences.get({ key: 'providers' }),
        Preferences.get({ key: 'settings' }),
      ]);
      let providers = pv ? (JSON.parse(pv) as Provider[]) : defaultProviders();
      let settings = sv ? { ...defaultSettings(), ...(JSON.parse(sv) as Partial<Settings>) } : defaultSettings();
      if (pv) providers = mergeProviders(providers);
      settings = fixActiveModel(providers, settings);
      set({ providers, settings, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  async setProviders(providers) {
    set({ providers });
    await Preferences.set({ key: 'providers', value: JSON.stringify(providers) });
  },

  async updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await Preferences.set({ key: 'settings', value: JSON.stringify(settings) });
  },

  activeProvider() {
    const { providers, settings } = get();
    return providers.find((p) => p.id === settings.activeProviderId);
  },

  activeModel() {
    const p = get().activeProvider();
    return p?.models.find((m) => m.id === get().settings.activeModelId);
  },
}));

// 触发 store 初始化（首次 import 时读取本地配置）
export function ensureConfigLoaded() {
  return useConfig.getState().load();
}
