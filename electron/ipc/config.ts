import { ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC, Provider, Settings, ModelConfig } from '../../src/types';

interface StoreSchema {
  providers: Provider[];
  settings: Settings;
  configVersion?: number;
}

// 内置模型默认值的版本；每次更新默认模型列表就 +1，
// 触发一次性迁移：内置提供商刷新成最新模型，保留用户的 Key/开关/自定义。
const CONFIG_VERSION = 4;

const store = new Store<StoreSchema>({
  defaults: {
    providers: defaultProviders(),
    settings: defaultSettings(),
    configVersion: 1,
  },
});

export function defaultProviders(): Provider[] {
  return [
    {
      id: 'openai',
      kind: 'openai',
      name: 'OpenAI',
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
      enabled: true,
      builtIn: true,
      models: [
        { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', contextWindow: 400000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 5, outputPricePerM: 30 },
        { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', contextWindow: 400000, supportsVision: true, supportsWebSearch: true, inputPricePerM: 2.5, outputPricePerM: 15 },
        { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', contextWindow: 400000, supportsVision: true, inputPricePerM: 1, outputPricePerM: 6 },
      ],
    },
    {
      id: 'anthropic',
      kind: 'anthropic',
      name: 'Anthropic',
      apiKey: '',
      baseURL: 'https://api.anthropic.com',
      enabled: true,
      builtIn: true,
      models: [
        { id: 'claude-fable-5', name: 'Claude Fable 5', contextWindow: 1000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 10, outputPricePerM: 50 },
        { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', contextWindow: 1000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 5, outputPricePerM: 25 },
        { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', contextWindow: 1000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 3, outputPricePerM: 15 },
        { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, supportsVision: true, inputPricePerM: 1, outputPricePerM: 5 },
      ],
    },
    {
      id: 'google',
      kind: 'google',
      name: 'Google Gemini',
      apiKey: '',
      enabled: true,
      builtIn: true,
      models: [
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro', contextWindow: 2000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 2, outputPricePerM: 12 },
        { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', contextWindow: 2000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 2, outputPricePerM: 12 },
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', contextWindow: 1000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true, inputPricePerM: 1.5, outputPricePerM: 9 },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash', contextWindow: 1000000, supportsVision: true, supportsWebSearch: true, inputPricePerM: 0.5, outputPricePerM: 3 },
      ],
    },
    {
      id: 'deepseek',
      kind: 'openai-compatible',
      name: 'DeepSeek',
      apiKey: '',
      baseURL: 'https://api.deepseek.com/v1',
      enabled: false,
      builtIn: true,
      models: [
        { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', contextWindow: 1000000, supportsThinking: true, inputPricePerM: 0.435, outputPricePerM: 0.87 },
        { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', contextWindow: 1000000, inputPricePerM: 0.14, outputPricePerM: 0.28 },
        { id: 'deepseek-chat', name: 'DeepSeek Chat (旧)', contextWindow: 64000, inputPricePerM: 0.27, outputPricePerM: 1.1 },
      ],
    },
    {
      id: 'moonshot',
      kind: 'openai-compatible',
      name: 'Moonshot (Kimi)',
      apiKey: '',
      baseURL: 'https://api.moonshot.cn/v1',
      enabled: false,
      builtIn: true,
      models: [
        { id: 'kimi-k3', name: 'Kimi K3', contextWindow: 1000000, supportsThinking: true, supportsVision: true, inputPricePerM: 3, outputPricePerM: 15 },
        { id: 'kimi-k2.6', name: 'Kimi K2.6', contextWindow: 256000, supportsThinking: true, inputPricePerM: 0.9, outputPricePerM: 3.75 },
      ],
    },
    {
      id: 'zhipu',
      kind: 'openai-compatible',
      name: '智谱 GLM',
      apiKey: '',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      enabled: false,
      builtIn: true,
      models: [
        { id: 'glm-5.2', name: 'GLM-5.2 旗舰', contextWindow: 128000, supportsThinking: true, inputPricePerM: 1.1, outputPricePerM: 3.9 },
        { id: 'glm-4.7', name: 'GLM-4.7', contextWindow: 128000, supportsThinking: true, inputPricePerM: 0.6, outputPricePerM: 2.2 },
        { id: 'glm-4.7-flash', name: 'GLM-4.7 Flash', contextWindow: 128000, inputPricePerM: 0.15, outputPricePerM: 0.6 },
        { id: 'glm-4.6', name: 'GLM-4.6', contextWindow: 128000, supportsThinking: true, inputPricePerM: 0.5, outputPricePerM: 1.8 },
        { id: 'glm-4.5', name: 'GLM-4.5', contextWindow: 128000, supportsThinking: true, inputPricePerM: 0.84, outputPricePerM: 3.36 },
      ],
    },
  ];
}

// v4 迁移：把内置模型最新的上下文窗口与价格 patch 进已有配置（不动用户的自定义模型/Key/开关）。
// 价格来源：各厂商官网 + 第三方聚合（2026-07），近似值，仅用于费用估算。
const MODEL_PATCHES_v4: Record<string, Record<string, Partial<ModelConfig>>> = {
  openai: {
    'gpt-5.6-sol': { contextWindow: 400000, inputPricePerM: 5, outputPricePerM: 30 },
    'gpt-5.6-terra': { contextWindow: 400000, inputPricePerM: 2.5, outputPricePerM: 15 },
    'gpt-5.6-luna': { contextWindow: 400000, inputPricePerM: 1, outputPricePerM: 6 },
  },
  anthropic: {
    'claude-fable-5': { contextWindow: 1000000, inputPricePerM: 10, outputPricePerM: 50 },
    'claude-opus-4-8': { contextWindow: 1000000, inputPricePerM: 5, outputPricePerM: 25 },
    'claude-sonnet-5': { contextWindow: 1000000, inputPricePerM: 3, outputPricePerM: 15 },
    'claude-haiku-4-5-20251001': { contextWindow: 200000, inputPricePerM: 1, outputPricePerM: 5 },
  },
  google: {
    'gemini-3-pro': { contextWindow: 2000000, inputPricePerM: 2, outputPricePerM: 12 },
    'gemini-3.1-pro': { contextWindow: 2000000, inputPricePerM: 2, outputPricePerM: 12 },
    'gemini-3.5-flash': { contextWindow: 1000000, inputPricePerM: 1.5, outputPricePerM: 9 },
    'gemini-3-flash': { contextWindow: 1000000, inputPricePerM: 0.5, outputPricePerM: 3 },
  },
  deepseek: {
    'deepseek-v4-pro': { contextWindow: 1000000, inputPricePerM: 0.435, outputPricePerM: 0.87 },
    'deepseek-v4-flash': { contextWindow: 1000000, inputPricePerM: 0.14, outputPricePerM: 0.28 },
    'deepseek-chat': { inputPricePerM: 0.27, outputPricePerM: 1.1 },
  },
  moonshot: {
    'kimi-k3': { contextWindow: 1000000, supportsVision: true, inputPricePerM: 3, outputPricePerM: 15 },
    'kimi-k2.6': { inputPricePerM: 0.9, outputPricePerM: 3.75 },
  },
  zhipu: {
    'glm-5.2': { inputPricePerM: 1.1, outputPricePerM: 3.9 },
    'glm-4.7': { inputPricePerM: 0.6, outputPricePerM: 2.2 },
    'glm-4.7-flash': { inputPricePerM: 0.15, outputPricePerM: 0.6 },
    'glm-4.6': { inputPricePerM: 0.5, outputPricePerM: 1.8 },
    'glm-4.5': { inputPricePerM: 0.84, outputPricePerM: 3.36 },
  },
};

function applyModelPatches(providers: Provider[]): Provider[] {
  for (const p of providers) {
    const patches = MODEL_PATCHES_v4[p.id];
    if (!patches) continue;
    for (const m of p.models) {
      const patch = patches[m.id];
      if (patch) Object.assign(m, patch);
    }
  }
  return providers;
}

export function defaultSettings(): Settings {
  return {
    theme: 'aurora',
    themeMode: 'dark',
    language: 'auto',
    glassIntensity: 75,
    fontScale: 100,
    activeProviderId: 'openai',
    activeModelId: 'gpt-5.6-sol',
    webSearchEnabled: false,
    sendOnEnter: true,
    streamResponses: true,
    temperature: 0.7,
    maxTokens: 0,
    systemPrompt: '',
  };
}

// 一次性迁移：内置提供商刷新成最新默认模型，保留用户的 apiKey/enabled/baseURL 与自定义提供商
function migrateProviders(stored: Provider[]): Provider[] {
  const defaults = defaultProviders();
  const out: Provider[] = [];
  const seen = new Set<string>();
  for (const d of defaults) {
    const persisted = stored.find((s) => s.id === d.id);
    out.push({
      ...d,
      apiKey: persisted?.apiKey ?? '',
      enabled: persisted?.enabled ?? d.enabled,
      baseURL: persisted?.baseURL || d.baseURL,
    });
    seen.add(d.id);
  }
  // 用户自定义（非内置）提供商原样保留
  for (const s of stored) {
    if (!seen.has(s.id)) out.push(s);
  }
  return out;
}

// 若当前选中模型已不存在（如旧的 gpt-4o），回退到第一个可用模型
function fixActiveModel(providers: Provider[], settings: Settings): Settings {
  const exists = providers.some((p) => p.models.some((m) => m.id === settings.activeModelId));
  if (exists) return settings;
  const first = providers.find((p) => p.enabled && p.apiKey) || providers.find((p) => p.enabled) || providers[0];
  if (first) {
    return { ...settings, activeProviderId: first.id, activeModelId: first.models[0]?.id ?? settings.activeModelId };
  }
  return settings;
}

// 一次性迁移：根据 configVersion 增量升级 providers 与 settings
function runMigrations() {
  const version = store.get('configVersion') ?? 1;
  if (version >= CONFIG_VERSION) return;

  if (version < 2) {
    store.set('providers', migrateProviders(store.get('providers')));
  }

  const settings = store.get('settings');
  if (version < 3) {
    // v3：maxTokens 默认改为"不限"（0）。旧版默认 4096 的用户一并切到不限；
    // 用户若自己设过别的值则保留。
    if (!settings.maxTokens || settings.maxTokens === 4096) {
      settings.maxTokens = 0;
    }
  }
  // v4：补 language 默认值
  if (!settings.language) {
    settings.language = 'auto';
  }
  store.set('settings', settings);

  // v4：把内置模型最新的上下文窗口与价格 patch 进已有配置
  if (version < 4) {
    store.set('providers', applyModelPatches(store.get('providers')));
  }

  const providers = store.get('providers');
  store.set('settings', fixActiveModel(providers, store.get('settings')));
  store.set('configVersion', CONFIG_VERSION);
}

export function registerConfigHandlers() {
  ipcMain.handle(IPC.GET_PROVIDERS, () => {
    runMigrations();
    return store.get('providers');
  });
  ipcMain.handle(IPC.SAVE_PROVIDERS, (_e, providers: Provider[]) => {
    store.set('providers', providers);
    return true;
  });
  ipcMain.handle(IPC.GET_SETTINGS, () => {
    runMigrations();
    return store.get('settings');
  });
  ipcMain.handle(IPC.SAVE_SETTINGS, (_e, settings: Settings) => {
    store.set('settings', settings);
    return true;
  });
}

export const configStore = store;
