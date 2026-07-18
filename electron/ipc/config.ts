import { ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC, Provider, Settings } from '../../src/types';

interface StoreSchema {
  providers: Provider[];
  settings: Settings;
  configVersion?: number;
}

// 内置模型默认值的版本；每次更新默认模型列表就 +1，
// 触发一次性迁移：内置提供商刷新成最新模型，保留用户的 Key/开关/自定义。
const CONFIG_VERSION = 2;

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
        { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', contextWindow: 400000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', contextWindow: 400000, supportsVision: true, supportsWebSearch: true },
        { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', contextWindow: 400000, supportsVision: true },
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
        { id: 'claude-fable-5', name: 'Claude Fable 5', contextWindow: 200000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', contextWindow: 200000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', contextWindow: 200000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, supportsVision: true },
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
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro', contextWindow: 2000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', contextWindow: 2000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', contextWindow: 1000000, supportsVision: true, supportsThinking: true, supportsWebSearch: true },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash', contextWindow: 1000000, supportsVision: true, supportsWebSearch: true },
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
        { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', contextWindow: 128000, supportsThinking: true },
        { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', contextWindow: 128000 },
        { id: 'deepseek-chat', name: 'DeepSeek Chat (旧)', contextWindow: 64000 },
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
        { id: 'kimi-k3', name: 'Kimi K3', contextWindow: 256000, supportsThinking: true },
        { id: 'kimi-k2.6', name: 'Kimi K2.6', contextWindow: 256000, supportsThinking: true },
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
        { id: 'glm-5.2', name: 'GLM-5.2 旗舰', contextWindow: 128000, supportsThinking: true },
        { id: 'glm-4.7', name: 'GLM-4.7', contextWindow: 128000, supportsThinking: true },
        { id: 'glm-4.7-flash', name: 'GLM-4.7 Flash', contextWindow: 128000 },
        { id: 'glm-4.6', name: 'GLM-4.6', contextWindow: 128000, supportsThinking: true },
        { id: 'glm-4.5', name: 'GLM-4.5', contextWindow: 128000, supportsThinking: true },
      ],
    },
  ];
}

export function defaultSettings(): Settings {
  return {
    theme: 'aurora',
    themeMode: 'dark',
    glassIntensity: 75,
    fontScale: 100,
    activeProviderId: 'openai',
    activeModelId: 'gpt-5.6-sol',
    webSearchEnabled: false,
    sendOnEnter: true,
    streamResponses: true,
    temperature: 0.7,
    maxTokens: 4096,
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

export function registerConfigHandlers() {
  ipcMain.handle(IPC.GET_PROVIDERS, () => {
    const version = store.get('configVersion') ?? 1;
    if (version < CONFIG_VERSION) {
      const migrated = migrateProviders(store.get('providers'));
      store.set('providers', migrated);
      const settings = fixActiveModel(migrated, store.get('settings'));
      store.set('settings', settings);
      store.set('configVersion', CONFIG_VERSION);
      return migrated;
    }
    return store.get('providers');
  });
  ipcMain.handle(IPC.SAVE_PROVIDERS, (_e, providers: Provider[]) => {
    store.set('providers', providers);
    return true;
  });
  ipcMain.handle(IPC.GET_SETTINGS, () => store.get('settings'));
  ipcMain.handle(IPC.SAVE_SETTINGS, (_e, settings: Settings) => {
    store.set('settings', settings);
    return true;
  });
}

export const configStore = store;
