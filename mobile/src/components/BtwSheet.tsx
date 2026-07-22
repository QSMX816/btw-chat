import React from 'react';
import { motion, sheetV, springSoft } from './motion';
import { useConversations } from '../stores/conversations';
import { useT } from '../i18n';
import { useFollowScroll } from '../hooks/useFollowScroll';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { Markdown } from './Markdown';
import { BackIcon, XIcon, SparkIcon, ArrowDownIcon } from './Icons';

export const BtwSheet: React.FC<{ open: { convId: string; btwId: string } | null; onClose: () => void }> = ({ open, onClose }) => {
  const { t } = useT();
  const conv = useConversations();
  const parent = open ? conv.conversations.find((c) => c.id === open.convId) : undefined;
  const btw = parent?.btwConversations.find((b) => b.id === open?.btwId);
  const anchor = parent?.messages.find((m) => m.id === btw?.anchorMessageId);
  const messages = btw?.messages ?? [];

  const { ref, onScroll, jump, showJump, reset } = useFollowScroll([messages.length, messages[messages.length - 1]?.content, conv.btwStreaming]);
  React.useEffect(() => { reset(); /* eslint-disable-next-line */ }, [btw?.id]);

  if (!open || !btw) return null;

  return (
    <motion.div className="sheet" variants={sheetV} initial="initial" animate="animate" exit="exit" transition={springSoft}>
      <div className="sheet-bar">
        <button className="icon-btn" onClick={onClose}><BackIcon size={22} /></button>
        <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}><SparkIcon size={11} /> {t.msgBtw}</span>
        </div>
        <button className="icon-btn" onClick={onClose} title={t.btwCloseHint}><XIcon size={20} /></button>
      </div>

      <div className="chat" ref={ref} onScroll={onScroll} style={{ position: 'relative' }}>
        {anchor && (
          <div className="btw-anchor">
            <div className="h">{t.btwAbout}</div>
            <div className="c"><Markdown content={anchor.content.slice(0, 600) + (anchor.content.length > 600 ? '…' : '')} /></div>
          </div>
        )}
        {messages.length === 0 && (
          <div className="empty" style={{ flex: 0, padding: '40px 24px' }}>
            <div className="empty-mark" style={{ width: 54, height: 54, fontSize: 20 }}><SparkIcon size={26} /></div>
            <div className="empty-sub">{t.btwEmptySub2}</div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={m.id} message={m} live={conv.btwStreaming && i === messages.length - 1 && m.role === 'assistant'} />
        ))}
      </div>

      {showJump && <button className="jump" onClick={jump}><ArrowDownIcon size={18} /></button>}
      <Composer variant="btw" />
    </motion.div>
  );
};
