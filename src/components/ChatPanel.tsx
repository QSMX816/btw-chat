import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../stores/conversations';
import { useConfig } from '../stores/config';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { SparkleIcon, ChevronDown, BrainIcon, GlobeIcon, RefreshIcon, CheckIcon } from './Icons';
import { Logo } from './Logo';
import { Provider, ModelConfig } from '../types';

export const ChatPanel: React.FC = () => {
  const { active, streaming, regenerateLast } = useChat();
  const { providers, settings, setActiveModel, getActiveProvider, getActiveModel } = useConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const provider = getActiveProvider();
  const model = getActiveModel();

  // 自动滚动到底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.messages, streaming]);

  if (!active) {
    return (
      <main className="chat-area glass">
        <EmptyState />
      </main>
    );
  }

  return (
    <main className="chat-area glass">
      <div className="chat-toolbar">
        <div className="chat-toolbar-title">{active.title}</div>

        {/* 模型选择 */}
        <div style={{ position: 'relative' }}>
          <button className="toolbar-pill" onClick={() => setModelMenuOpen((v) => !v)}>
            <BrainIcon size={14} />
            {provider?.name} · {model?.name}
            <ChevronDown size={13} style={{ opacity: 0.6 }} />
          </button>
          {modelMenuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setModelMenuOpen(false)} />
              <div
                className="glass-strong"
                style={{
                  position: 'absolute', top: 42, right: 0, width: 280, zIndex: 51,
                  borderRadius: 14, padding: 6, boxShadow: 'var(--shadow-lg)',
                  maxHeight: 420, overflowY: 'auto',
                }}
              >
                {providers.filter((p) => p.enabled && p.apiKey).length === 0 && (
                  <div style={{ padding: 16, fontSize: 12.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    请先在设置中填写 API Key
                  </div>
                )}
                {providers.filter((p) => p.enabled).map((p) => (
                  <ProviderGroup
                    key={p.id}
                    provider={p}
                    currentModelId={settings.activeModelId}
                    onPick={(m) => { setActiveModel(p.id, m.id); setModelMenuOpen(false); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!streaming && active.messages.some((m) => m.role === 'assistant' && m.content) && (
          <button className="btn btn-icon" title="重新生成最后一条" onClick={regenerateLast}>
            <RefreshIcon size={16} />
          </button>
        )}
      </div>

      <div className="messages" ref={scrollRef}>
        {active.messages.length === 0 ? (
          <div className="empty-state">
            <Logo size={72} />
            <div className="empty-title">开始一段新对话</div>
            <div className="empty-sub">
              支持多模型 · 联网搜索 · 深度思考。<br />
              <strong>独有功能：</strong>每条 AI 回答后可点「顺便问一下」开启侧边追问，不污染主线。
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {model?.supportsThinking && (
                <span className="toolbar-pill active" style={{ cursor: 'default' }}>
                  <BrainIcon size={13} /> 支持思考
                </span>
              )}
              {settings.webSearchEnabled && (
                <span className="toolbar-pill active" style={{ cursor: 'default' }}>
                  <GlobeIcon size={13} /> 联网
                </span>
              )}
            </div>
          </div>
        ) : (
          active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <Composer variant="main" />
    </main>
  );
};

const ProviderGroup: React.FC<{
  provider: Provider;
  currentModelId: string;
  onPick: (m: ModelConfig) => void;
}> = ({ provider, currentModelId, onPick }) => {
  if (!provider.apiKey) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>
          {provider.name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>未配置 API Key</div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: 0.5, padding: '8px 12px 4px' }}>
        {provider.name}
      </div>
      {provider.models.map((m) => (
        <div
          key={m.id}
          className="conv-item"
          style={{ padding: '8px 12px' }}
          onClick={() => onPick(m)}
        >
          <div className="conv-item-main">
            <div className="conv-item-title" style={{ fontSize: 13 }}>{m.name}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
              {m.supportsThinking && <span className="model-chip" style={{ fontSize: 10 }}>思考</span>}
              {m.supportsVision && <span className="model-chip" style={{ fontSize: 10 }}>视觉</span>}
              {m.supportsWebSearch && <span className="model-chip" style={{ fontSize: 10 }}>联网</span>}
            </div>
          </div>
          {m.id === currentModelId && <CheckIcon size={15} style={{ color: 'var(--accent)' }} />}
        </div>
      ))}
    </div>
  );
};

const EmptyState: React.FC = () => {
  const { newConversation } = useChat();
  return (
    <>
      <div className="chat-toolbar">
        <div className="chat-toolbar-title">BTW Chat</div>
      </div>
      <div className="empty-state">
        <Logo size={72} />
        <div className="empty-title">欢迎使用 BTW Chat</div>
        <div className="empty-sub">
          一个带「顺便问一下」分支的 AI 聊天工具。<br />
          每条 AI 回答都能就地开一个侧边追问，主聊天保持干净。
        </div>
        <button className="btn btn-primary" onClick={newConversation} style={{ marginTop: 8 }}>
          <SparkleIcon size={16} /> 新建对话
        </button>
      </div>
    </>
  );
};
