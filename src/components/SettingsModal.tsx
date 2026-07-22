import React, { useState } from 'react';
import { motion, modalV, scrimV, springSoft } from './motion';
import { useConfig } from '../stores/config';
import { Provider, ThemeName, ThemeMode, ProviderKind, ModelConfig } from '../types';
import { CloseIcon, CheckIcon, PlusIcon, ChevronDown, SearchIcon } from './Icons';
import { Logo } from './Logo';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
}

type Tab = 'appearance' | 'providers' | 'chat' | 'about';

const THEMES: { id: ThemeName; zh: string; en: string; grad: string }[] = [
  { id: 'aurora', zh: '极光', en: 'Aurora', grad: 'linear-gradient(135deg,#5b8cff,#c4a0ff,#6fd6ff)' },
  { id: 'sunset', zh: '日落', en: 'Sunset', grad: 'linear-gradient(135deg,#ffb088,#ff9aa8,#ffd089)' },
  { id: 'ocean', zh: '海洋', en: 'Ocean', grad: 'linear-gradient(135deg,#4facfe,#00c6fb,#43e97b)' },
  { id: 'midnight', zh: '午夜', en: 'Midnight', grad: 'linear-gradient(135deg,#1a1a2e,#16213e,#2d1b4e)' },
  { id: 'forest', zh: '森林', en: 'Forest', grad: 'linear-gradient(135deg,#a8e6cf,#88d8b0,#dcedc1)' },
  { id: 'rose', zh: '玫瑰', en: 'Rose', grad: 'linear-gradient(135deg,#ffd6e8,#ffb3c6,#ffe0e9)' },
];

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<Tab>('appearance');
  const { t } = useT();
  const tabs: { id: Tab; label: string }[] = [
    { id: 'appearance', label: t.setTabAppearance },
    { id: 'providers', label: t.setTabProviders },
    { id: 'chat', label: t.setTabChat },
    { id: 'about', label: t.setTabAbout },
  ];

  return (
    <motion.div className="modal-overlay" variants={scrimV} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} onClick={onClose}>
      <motion.div className="modal glass-strong" variants={modalV} initial="initial" animate="animate" exit="exit" transition={springSoft} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t.settings}</div>
          <button className="btn btn-icon" onClick={onClose}><CloseIcon size={18} /></button>
        </div>
        <div className="modal-tabs">
          {tabs.map((tb) => (
            <button key={tb.id} className={`modal-tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
              {tb.label}
              {tab === tb.id && <motion.div layoutId="modal-tab-underline" className="modal-tab-underline" transition={springSoft} />}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'providers' && <ProvidersTab />}
          {tab === 'chat' && <ChatTab />}
          {tab === 'about' && <AboutTab />}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ 外观 ============
const AppearanceTab: React.FC = () => {
  const { settings, updateSettings } = useConfig();
  const { t, lang } = useT();
  return (
    <>
      <div className="setting-group">
        <div className="setting-label">{t.setLanguage}</div>
        {(['auto', 'zh', 'en'] as const).map((l) => (
          <div key={l} className="setting-row" onClick={() => updateSettings({ language: l })} style={{ cursor: 'pointer' }}>
            <div className="setting-row-title">{l === 'auto' ? t.langFollowSystem : l === 'zh' ? t.langZh : t.langEn}</div>
            {settings.language === l && <CheckIcon size={16} style={{ color: 'var(--accent)' }} />}
          </div>
        ))}
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setTheme}</div>
        <div className="theme-grid">
          {THEMES.map((th) => (
            <div
              key={th.id}
              className={`theme-card ${settings.theme === th.id ? 'selected' : ''}`}
              style={{ background: th.grad }}
              onClick={() => updateSettings({ theme: th.id })}
            >
              <div className="theme-card-check"><CheckIcon size={12} /></div>
              <div className="theme-card-name">{lang === 'zh' ? th.zh : th.en}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setDisplayMode}</div>
        {(['light', 'dark', 'auto'] as ThemeMode[]).map((mode) => (
          <div key={mode} className="setting-row" onClick={() => updateSettings({ themeMode: mode })} style={{ cursor: 'pointer' }}>
            <div className="setting-row-title">{mode === 'light' ? t.modeLight : mode === 'dark' ? t.modeDark : t.modeAuto}</div>
            {settings.themeMode === mode && <CheckIcon size={16} style={{ color: 'var(--accent)' }} />}
          </div>
        ))}
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setGlass} · {settings.glassIntensity}%</div>
        <div className="setting-row">
          <div className="setting-row-title">{t.setGlassDesc}</div>
          <input
            type="range" min={0} max={100} value={settings.glassIntensity}
            className="slider"
            onChange={(e) => updateSettings({ glassIntensity: +e.target.value })}
          />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setFontSize} · {settings.fontScale}%</div>
        <div className="setting-row">
          <div className="setting-row-title">{t.setFontDesc}</div>
          <input
            type="range" min={85} max={130} step={5} value={settings.fontScale}
            className="slider"
            onChange={(e) => updateSettings({ fontScale: +e.target.value })}
          />
        </div>
      </div>
    </>
  );
};

// ============ 提供商 ============
const ProvidersTab: React.FC = () => {
  const { providers, setProviders } = useConfig();
  const { t, lang } = useT();
  const [expanded, setExpanded] = useState<string | null>(providers[0]?.id ?? null);
  const [sniffing, setSniffing] = useState<string | null>(null);
  const [sniffMsg, setSniffMsg] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [newModel, setNewModel] = useState<Record<string, string>>({});

  const update = (id: string, patch: Partial<Provider>) => {
    setProviders(providers.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const setModels = (pid: string, models: ModelConfig[]) => {
    update(pid, { models });
  };

  const addModel = (pid: string) => {
    const raw = (newModel[pid] || '').trim();
    if (!raw) return;
    const p = providers.find((x) => x.id === pid);
    if (!p) return;
    if (p.models.some((m) => m.id === raw)) {
      setNewModel({ ...newModel, [pid]: '' });
      return;
    }
    setModels(pid, [...p.models, { id: raw, name: raw }]);
    setNewModel({ ...newModel, [pid]: '' });
  };

  const sniff = async (pid: string) => {
    const p = providers.find((x) => x.id === pid);
    if (!p) return;
    if (p.kind !== 'google' && !p.baseURL) {
      setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: t.sniffNoBase } });
      return;
    }
    setSniffing(pid);
    setSniffMsg({ ...sniffMsg, [pid]: { ok: true, text: t.setSniffing } });
    try {
      const { models, error } = await window.btw.sniffModels({ kind: p.kind, baseURL: p.baseURL, apiKey: p.apiKey });
      if (error) {
        setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: error } });
      } else if (!models.length) {
        setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: t.sniffEmpty } });
      } else {
        // 合并：保留已有模型的手动标记，补入嗅探到的新 id（并带启发式能力标记）
        const existing = new Map(p.models.map((m) => [m.id, m]));
        const merged: ModelConfig[] = models.map((sm: { id: string; name: string; supportsThinking?: boolean; supportsVision?: boolean }) =>
          existing.get(sm.id)
            ? { ...existing.get(sm.id)!, name: sm.name }
            : { id: sm.id, name: sm.name, supportsThinking: sm.supportsThinking, supportsVision: sm.supportsVision }
        );
        setModels(pid, merged);
        setSniffMsg({ ...sniffMsg, [pid]: { ok: true, text: `${lang === 'zh' ? '✓ 嗅探到' : '✓ Found'} ${models.length} ${lang === 'zh' ? '个模型' : 'models'}` } });
      }
    } catch (err: any) {
      setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: err?.message || (lang === 'zh' ? '嗅探失败' : 'Sniff failed') } });
    } finally {
      setSniffing(null);
    }
  };

  const addCustom = () => {
    const id = `custom-${Date.now()}`;
    const newP: Provider = {
      id,
      kind: 'openai-compatible',
      name: lang === 'zh' ? '自定义提供商' : 'Custom provider',
      apiKey: '',
      baseURL: '',
      enabled: true,
      models: [{ id: 'model-id', name: lang === 'zh' ? '模型名称' : 'Model name' }],
    };
    setProviders([...providers, newP]);
    setExpanded(id);
  };

  const remove = (id: string) => {
    setProviders(providers.filter((p) => p.id !== id));
  };

  return (
    <>
      <div className="setting-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t.setProviders}</span>
        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={addCustom}>
          <PlusIcon size={14} /> {t.setAddCustom}
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
        {t.setApiKeyHint}
      </div>

      {providers.map((p) => (
        <div key={p.id} className="provider-card">
          <div
            className="provider-head"
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
              {p.name.slice(0, 1)}
            </div>
            <div className="provider-name">{p.name}</div>
            <span className="provider-kind">{
              p.kind === 'openai-compatible' ? t.kindOpenAiCompat
              : p.kind === 'openai' ? t.kindOpenAi
              : p.kind === 'anthropic' ? t.kindAnthropic
              : p.kind === 'google' ? t.kindGoogle : t.kindCustom
            }</span>
            <button
              className={`switch ${p.enabled ? 'on' : ''}`}
              onClick={(e) => { e.stopPropagation(); update(p.id, { enabled: !p.enabled }); }}
            />
            <ChevronDown size={16} style={{ transform: expanded === p.id ? 'rotate(180deg)' : '', transition: '0.2s' }} />
          </div>

          {expanded === p.id && (
            <div className="provider-body">
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>{t.setApiKey}</div>
                <input
                  className="field-input mono"
                  type="password"
                  placeholder="sk-..."
                  value={p.apiKey}
                  onChange={(e) => update(p.id, { apiKey: e.target.value })}
                />
              </div>
              {(p.kind === 'openai' || p.kind === 'openai-compatible' || p.kind === 'anthropic') && (
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>{t.setBaseUrl}</div>
                  <input
                    className="field-input mono"
                    placeholder="https://api.example.com/v1"
                    value={p.baseURL || ''}
                    onChange={(e) => update(p.id, { baseURL: e.target.value })}
                  />
                </div>
              )}
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>{t.setKind}</div>
                <select
                  className="field-input"
                  value={p.kind}
                  onChange={(e) => update(p.id, { kind: e.target.value as ProviderKind })}
                >
                  <option value="openai-compatible">{t.kindOpenAiCompat}</option>
                  <option value="openai">{t.kindOpenAi}</option>
                  <option value="anthropic">{t.kindAnthropic}</option>
                  <option value="google">{t.kindGoogle}</option>
                  <option value="custom">{t.kindCustom}</option>
                </select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 6 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{t.setModelList}</div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    disabled={sniffing === p.id}
                    onClick={() => sniff(p.id)}
                    title={p.kind === 'anthropic' ? t.sniffAnthropic : t.sniffHint}
                  >
                    <SearchIcon size={13} /> {sniffing === p.id ? t.setSniffing : t.setSniff}
                  </button>
                </div>
                {sniffMsg[p.id] && (
                  <div style={{ fontSize: 11.5, marginBottom: 6, color: sniffMsg[p.id].ok ? 'var(--success)' : 'var(--danger)' }}>
                    {sniffMsg[p.id].text}
                  </div>
                )}
                {p.models.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{t.setNoModels}</div>
                )}
                {p.models.map((m, idx) => (
                  <div key={m.id + idx} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <input
                      className="field-input mono"
                      style={{ flex: 1.4, padding: '6px 10px', fontSize: 12 }}
                      value={m.id}
                      placeholder="model-id"
                      onChange={(e) => {
                        const next = [...p.models];
                        next[idx] = { ...m, id: e.target.value };
                        setModels(p.id, next);
                      }}
                    />
                    <input
                      className="field-input"
                      style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                      value={m.name}
                      placeholder={t.setModelNamePh}
                      onChange={(e) => {
                        const next = [...p.models];
                        next[idx] = { ...m, name: e.target.value };
                        setModels(p.id, next);
                      }}
                    />
                    <button
                      className="conv-action"
                      title={t.flagThinking}
                      style={{
                        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                        background: m.supportsThinking ? 'var(--accent-grad)' : 'rgba(128,128,128,0.12)',
                        color: m.supportsThinking ? 'white' : 'var(--text-tertiary)',
                      }}
                      onClick={() => {
                        const next = [...p.models];
                        next[idx] = { ...m, supportsThinking: !m.supportsThinking };
                        setModels(p.id, next);
                      }}
                    >{lang === 'zh' ? '思' : 'Th'}</button>
                    <button
                      className="conv-action"
                      title={t.flagVision}
                      style={{
                        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                        background: m.supportsVision ? 'var(--accent-grad)' : 'rgba(128,128,128,0.12)',
                        color: m.supportsVision ? 'white' : 'var(--text-tertiary)',
                      }}
                      onClick={() => {
                        const next = [...p.models];
                        next[idx] = { ...m, supportsVision: !m.supportsVision };
                        setModels(p.id, next);
                      }}
                    >{lang === 'zh' ? '视' : 'Vi'}</button>
                    <button
                      className="conv-action"
                      title={t.setRemoveModel}
                      style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, color: 'var(--danger)' }}
                      onClick={() => setModels(p.id, p.models.filter((_, i) => i !== idx))}
                    >×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    className="field-input mono"
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                    placeholder={t.setAddModelPh}
                    value={newModel[p.id] || ''}
                    onChange={(e) => setNewModel({ ...newModel, [p.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') addModel(p.id); }}
                  />
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => addModel(p.id)}>
                    <PlusIcon size={13} /> {t.add}
                  </button>
                </div>
              </div>
              {!p.builtIn && (
                <button className="btn btn-ghost" style={{ color: 'var(--danger)', alignSelf: 'flex-start', marginTop: 4 }} onClick={() => remove(p.id)}>
                  {t.setRemoveProvider}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

// ============ 聊天 ============
const ChatTab: React.FC = () => {
  const { settings, updateSettings } = useConfig();
  const { t } = useT();
  return (
    <>
      <div className="setting-group">
        <div className="setting-label">{t.setDefaults}</div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">{t.setStreaming}</div>
            <div className="setting-row-desc">{t.setStreamingDesc}</div>
          </div>
          <button className={`switch ${settings.streamResponses ? 'on' : ''}`} onClick={() => updateSettings({ streamResponses: !settings.streamResponses })} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">{t.setEnterSend}</div>
            <div className="setting-row-desc">{t.setEnterSendDesc}</div>
          </div>
          <button className={`switch ${settings.sendOnEnter ? 'on' : ''}`} onClick={() => updateSettings({ sendOnEnter: !settings.sendOnEnter })} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">{t.setWebSearch}</div>
            <div className="setting-row-desc">{t.setWebSearchDesc}</div>
          </div>
          <button className={`switch ${settings.webSearchEnabled ? 'on' : ''}`} onClick={() => updateSettings({ webSearchEnabled: !settings.webSearchEnabled })} />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setGenLength}</div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">{t.setUnlimited}</div>
            <div className="setting-row-desc">
              {settings.maxTokens === 0
                ? t.setUnlimitedDesc
                : t.setLimitedDesc.replace('{n}', String(settings.maxTokens))}
            </div>
          </div>
          <button
            className={`switch ${settings.maxTokens === 0 ? 'on' : ''}`}
            onClick={() => updateSettings({ maxTokens: settings.maxTokens === 0 ? 4096 : 0 })}
          />
        </div>
        {settings.maxTokens !== 0 && (
          <div className="setting-row">
            <div>
              <div className="setting-row-title">{t.setMaxLen}</div>
              <div className="setting-row-desc">{settings.maxTokens}</div>
            </div>
            <input type="range" min={512} max={65536} step={512} value={settings.maxTokens}
              className="slider" onChange={(e) => updateSettings({ maxTokens: +e.target.value })} />
          </div>
        )}
      </div>

      <div className="setting-group">
        <div className="setting-label">{t.setSystemPrompt}</div>
        <textarea
          className="field-input"
          rows={4}
          placeholder={t.setSystemPromptPh}
          value={settings.systemPrompt}
          onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
    </>
  );
};

const AboutTab: React.FC = () => {
  const { t } = useT();
  return (
    <div className="empty-state" style={{ padding: 30 }}>
      <Logo size={72} />
      <div className="empty-title">{t.appName}</div>
      <div className="empty-sub">
        {t.setAboutVersion} 1.0 · Electron + React<br />
        {t.setAboutDesc}<br /><br />
        {t.setAboutProviders}<br />
        {t.setAboutFeatures}
      </div>
    </div>
  );
};
