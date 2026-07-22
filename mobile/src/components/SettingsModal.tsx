import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { motion, sheetV, springSoft } from './motion';
import { useConfig } from '../stores/config';
import { useT } from '../i18n';
import { ThemeName, ThemeMode, Provider, ProviderKind, ModelConfig } from '../types';
import { sniffModels } from '../services/providers/sniff';
import { BackIcon, PlusIcon, TrashIcon, ChevronDownIcon, CheckIcon, XIcon } from './Icons';

const GRAD: Record<ThemeName, string> = {
  aurora: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  sunset: 'linear-gradient(135deg,#f472b6,#fb923c)',
  ocean: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
  midnight: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
  forest: 'linear-gradient(135deg,#10b981,#059669)',
  rose: 'linear-gradient(135deg,#f43f5e,#ec4899)',
};
const THEMES: { id: ThemeName; zh: string; en: string }[] = [
  { id: 'aurora', zh: '极光', en: 'Aurora' }, { id: 'sunset', zh: '日落', en: 'Sunset' },
  { id: 'ocean', zh: '海洋', en: 'Ocean' }, { id: 'midnight', zh: '午夜', en: 'Midnight' },
  { id: 'forest', zh: '森林', en: 'Forest' }, { id: 'rose', zh: '玫瑰', en: 'Rose' },
];
const KINDS: { id: ProviderKind; label: string }[] = [
  { id: 'openai-compatible', label: 'kindOpenAiCompat' }, { id: 'openai', label: 'kindOpenAi' },
  { id: 'anthropic', label: 'kindAnthropic' }, { id: 'google', label: 'kindGoogle' }, { id: 'custom', label: 'kindCustom' },
];
type Tab = 'appearance' | 'providers' | 'chat' | 'about';

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('providers');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'appearance', label: t.setTabAppearance }, { id: 'providers', label: t.setTabProviders },
    { id: 'chat', label: t.setTabChat }, { id: 'about', label: t.setTabAbout },
  ];
  return (
    <motion.div className="sheet" variants={sheetV} initial="initial" animate="animate" exit="exit" transition={springSoft}>
      <div className="sheet-bar">
        <button className="icon-btn" onClick={onClose}><BackIcon size={22} /></button>
        <div className="sheet-title">{t.settings}</div>
      </div>
      <div className="tabs">
        {tabs.map((tb) => (
          <button key={tb.id} className={`tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
            {tb.label}
            {tab === tb.id && <motion.div layoutId="set-tab" className="tab-underline" transition={springSoft} />}
          </button>
        ))}
      </div>
      <div className="sheet-body">
        {tab === 'appearance' && <Appearance />}
        {tab === 'providers' && <Providers />}
        {tab === 'chat' && <Chat />}
        {tab === 'about' && (
          <div className="settings">
            <div className="empty" style={{ flex: 0, padding: '40px 24px' }}>
              <div className="empty-mark">BTW</div>
              <div className="empty-title">{t.appName}</div>
              <div className="empty-sub">{t.setAboutDesc}</div>
              <div className="empty-sub" style={{ marginTop: 8 }}>{t.setAboutProviders}</div>
              <div className="empty-sub" style={{ marginTop: 8 }}>{t.setAboutFeatures}</div>
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-faint)' }}>{t.setAboutVersion} 2.0.0 · Android</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Appearance: React.FC = () => {
  const { t, lang } = useT();
  const cfg = useConfig();
  const s = cfg.settings;
  return (
    <div className="settings">
      <div className="grp">
        <div className="grp-label">{t.setLanguage}</div>
        <div className="seg">
          <button className={`seg-btn ${s.language === 'auto' ? 'active' : ''}`} onClick={() => cfg.updateSettings({ language: 'auto' })}>{t.langFollowSystem}</button>
          <button className={`seg-btn ${s.language === 'zh' ? 'active' : ''}`} onClick={() => cfg.updateSettings({ language: 'zh' })}>{t.langZh}</button>
          <button className={`seg-btn ${s.language === 'en' ? 'active' : ''}`} onClick={() => cfg.updateSettings({ language: 'en' })}>{t.langEn}</button>
        </div>
      </div>
      <div className="grp">
        <div className="grp-label">{t.setTheme}</div>
        <div className="theme-grid">
          {THEMES.map((th) => (
            <div key={th.id} className={`theme-card ${s.theme === th.id ? 'sel' : ''}`} style={{ background: GRAD[th.id] }} onClick={() => cfg.updateSettings({ theme: th.id })}>
              {s.theme === th.id && <div style={{ position: 'absolute', top: 7, right: 7, width: 20, height: 20, borderRadius: '50%', background: '#fff', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon size={12} /></div>}
              <div className="theme-card-name">{lang === 'zh' ? th.zh : th.en}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grp">
        <div className="grp-label">{t.setDisplayMode}</div>
        <div className="seg">
          {(['light', 'dark', 'auto'] as ThemeMode[]).map((m) => (
            <button key={m} className={`seg-btn ${s.themeMode === m ? 'active' : ''}`} onClick={() => cfg.updateSettings({ themeMode: m })}>
              {m === 'light' ? t.modeLight : m === 'dark' ? t.modeDark : t.modeAuto}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <div className="grp-label">{t.setFontSize}</div>
        <div className="row-set">
          <div className="row-set-main"><div className="row-set-title">{s.fontScale}%</div></div>
          <input type="range" min={80} max={140} step={5} value={s.fontScale} onChange={(e) => cfg.updateSettings({ fontScale: Number(e.target.value) })} style={{ width: 150 }} />
        </div>
      </div>
    </div>
  );
};

const Providers: React.FC = () => {
  const { t } = useT();
  const cfg = useConfig();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [sniffing, setSniffing] = useState<string | null>(null);
  const [add, setAdd] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const patch = (id: string, fn: (p: Provider) => Provider) => void cfg.setProviders(cfg.providers.map((p) => (p.id === id ? fn(p) : p)));
  const doSniff = async (p: Provider) => {
    setSniffing(p.id); setErr(null);
    try {
      const models = await sniffModels({ kind: p.kind, baseURL: p.baseURL, apiKey: p.apiKey });
      if (!models.length) { setErr(t.sniffEmpty); return; }
      patch(p.id, (pr) => {
        const ids = new Set(pr.models.map((m) => m.id)); const merged = [...pr.models];
        for (const sm of models) {
          if (!ids.has(sm.id)) merged.push({ id: sm.id, name: sm.name, supportsThinking: sm.supportsThinking, supportsVision: sm.supportsVision });
          else { const ex = merged.find((m) => m.id === sm.id)!; if (sm.supportsThinking) ex.supportsThinking = true; if (sm.supportsVision) ex.supportsVision = true; }
        }
        return { ...pr, models: merged };
      });
    } catch (e: any) { setErr(e?.message || 'sniff failed'); } finally { setSniffing(null); }
  };
  const addModel = (p: Provider) => {
    const id = (add[p.id] || '').trim(); if (!id) return;
    patch(p.id, (pr) => pr.models.some((m) => m.id === id) ? pr : { ...pr, models: [...pr.models, { id, name: id }] });
    setAdd((m) => ({ ...m, [p.id]: '' }));
  };
  const rmModel = (p: Provider, id: string) => patch(p.id, (pr) => ({ ...pr, models: pr.models.filter((m: ModelConfig) => m.id !== id) }));
  const addCustom = () => {
    const id = 'c-' + uuid().slice(0, 6);
    void cfg.setProviders([...cfg.providers, { id, kind: 'openai-compatible', name: 'Custom', apiKey: '', baseURL: 'https://api.example.com/v1', enabled: true, models: [] }]);
    setOpen((s) => new Set(s).add(id));
  };
  const rmProvider = (id: string) => { if (window.confirm(t.setRemoveProvider + '?')) void cfg.setProviders(cfg.providers.filter((p) => p.id !== id)); };

  return (
    <div className="settings">
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 12 }}>{t.setApiKeyHint}</div>
      {err && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{err}</div>}
      {cfg.providers.map((p) => {
        const isOpen = open.has(p.id);
        return (
          <div className="pcard" key={p.id}>
            <div className="pcard-head" onClick={() => toggle(p.id)}>
              <button className={`switch ${p.enabled ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); patch(p.id, (pr) => ({ ...pr, enabled: !pr.enabled })); }} />
              <div className="pcard-name">{p.name}</div>
              <span className="pcard-kind">{t[(KINDS.find((k) => k.id === p.kind)?.label || 'kindCustom') as keyof typeof t]}</span>
              <ChevronDownIcon size={18} style={{ transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform .2s', color: 'var(--text-faint)' }} />
            </div>
            {isOpen && (
              <div className="pcard-body">
                <input className="field mono" placeholder={t.setApiKey} value={p.apiKey} onChange={(e) => patch(p.id, (pr) => ({ ...pr, apiKey: e.target.value }))} />
                {(p.kind === 'openai-compatible' || p.kind === 'openai' || p.kind === 'custom') && (
                  <input className="field mono" placeholder={t.setBaseUrl} value={p.baseURL || ''} onChange={(e) => patch(p.id, (pr) => ({ ...pr, baseURL: e.target.value }))} />
                )}
                {p.kind !== 'anthropic' && (
                  <button className="btn-line" disabled={sniffing === p.id} onClick={() => doSniff(p)}>{sniffing === p.id ? t.setSniffing : t.setSniff}</button>
                )}
                {p.models.length > 0 && (
                  <div className="pill-list">
                    {p.models.map((m) => (
                      <span key={m.id} className="mpill">{m.supportsThinking && '🧠'}{m.supportsVision && '👁'} {m.name}
                        <button className="mpill-x" onClick={() => rmModel(p, m.id)}><XIcon size={13} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="field mono" placeholder={t.setAddModelPh} value={add[p.id] || ''} onChange={(e) => setAdd((m) => ({ ...m, [p.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') addModel(p); }} />
                  <button className="icon-btn" style={{ background: 'var(--surface-2)' }} onClick={() => addModel(p)}><PlusIcon size={18} /></button>
                </div>
                <button className="btn-line danger" onClick={() => rmProvider(p.id)}>{t.setRemoveProvider}</button>
              </div>
            )}
          </div>
        );
      })}
      <button className="btn-line" style={{ marginTop: 4 }} onClick={addCustom}><PlusIcon size={16} /> {t.setAddCustom}</button>
    </div>
  );
};

const Chat: React.FC = () => {
  const { t } = useT();
  const cfg = useConfig();
  const s = cfg.settings;
  const unlimited = !s.maxTokens || s.maxTokens === 0;
  return (
    <div className="settings">
      <div className="grp">
        <div className="grp-label">{t.setDefaults}</div>
        <div className="row-set">
          <div className="row-set-main"><div className="row-set-title">{t.setStreaming}</div><div className="row-set-desc">{t.setStreamingDesc}</div></div>
          <button className={`switch ${s.streamResponses ? 'on' : ''}`} onClick={() => cfg.updateSettings({ streamResponses: !s.streamResponses })} />
        </div>
        <div className="row-set">
          <div className="row-set-main"><div className="row-set-title">{t.setEnterSend}</div><div className="row-set-desc">{t.setEnterSendDesc}</div></div>
          <button className={`switch ${s.sendOnEnter ? 'on' : ''}`} onClick={() => cfg.updateSettings({ sendOnEnter: !s.sendOnEnter })} />
        </div>
      </div>
      <div className="grp">
        <div className="grp-label">{t.setGenLength}</div>
        <div className="row-set">
          <div className="row-set-main"><div className="row-set-title">{t.setUnlimited}</div><div className="row-set-desc">{t.setUnlimitedDesc}</div></div>
          <button className={`switch ${unlimited ? 'on' : ''}`} onClick={() => cfg.updateSettings({ maxTokens: unlimited ? 4096 : 0 })} />
        </div>
        {!unlimited && (
          <div className="row-set"><div className="row-set-main"><div className="row-set-title">{t.setMaxLen}</div></div>
            <input type="range" min={512} max={32768} step={512} value={s.maxTokens} onChange={(e) => cfg.updateSettings({ maxTokens: Number(e.target.value) })} style={{ width: 150 }} /></div>
        )}
      </div>
      <div className="grp">
        <div className="grp-label">Temperature</div>
        <div className="row-set"><div className="row-set-main"><div className="row-set-title">{s.temperature.toFixed(2)}</div></div>
          <input type="range" min={0} max={2} step={0.05} value={s.temperature} onChange={(e) => cfg.updateSettings({ temperature: Number(e.target.value) })} style={{ width: 150 }} /></div>
      </div>
      <div className="grp">
        <div className="grp-label">{t.setSystemPrompt}</div>
        <textarea className="field area" placeholder={t.setSystemPromptPh} value={s.systemPrompt} onChange={(e) => cfg.updateSettings({ systemPrompt: e.target.value })} />
      </div>
    </div>
  );
};
