import React, { useState } from 'react';
import { useConfig } from '../stores/config';
import { Provider, ThemeName, ThemeMode, ProviderKind, ModelConfig } from '../types';
import { CloseIcon, CheckIcon, PlusIcon, ChevronDown, SearchIcon } from './Icons';
import { Logo } from './Logo';

interface Props {
  onClose: () => void;
}

type Tab = 'appearance' | 'providers' | 'chat' | 'about';

const THEMES: { id: ThemeName; name: string; grad: string }[] = [
  { id: 'aurora', name: '极光', grad: 'linear-gradient(135deg,#5b8cff,#c4a0ff,#6fd6ff)' },
  { id: 'sunset', name: '日落', grad: 'linear-gradient(135deg,#ffb088,#ff9aa8,#ffd089)' },
  { id: 'ocean', name: '海洋', grad: 'linear-gradient(135deg,#4facfe,#00c6fb,#43e97b)' },
  { id: 'midnight', name: '午夜', grad: 'linear-gradient(135deg,#1a1a2e,#16213e,#2d1b4e)' },
  { id: 'forest', name: '森林', grad: 'linear-gradient(135deg,#a8e6cf,#88d8b0,#dcedc1)' },
  { id: 'rose', name: '玫瑰', grad: 'linear-gradient(135deg,#ffd6e8,#ffb3c6,#ffe0e9)' },
];

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<Tab>('appearance');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">设置</div>
          <button className="btn btn-icon" onClick={onClose}><CloseIcon size={18} /></button>
        </div>
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>外观</button>
          <button className={`modal-tab ${tab === 'providers' ? 'active' : ''}`} onClick={() => setTab('providers')}>模型与 API</button>
          <button className={`modal-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>聊天</button>
          <button className={`modal-tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>关于</button>
        </div>
        <div className="modal-body">
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'providers' && <ProvidersTab />}
          {tab === 'chat' && <ChatTab />}
          {tab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
};

