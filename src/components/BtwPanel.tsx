import React from 'react';
import { useChat } from '../stores/conversations';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { CloseIcon, ChatIcon, ChevronDown } from './Icons';
import { useFollowScroll } from '../hooks/useFollowScroll';
import { useT } from '../i18n';

export const BtwPanel: React.FC = () => {
  const { openBtwId, active, streaming, closeBtw } = useChat();
  const { t } = useT();
  const btw = openBtwId && active ? active.btwConversations.find((b) => b.id === openBtwId) : undefined;
  const { ref, onScroll, jump, showJump } = useFollowScroll({
    messages: btw?.messages ?? [],
    streaming,
    convId: btw?.id,
  });
  if (!openBtwId || !active || !btw) return null;

  const anchorMsg = active.messages.find((m) => m.id === btw.anchorMessageId);

  return (
    <aside className="btw-panel glass-strong">
      <div className="btw-header">
        <span className="btw-badge">
          <ChatIcon size={12} /> {t.msgBtw}
        </span>
        <span className="btw-header-title">
          {anchorMsg ? `${t.btwAbout}: ${anchorMsg.content.slice(0, 28)}${anchorMsg.content.length > 28 ? '…' : ''}` : t.btwChat}
        </span>
        <button className="btn btn-icon" title={t.btwCloseHint} onClick={() => closeBtw(btw.id)}>
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="btw-messages" ref={ref} onScroll={onScroll}>
        {btw.messages.length === 0 && (
          <div className="empty-state" style={{ padding: 20 }}>
            <div className="empty-logo" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 16 }}>💬</div>
            <div className="empty-sub" style={{ fontSize: 13 }}>
              {t.btwEmptySub}<br />{t.btwEmptySub2}
            </div>
          </div>
        )}
        {btw.messages.map((m) => (
          <MessageBubble key={m.id} message={m} isBtw />
        ))}
      </div>

      {showJump && (
        <button className="jump-fab btw" title={t.scrollToBottom} onClick={jump}>
          <ChevronDown size={16} />
        </button>
      )}

      <Composer variant="btw" btwId={btw.id} />
    </aside>
  );
};
