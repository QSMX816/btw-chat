import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useConfig } from '../stores/config';
import { useT } from '../i18n';
import { ThemeName, ThemeMode, Provider, ProviderKind, ModelConfig } from '../types';
import { sniffModels } from '../services/providers/sniff';
import { BackIcon, PlusIcon, TrashIcon, ChevronDownIcon, CheckIcon, XIcon } from './Icons';

const THEME_GRAD: Record<ThemeName, string> = {
  aurora: 'linear-gradient(135deg,#0a84ff,#bf5af2)',
  sunset: 'linear-gradient(135deg,#ff6b6b,#ffa45c,#ff8fab)',
  ocean: 'linear-gradient(135deg,#00c6ff,#0072ff)',
  midnight: 'linear-gradient(135deg,#5e5ce6,#bf5af2)',
  forest: 'linear-gradient(135deg,#2ecc71,#16a085)',
  rose: 'linear-gradient(135deg,#ff5f87,#c44569)',
};
const THEMES: { id: ThemeName; zh: string; en: string }[] = [
  { id: 'aurora', zh: '极光', en: 'Aurora' },
  { id: 'sunset', zh: '日落', en: 'Sunset' },
  { id: 'ocean', zh: '海洋', en: 'Ocean' },
  { id: 'midnight', zh: '午夜', en: 'Midnight' },
  { id: 'forest', zh: '森林', en: 'Forest' },
  { id: 'rose', zh: '玫瑰', en: 'Rose' },
];

const KINDS: { id: ProviderKind; label: string }[] = [
  { id: 'openai-compatible', label: 'kindOpenAiCompat' },
  { id: 'openai', label: 'kindOpenAi' },
  { id: 'anthropic', label: 'kindAnthropic' },
  { id: 'google', label: 'kindGoogle' },
  { id: 'custom', label: 'kindCustom' },
];

type Tab = 'appearance' | 'providers' | 'chat' | 'about';

