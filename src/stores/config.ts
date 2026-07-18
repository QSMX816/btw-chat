import { create } from 'zustand';
import { Provider, Settings, ModelConfig } from '../types';

interface ConfigState {
  providers: Provider[];
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  setProviders: (p: Provider[]) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  getActiveProvider: () => Provider | undefined;
  getActiveModel: () => ModelConfig | undefined;
  setActiveModel: (providerId: string, modelId: string) => Promise<void>;
}

export const useConfig = create<ConfigState>((set, get) => ({
  providers: [],
  settings: {} as Settings,
  loaded: false,

  load: async () => {
    const [providers, settings] = await Promise.all([
      window.btw.getProviders(),
      window.btw.getSettings(),
    ]);
    set({ providers, settings, loaded: true });
  },

  setProviders: async (providers) => {
    await window.btw.saveProviders(providers);
    set({ providers });
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    await window.btw.saveSettings(next);
    set({ settings: next });
  },

  getActiveProvider: () => {
    const { providers, settings } = get();
    return providers.find((p) => p.id === settings.activeProviderId);
  },

  getActiveModel: () => {
    const p = get().getActiveProvider();
    const { settings } = get();
    return p?.models.find((m) => m.id === settings.activeModelId);
  },

  setActiveModel: async (providerId, modelId) => {
    await get().updateSettings({ activeProviderId: providerId, activeModelId: modelId });
  },
}));
