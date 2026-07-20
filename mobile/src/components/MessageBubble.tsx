import React, { useState } from 'react';
import { Message } from '../types';
import { Markdown } from './Markdown';
import { useT } from '../i18n';
import { BrainIcon, SparkIcon, CopyIcon, CheckIcon, RefreshIcon, DocIcon } from './Icons';

interface Props {
  message: Message;
  live?: boolean; // 正在流式输出
  isLastAssistant?: boolean;
  onAskBtw?: () => void;
  onOpenBtw?: () => void;
  onRegenerate?: () => void;
  compact?: boolean;
}

export const MessageBubble: React.FC<Props> = ({
  message, live, isLastAssistant, onAskBtw, onOpenBtw, onRegenerate, compact,
}) => {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === 'user';
  const hasThinking = !!message.reasoning && message.reasoning.length > 0;
  const images = message.attachments?.filter((a) => a.type.startsWith('image/'));
  const docs = message.attachments?.filter((a) => a.kind === 'document');

  const copy = () => {
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
        {!isUser && <div className="msg-avatar ai">AI</div>}
        {isUser && <div className="msg-avatar user" style={{ order: 1 }}>{t.msgMe}</div>}
      </div>

      <div className="msg-bubble" style={isUser ? { order: 0 } : undefined}>
        {hasThinking && (
          <div className="thinking">
            <div className={`thinking-header ${live && !message.content ? 'live' : ''}`} onClick={() => setShowThinking((v) => !v)}>
              <span className="dot" />
              <BrainIcon size={14} />
              <span>{live && !message.content ? t.thinkingNow : t.thinkingProcess}</span>
            </div>
            {showThinking && <div className="thinking-body">{message.reasoning}</div>}
          </div>
        )}

        {message.content ? (
          <div className={live ? 'typing-cursor' : ''}>
            <Markdown content={message.content} />
          </div>
        ) : live && !hasThinking ? (
          <span className="typing-cursor" />
        ) : null}

        {(images?.length || docs?.length) ? (
          <div className="msg-attachments">
            {images?.map((img) => (
              <img key={img.id} className="msg-att-img" src={`data:${img.type};base64,${img.data}`} alt={img.name} />
            ))}
            {docs?.map((d) => (
              <span key={d.id} className="msg-att-doc">
                <DocIcon size={13} /> {d.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {!isUser && !live && message.content && (
        <div className="msg-actions">
          <button className="msg-action copy-only" onClick={copy}>
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />} {copied ? t.copied : t.copy}
          </button>
          {isLastAssistant && onRegenerate && (
            <button className="msg-action copy-only" onClick={onRegenerate}>
              <RefreshIcon size={13} /> {t.regenerate}
            </button>
          )}
          {message.btwThreadId ? (
            <button className="msg-action btw" onClick={onOpenBtw}>
              <SparkIcon size={13} /> {t.msgBtw}
            </button>
          ) : (
            onAskBtw && (
              <button className="msg-action btw" onClick={onAskBtw}>
                <SparkIcon size={13} /> {t.askBtw}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