export const SettingsModal: React.FC<{ leaving?: boolean; onClose: () => void }> = ({ leaving, onClose }) => {
  const { t } = useT();
  const cfg = useConfig();
  const [tab, setTab] = useState<Tab>('providers');

  return (
    <div className="sheet" data-leaving={leaving || undefined}>
      <div className="sheet-bar">
        <button className="icon-btn" onClick={onClose}><BackIcon size={22} /></button>
        <div className="sheet-title">{t.settings}</div>
      </div>
      <div className="settings-tabs">
        <button className={`settings-tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>{t.setTabAppearance}</button>
        <button className={`settings-tab ${tab === 'providers' ? 'active' : ''}`} onClick={() => setTab('providers')}>{t.setTabProviders}</button>
        <button className={`settings-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>{t.setTabChat}</button>
        <button className={`settings-tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>{t.setTabAbout}</button>
      </div>

      <div className="sheet-body">
        {tab === 'appearance' && <AppearanceTab />}
        {tab === 'providers' && <ProvidersTab />}
        {tab === 'chat' && <ChatTab />}
        {tab === 'about' && (
          <div className="settings-body">
            <div className="empty-state" style={{ flex: 0, padding: '40px 24px' }}>
              <div className="empty-logo">BTW</div>
              <div className="empty-title">{t.appName}</div>
              <div className="empty-sub">{t.setAboutDesc}</div>
              <div className="empty-sub" style={{ marginTop: 8 }}>{t.setAboutProviders}</div>
              <div className="empty-sub" style={{ marginTop: 8 }}>{t.setAboutFeatures}</div>
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-tertiary)' }}>{t.setAboutVersion} 1.2.0 · Android</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppearanceTab: React.FC = () => {
  const { t, lang } = useT();
  const cfg = useConfig();
  const s = cfg.settings;
  return (
    <div className="settings-body">
      <div className="setting-group">
        <div className="setting-label">{t.setLanguage}</div>
        <div className="segment">
          <button className={`segment-btn ${s.language === 'auto' ? 'active' : ''}`} onClick={() => cfg.updateSettings({ language: 'auto' })}>{t.langFollowSystem}</button>
          <button className={`segment-btn ${s.language === 'zh' ? 'active' : ''}`} onClick={() => cfg.updateSettings({ language: 'zh' })}>{t.langZh}</button>
          <button className={`segment-btn ${s.language === 'en' ? 'active' : ''}`} onClick={() => cfg.updateSettings({ language: 'en' })}>{t.langEn}</button>
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setTheme}</div>
        <div className="theme-grid">
          {THEMES.map((th) => (
            <div
              key={th.id}
              className={`theme-card ${s.theme === th.id ? 'selected' : ''}`}
              style={{ background: THEME_GRAD[th.id] }}
              onClick={() => cfg.updateSettings({ theme: th.id })}
            >
              <div className="theme-card-check"><CheckIcon size={12} /></div>
              <div className="theme-card-name">{lang === 'zh' ? th.zh : th.en}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setDisplayMode}</div>
        <div className="segment">
          {(['light', 'dark', 'auto'] as ThemeMode[]).map((m) => (
            <button
              key={m}
              className={`segment-btn ${s.themeMode === m ? 'active' : ''}`}
              onClick={() => cfg.updateSettings({ themeMode: m })}
            >
              {m === 'light' ? t.modeLight : m === 'dark' ? t.modeDark : t.modeAuto}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setFontSize}</div>
        <div className="setting-row">
          <div className="setting-row-main">
            <div className="setting-row-title">{s.fontScale}%</div>
          </div>
          <input
            type="range" min={80} max={140} step={5} value={s.fontScale}
            onChange={(e) => cfg.updateSettings({ fontScale: Number(e.target.value) })}
            style={{ width: 160 }}
          />
        </div>
      </div>
    </div>
  );
};

const ProvidersTab: React.FC = () => {
  const { t } = useT();
  const cfg = useConfig();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sniffing, setSniffing] = useState<string | null>(null);
  const [newModel, setNewModel] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const patchProvider = (id: string, fn: (p: Provider) => Provider) => {
    const next = cfg.providers.map((p) => (p.id === id ? fn(p) : p));
    void cfg.setProviders(next);
  };

  const doSniff = async (p: Provider) => {
    setSniffing(p.id);
    setErr(null);
    try {
      const models = await sniffModels({ kind: p.kind, baseURL: p.baseURL, apiKey: p.apiKey });
      if (!models.length) { setErr(t.sniffEmpty); return; }
      patchProvider(p.id, (pr) => {
        const ids = new Set(pr.models.map((m) => m.id));
        const merged = [...pr.models];
        for (const sm of models) {
          if (!ids.has(sm.id)) merged.push({ id: sm.id, name: sm.name, supportsThinking: sm.supportsThinking, supportsVision: sm.supportsVision });
          else {
            const ex = merged.find((m) => m.id === sm.id)!;
            if (sm.supportsThinking) ex.supportsThinking = true;
            if (sm.supportsVision) ex.supportsVision = true;
          }
        }
        return { ...pr, models: merged };
      });
    } catch (e: any) {
      setErr(e?.message || 'sniff failed');
    } finally {
      setSniffing(null);
    }
  };

  const addModel = (p: Provider) => {
    const id = (newModel[p.id] || '').trim();
    if (!id) return;
    patchProvider(p.id, (pr) => pr.models.some((m) => m.id === id) ? pr : { ...pr, models: [...pr.models, { id, name: id }] });
    setNewModel((m) => ({ ...m, [p.id]: '' }));
  };

  const removeModel = (p: Provider, id: string) =>
    patchProvider(p.id, (pr) => ({ ...pr, models: pr.models.filter((m) => m.id !== id) }));

  const addCustom = () => {
    const id = 'custom-' + uuid().slice(0, 6);
    const np: Provider = {
      id, kind: 'openai-compatible', name: 'Custom', apiKey: '', baseURL: 'https://api.example.com/v1',
      enabled: true, models: [],
    };
    void cfg.setProviders([...cfg.providers, np]);
    setExpanded((s) => new Set(s).add(id));
  };

  const removeProvider = (id: string) => {
    if (!window.confirm(t.setRemoveProvider + '?')) return;
    void cfg.setProviders(cfg.providers.filter((p) => p.id !== id));
  };

  return (
    <div className="settings-body">
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{t.setApiKeyHint}</div>
      {err && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{err}</div>}

      {cfg.providers.map((p) => {
        const open = expanded.has(p.id);
        return (
          <div className="provider-card" key={p.id}>
            <div className="provider-head" onClick={() => toggle(p.id)}>
              <span className={`switch ${p.enabled ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); patchProvider(p.id, (pr) => ({ ...pr, enabled: !pr.enabled })); }} />
              <div className="provider-name">{p.name}</div>
              <span className="provider-kind">{t[(KINDS.find((k) => k.id === p.kind)?.label || 'kindCustom') as keyof typeof t]}</span>
              <ChevronDownIcon size={18} style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }} />
            </div>

            {open && (
              <div className="provider-body">
                <input
                  className="field-input mono" placeholder={t.setApiKey} value={p.apiKey}
                  onChange={(e) => patchProvider(p.id, (pr) => ({ ...pr, apiKey: e.target.value }))}
                />
                {(p.kind === 'openai-compatible' || p.kind === 'openai' || p.kind === 'custom') && (
                  <input
                    className="field-input mono" placeholder={t.setBaseUrl} value={p.baseURL || ''}
                    onChange={(e) => patchProvider(p.id, (pr) => ({ ...pr, baseURL: e.target.value }))}
                  />
                )}
                {p.kind !== 'anthropic' && (
                  <button className="btn-sniff" disabled={sniffing === p.id} onClick={() => doSniff(p)}>
                    {sniffing === p.id ? t.setSniffing : t.setSniff}
                  </button>
                )}

                {p.models.length > 0 && (
                  <div className="provider-models">
                    {p.models.map((m) => (
                      <span key={m.id} className="model-chip">
                        {m.supportsThinking && '🧠'}{m.supportsVision && '👁'} {m.name}
                        <button className="model-chip-x" onClick={() => removeModel(p, m.id)}><XIcon size={13} /></button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="field-input mono" placeholder={t.setAddModelPh}
                    value={newModel[p.id] || ''}
                    onChange={(e) => setNewModel((m) => ({ ...m, [p.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addModel(p); }}
                  />
                  <button className="icon-btn" style={{ background: 'var(--glass-bg)' }} onClick={() => addModel(p)}><PlusIcon size={18} /></button>
                </div>

                <button className="btn-danger" onClick={() => removeProvider(p.id)}>{t.setRemoveProvider}</button>
              </div>
            )}
          </div>
        );
      })}

      <button className="btn-sniff" style={{ marginTop: 4 }} onClick={addCustom}>
        <PlusIcon size={16} /> {t.setAddCustom}
      </button>
    </div>
  );
};

const ChatTab: React.FC = () => {
  const { t } = useT();
  const cfg = useConfig();
  const s = cfg.settings;
  const unlimited = !s.maxTokens || s.maxTokens === 0;
  return (
    <div className="settings-body">
      <div className="setting-group">
        <div className="setting-label">{t.setDefaults}</div>
        <div className="setting-row">
          <div className="setting-row-main"><div className="setting-row-title">{t.setStreaming}</div><div className="setting-row-desc">{t.setStreamingDesc}</div></div>
          <span className={`switch ${s.streamResponses ? 'on' : ''}`} onClick={() => cfg.updateSettings({ streamResponses: !s.streamResponses })} />
        </div>
        <div className="setting-row">
          <div className="setting-row-main"><div className="setting-row-title">{t.setEnterSend}</div><div className="setting-row-desc">{t.setEnterSendDesc}</div></div>
          <span className={`switch ${s.sendOnEnter ? 'on' : ''}`} onClick={() => cfg.updateSettings({ sendOnEnter: !s.sendOnEnter })} />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setGenLength}</div>
        <div className="setting-row">
          <div className="setting-row-main"><div className="setting-row-title">{t.setUnlimited}</div><div className="setting-row-desc">{t.setUnlimitedDesc}</div></div>
          <span className={`switch ${unlimited ? 'on' : ''}`} onClick={() => cfg.updateSettings({ maxTokens: unlimited ? 4096 : 0 })} />
        </div>
        {!unlimited && (
          <div className="setting-row">
            <div className="setting-row-main"><div className="setting-row-title">{t.setMaxLen}</div></div>
            <input type="range" min={512} max={32768} step={512} value={s.maxTokens}
              onChange={(e) => cfg.updateSettings({ maxTokens: Number(e.target.value) })} style={{ width: 160 }} />
          </div>
        )}
      </div>

      <div className="setting-group">
        <div className="setting-label">Temperature</div>
        <div className="setting-row">
          <div className="setting-row-main"><div className="setting-row-title">{s.temperature.toFixed(2)}</div></div>
          <input type="range" min={0} max={2} step={0.05} value={s.temperature}
            onChange={(e) => cfg.updateSettings({ temperature: Number(e.target.value) })} style={{ width: 160 }} />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setSystemPrompt}</div>
        <textarea
          className="field-textarea" placeholder={t.setSystemPromptPh} value={s.systemPrompt}
          onChange={(e) => cfg.updateSettings({ systemPrompt: e.target.value })}
        />
      </div>
    </div>
  );
};