// ============ 外观 ============
const AppearanceTab: React.FC = () => {
  const { settings, updateSettings } = useConfig();
  return (
    <>
      <div className="setting-group">
        <div className="setting-label">主题配色</div>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <div
              key={t.id}
              className={`theme-card ${settings.theme === t.id ? 'selected' : ''}`}
              style={{ background: t.grad }}
              onClick={() => updateSettings({ theme: t.id })}
            >
              <div className="theme-card-check"><CheckIcon size={12} /></div>
              <div className="theme-card-name">{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">显示模式</div>
        {(['light', 'dark', 'auto'] as ThemeMode[]).map((mode) => (
          <div key={mode} className="setting-row" onClick={() => updateSettings({ themeMode: mode })} style={{ cursor: 'pointer' }}>
            <div className="setting-row-title">{mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}</div>
            {settings.themeMode === mode && <CheckIcon size={16} style={{ color: 'var(--accent)' }} />}
          </div>
        ))}
      </div>

      <div className="setting-group">
        <div className="setting-label">毛玻璃强度 · {settings.glassIntensity}%</div>
        <div className="setting-row">
          <div className="setting-row-title">背景模糊与饱和</div>
          <input
            type="range" min={0} max={100} value={settings.glassIntensity}
            className="slider"
            onChange={(e) => updateSettings({ glassIntensity: +e.target.value })}
          />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">字体大小 · {settings.fontScale}%</div>
        <div className="setting-row">
          <div className="setting-row-title">全局字号缩放</div>
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
      setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: '请先填写 Base URL' } });
      return;
    }
    setSniffing(pid);
    setSniffMsg({ ...sniffMsg, [pid]: { ok: true, text: '嗅探中…' } });
    try {
      const { models, error } = await window.btw.sniffModels({ kind: p.kind, baseURL: p.baseURL, apiKey: p.apiKey });
      if (error) {
        setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: error } });
      } else if (!models.length) {
        setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: '未发现任何模型' } });
      } else {
        // 合并：保留已有模型的手动标记，补入嗅探到的新 id
        const existing = new Map(p.models.map((m) => [m.id, m]));
        const merged: ModelConfig[] = models.map((sm: { id: string; name: string }) =>
          existing.get(sm.id)
            ? { ...existing.get(sm.id)!, name: sm.name }
            : { id: sm.id, name: sm.name }
        );
        setModels(pid, merged);
        setSniffMsg({ ...sniffMsg, [pid]: { ok: true, text: `✓ 嗅探到 ${models.length} 个模型` } });
      }
    } catch (err: any) {
      setSniffMsg({ ...sniffMsg, [pid]: { ok: false, text: err?.message || '嗅探失败' } });
    } finally {
      setSniffing(null);
    }
  };

  const addCustom = () => {
    const id = `custom-${Date.now()}`;
    const newP: Provider = {
      id,
      kind: 'openai-compatible',
      name: '自定义提供商',
      apiKey: '',
      baseURL: '',
      enabled: true,
      models: [{ id: 'model-id', name: '模型名称' }],
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
        <span>提供商</span>
        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={addCustom}>
          <PlusIcon size={14} /> 添加自定义
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
        API Key 仅保存在本地，不上传任何服务器。
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
            <span className="provider-kind">{p.kind}</span>
            <button
              className={`switch ${p.enabled ? 'on' : ''}`}
              onClick={(e) => { e.stopPropagation(); update(p.id, { enabled: !p.enabled }); }}
            />
            <ChevronDown size={16} style={{ transform: expanded === p.id ? 'rotate(180deg)' : '', transition: '0.2s' }} />
          </div>

          {expanded === p.id && (
            <div className="provider-body">
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>API Key</div>
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
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>Base URL（可选）</div>
                  <input
                    className="field-input mono"
                    placeholder="https://api.example.com/v1"
                    value={p.baseURL || ''}
                    onChange={(e) => update(p.id, { baseURL: e.target.value })}
                  />
                </div>
              )}
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>协议类型</div>
                <select
                  className="field-input"
                  value={p.kind}
                  onChange={(e) => update(p.id, { kind: e.target.value as ProviderKind })}
                >
                  <option value="openai-compatible">OpenAI 兼容</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google Gemini</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 6 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>模型列表</div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    disabled={sniffing === p.id}
                    onClick={() => sniff(p.id)}
                    title={p.kind === 'anthropic' ? 'Anthropic 不支持嗅探，请手动添加' : '根据 Base URL 自动拉取可用模型'}
                  >
                    <SearchIcon size={13} /> {sniffing === p.id ? '嗅探中…' : '嗅探模型'}
                  </button>
                </div>
                {sniffMsg[p.id] && (
                  <div style={{ fontSize: 11.5, marginBottom: 6, color: sniffMsg[p.id].ok ? 'var(--success)' : 'var(--danger)' }}>
                    {sniffMsg[p.id].text}
                  </div>
                )}
                {p.models.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>还没有模型，点「嗅探模型」自动获取，或在下方手动添加。</div>
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
                      placeholder="显示名"
                      onChange={(e) => {
                        const next = [...p.models];
                        next[idx] = { ...m, name: e.target.value };
                        setModels(p.id, next);
                      }}
                    />
                    <button
                      className="conv-action"
                      title="支持深度思考"
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
                    >思</button>
                    <button
                      className="conv-action"
                      title="支持视觉/图片"
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
                    >视</button>
                    <button
                      className="conv-action"
                      title="删除该模型"
                      style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, color: 'var(--danger)' }}
                      onClick={() => setModels(p.id, p.models.filter((_, i) => i !== idx))}
                    >×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    className="field-input mono"
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                    placeholder="手动添加模型 ID，回车确认"
                    value={newModel[p.id] || ''}
                    onChange={(e) => setNewModel({ ...newModel, [p.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') addModel(p.id); }}
                  />
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => addModel(p.id)}>
                    <PlusIcon size={13} /> 添加
                  </button>
                </div>
              </div>
              {!p.builtIn && (
                <button className="btn btn-ghost" style={{ color: 'var(--danger)', alignSelf: 'flex-start', marginTop: 4 }} onClick={() => remove(p.id)}>
                  删除该提供商
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
  return (
    <>
      <div className="setting-group">
        <div className="setting-label">默认行为</div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">流式输出</div>
            <div className="setting-row-desc">逐字显示回答</div>
          </div>
          <button className={`switch ${settings.streamResponses ? 'on' : ''}`} onClick={() => updateSettings({ streamResponses: !settings.streamResponses })} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">回车发送</div>
            <div className="setting-row-desc">关闭后用 Ctrl/⌘+Enter 发送</div>
          </div>
          <button className={`switch ${settings.sendOnEnter ? 'on' : ''}`} onClick={() => updateSettings({ sendOnEnter: !settings.sendOnEnter })} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">联网搜索</div>
            <div className="setting-row-desc">默认开启，每次对话自动检索</div>
          </div>
          <button className={`switch ${settings.webSearchEnabled ? 'on' : ''}`} onClick={() => updateSettings({ webSearchEnabled: !settings.webSearchEnabled })} />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">生成参数</div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">随机度 (Temperature)</div>
            <div className="setting-row-desc">{settings.temperature.toFixed(2)}</div>
          </div>
          <input type="range" min={0} max={2} step={0.05} value={settings.temperature}
            className="slider" onChange={(e) => updateSettings({ temperature: +e.target.value })} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row-title">最大长度 (Max Tokens)</div>
            <div className="setting-row-desc">{settings.maxTokens}</div>
          </div>
          <input type="range" min={512} max={16384} step={256} value={settings.maxTokens}
            className="slider" onChange={(e) => updateSettings({ maxTokens: +e.target.value })} />
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">系统提示词</div>
        <textarea
          className="field-input"
          rows={4}
          placeholder="（可选）给模型一个全局人设或指令…"
          value={settings.systemPrompt}
          onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
    </>
  );
};

const AboutTab: React.FC = () => (
  <div className="empty-state" style={{ padding: 30 }}>
    <Logo size={72} />
    <div className="empty-title">BTW Chat</div>
    <div className="empty-sub">
      版本 1.0 · Electron + React<br />
      带有「顺便问一下」分支对话的 AI 聊天工具。<br /><br />
      支持 OpenAI / Anthropic / Gemini / DeepSeek / 智谱 / Kimi 及任何 OpenAI 兼容接口。<br />
      毛玻璃材质 · 多套主题 · 联网搜索 · 深度思考。
    </div>
  </div>
);
