import React from 'react';
import { useConversations } from '../stores/conversations';
import { useT } from '../i18n';
import { useFollowScroll } from '../hooks/useFollowScroll';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { BackIcon, XIcon, SparkIcon } from './Icons';
import { Markdown } from './Markdown';

export const BtwSheet: React.FC = () => {
  const { t } = useT();
  const conv = useConversations();
  const open = conv.btwOpen;
  const parent = open ? conv.conversations.find((c) => c.id === open.convId) : undefined;
  const btw = parent?.btwConversations.find((b) => b.id === open?.btwId);
  const anchor = parent?.messages.find((m) => m.id === btw?.anchorMessageId);
  const messages = btw?.messages ?? [];

  const { ref, onScroll, jump, showJump, reset } = useFollowScroll([
    messages.length,
    messages[messages.length - 1]?.content,
    conv.btwStreaming,
  ]);
  React.useEffect(() => { reset(); }, [btw?.id, reset]);

  if (!open || !btw) return null;

  const close = () => conv.closeBtw();

  return (
    <div className="sheet">
      <div className="sheet-bar">
        <button className="icon-btn" onClick={close}><BackIcon size={22} /></button>
        <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="btw-badge"><SparkIcon size={11} /> {t.msgBtw}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t.btwChat}</span>
        </div>
        <button className="icon-btn" onClick={close} title={t.btwCloseHint}><XIcon size={20} /></button>
      </div>

      <div className="chat-scroll" ref={ref} onScroll={onScroll} style={{ position: 'relative' }}>
        {anchor && (
          <div style={{
            margin: '4px 4px 8px', padding: '10px 13px', borderRadius: 14,
            background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)',
            fontSize: 13, color: 'var(--text-secondary)',
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              {t.btwAbout}
            </div>
            <div style={{ maxHeight: 160, overflow: 'hidden' }}>
              <Markdown content={anchor.content.slice(0, 600) + (anchor.content.length > 600 ? '…' : '')} />
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="empty-state" style={{ flex: 0, padding: '40px 24px' }}>
            <div className="empty-logo" style={{ width: 56, height: 56, fontSize: 20 }}><SparkIcon size={26} /></div>
            <div className="empty-sub">{t.btwEmptySub2}</div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            compact
            live={conv.btwStreaming && i === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
      </div>

      {showJump && <button className="jump-fab" onClick={jump}>↓</button>}
      <Composer variant="btw" />
    </div>
  );
};
