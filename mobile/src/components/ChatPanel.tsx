import React from 'react';
import { useConversations } from '../stores/conversations';
import { useFollowScroll } from '../hooks/useFollowScroll';
import { MessageBubble } from './MessageBubble';
import { ArrowDownIcon } from './Icons';

export const ChatPanel: React.FC = () => {
  const conv = useConversations();
  const active = conv.conversations.find((c) => c.id === conv.activeId);
  const messages = active?.messages ?? [];

  const { ref, onScroll, jump, showJump, reset } = useFollowScroll([
    messages.length,
    messages[messages.length - 1]?.content,
    messages[messages.length - 1]?.reasoning,
    conv.streaming,
  ]);

  React.useEffect(() => { reset(); /* eslint-disable-next-line */ }, [active?.id]);

  if (!active) return null;

  let lastAssistant = -1;
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'assistant') { lastAssistant = i; break; }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
      <div className="chat" ref={ref} onScroll={onScroll}>
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            live={conv.streaming && i === messages.length - 1 && m.role === 'assistant'}
            isLastAssistant={i === lastAssistant}
            onAskBtw={() => conv.startBtw(active.id, m.id)}
            onOpenBtw={() => m.btwThreadId && conv.reopenBtw(active.id, m.btwThreadId)}
            onRegenerate={() => conv.regenerate()}
          />
        ))}
      </div>
      {showJump && <button className="jump" onClick={jump}><ArrowDownIcon size={18} /></button>}
    </div>
  );
};
