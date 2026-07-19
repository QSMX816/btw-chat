import React, { useMemo, useState } from 'react';
import { useChat } from '../stores/conversations';
import { useConfig } from '../stores/config';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { SparkleIcon, ChevronDown, BrainIcon, GlobeIcon, CheckIcon, CompactIcon } from './Icons';
import { Logo } from './Logo';
import { useFollowScroll } from '../hooks/useFollowScroll';
import { estimateInputOutputTokens, estimateCostUsd } from '../utils/tokens';
import { useT, formatCost, formatPricePerM } from '../i18n';
import { Provider, ModelConfig } from '../types';

export const ChatPanel: React.FC = () => {
  const { active, streaming, regenerateLast, compactConversation } = useChat();
  const { providers, settings, setActiveModel, getActiveProvider, getActiveModel } = useConfig();
  const { t, lang } = useT();
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const provider = getActiveProvider();
  const model = getActiveModel();

  const { ref: scrollRef, onScroll, jump, showJump } = useFollowScroll({
    messages: active?.messages ?? [],
    streaming,
    convId: active?.id,
  });

  // 实时 token 估算（input/output 拆分）+ 费用估算。主聊天流式时随 token 刷新。
  const { inputTokens, outputTokens, totalTokens } = useMemo(() => {
    const msgs = active?.messages;
    if (!msgs) return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const { input, output } = estimateInputOutputTokens(msgs, settings.systemPrompt);
    return { inputTokens: input, outputTokens: output, totalTokens: input + output };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.messages, settings.systemPrompt]);

  const costUsd = estimateCostUsd(inputTokens, outputTokens, model);
  const costStr = formatCost(costUsd, lang);

  const canCompact = !streaming && !!active && active.messages.filter((m) => m.content && m.content.trim()).length >= 4;
  const canRegenerate = !streaming && !!active && active.messages.some((m) => m.role === 'assistant' && m.content);

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

        {/* token + 费用估算 */}
        {active.messages.length > 0 && (
          <span className="toolbar-pill" style={{ cursor: 'default', opacity: 0.9 }} title={`${t.tokenTip}\n${t.priceTip}`}>
            ~{totalTokens.toLocaleString()}
            {model?.contextWindow ? ` / ${(model.contextWindow / 1000).toFixed(0)}k` : ''} tok
            {costStr ? ` · ${costStr}` : ''}
          </span>
        )}

        {/* 压缩上下文 */}
        {canCompact && (
          <button className="btn btn-icon" title={t.compactHint} onClick={compactConversation}>
            <CompactIcon size={16} />
          </button>
        )}

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
                    {t.needApiKey}
                  </div>
                )}
                {providers.filter((p) => p.enabled).map((p) => (
                  <ProviderGroup
                    key={p.id}
                    provider={p}
                    currentModelId={settings.activeModelId}
                    lang={lang}
                    onPick={(m) => { setActiveModel(p.id, m.id); setModelMenuOpen(false); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="messages" ref={scrollRef} onScroll={onScroll}>
        {active.messages.length === 0 ? (
          <div className="empty-state">
            <Logo size={72} />
            <div className="empty-title">{t.chatStart}</div>
            <div className="empty-sub">
              {t.chatEmptyHint}<br />
              <strong>{t.chatBtwFeature}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {model?.supportsThinking && (
                <span className="toolbar-pill active" style={{ cursor: 'default' }}>
                  <BrainIcon size={13} /> {t.chatSupportsThinking}
                </span>
              )}
              {settings.webSearchEnabled && (
                <span className="toolbar-pill active" style={{ cursor: 'default' }}>
                  <GlobeIcon size={13} /> {t.chatWebOn}
                </span>
              )}
            </div>
          </div>
        ) : (
          active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {showJump && (
        <button className="jump-fab" title={t.scrollToBottom} onClick={jump}>
          <ChevronDown size={18} />
        </button>
      )}

      <Composer variant="main" canRegenerate={canRegenerate} regenerateLast={regenerateLast} />
    </main>
  );
};

const ProviderGroup: React.FC<{
  provider: Provider;
  currentModelId: string;
  lang: 'zh' | 'en';
  onPick: (m: ModelConfig) => void;
}> = ({ provider, currentModelId, lang, onPick }) => {
  const { t } = useT();
  if (!provider.apiKey) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>
          {provider.name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.setApiKeyHint}</div>
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
            <div style={{ display: 'flex', gap: 5, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {m.supportsThinking && <span className="model-chip" style={{ fontSize: 10 }}>{lang === 'zh' ? '思考' : 'think'}</span>}
              {m.supportsVision && <span className="model-chip" style={{ fontSize: 10 }}>{lang === 'zh' ? '视觉' : 'vision'}</span>}
              {m.supportsWebSearch && <span className="model-chip" style={{ fontSize: 10 }}>{lang === 'zh' ? '联网' : 'web'}</span>}
              {m.contextWindow ? <span className="model-chip" style={{ fontSize: 10 }}>{(m.contextWindow / 1000).toFixed(0)}k</span> : null}
              {m.inputPricePerM ? <span className="model-chip" style={{ fontSize: 10 }}>{formatPricePerM(m.inputPricePerM, lang)}</span> : null}
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
  const { t } = useT();
  return (
    <>
      <div className="chat-toolbar">
        <div className="chat-toolbar-title">{t.appName}</div>
      </div>
      <div className="empty-state">
        <Logo size={72} />
        <div className="empty-title">{t.chatWelcome}</div>
        <div className="empty-sub">
          {t.chatWelcomeSub}<br />
          {t.chatWelcomeSub2}
        </div>
        <button className="btn btn-primary" onClick={newConversation} style={{ marginTop: 8 }}>
          <SparkleIcon size={16} /> {t.chatNew}
        </button>
      </div>
    </>
  );
};
