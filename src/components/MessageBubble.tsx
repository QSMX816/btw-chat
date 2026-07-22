import React, { useState } from 'react';
import { Message } from '../types';
import { Markdown } from './Markdown';
import { BrainIcon, ChatIcon, ChevronDown } from './Icons';
import { useChat } from '../stores/conversations';
import { useT } from '../i18n';

interface Props {
  message: Message;
  isBtw?: boolean;
  btwId?: string; // 如果在 btw 面板里
}

export const MessageBubble: React.FC<Props> = ({ message, isBtw }) => {
  const { openBtwId, reopenBtw, startBtw, active } = useChat();
  const { t } = useT();
  const [thinkOpen, setThinkOpen] = useState(true);
  const isUser = message.role === 'user';
  const isLive = message.role === 'assistant' && message.content === '' && !!message.reasoning;
  const streaming = useChat((s) => s.streaming);

  // 锚点消息是否有关联的 btw（关闭状态下显示 tag）
  const linkedBtw = active?.btwConversations.find(
    (b) => b.id === message.btwThreadId || b.anchorMessageId === message.id
  );
  const showBtwTag = !isBtw && !isUser && linkedBtw && openBtwId !== linkedBtw.id;

  return (
    <div className={`msg-row ${message.role}`}>
      <div style={{ display: 'flex', gap: 10, width: '100%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div className={`msg-avatar ${isUser ? 'user' : 'ai'}`}>
          {isUser ? t.msgMe : t.msgBtw}
        </div>
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'stretch' }}>
          <div className="msg-bubble">
            {/* 思考过程 */}
            {message.reasoning && message.reasoning.trim() && (
              <div className="thinking">
                <div
                  className={`thinking-header ${isLive || (!message.thinkingDone && streaming) ? 'live' : ''}`}
                  onClick={() => setThinkOpen((v) => !v)}
                >
                  <span className="dot" />
                  <BrainIcon size={14} />
                  <span>
                    {message.thinkingDone ? t.thinkingProcess : t.thinkingNow}
                  </span>
                  <span style={{ marginLeft: 'auto', opacity: 0.6 }}>
                    <ChevronDown
                      size={14}
                      style={{ transform: thinkOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                    />
                  </span>
                </div>
                {thinkOpen && <div className="thinking-body">{message.reasoning}</div>}
              </div>
            )}

            {/* 正文 */}
            {message.content ? (
              isUser ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
              ) : (
                <Markdown content={message.content} />
              )
            ) : (
              !message.reasoning && streaming && (
                <div className="typing-dots"><span /><span /><span /></div>
              )
            )}

            {/* 附件（仅显示标记，文档正文已作为上下文发给模型，不在此铺开） */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <div className="msg-attachments">
                {message.attachments.filter((a) => a.kind === 'image' && a.data).map((a) => (
                  <img key={a.id} className="msg-att-img" src={`data:${a.type};base64,${a.data}`} alt={a.name} />
                ))}
                {message.attachments.filter((a) => a.kind === 'document').map((a) => (
                  <span key={a.id} className="msg-att-doc" title={a.name}>📄 {a.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* BTW 触发入口（仅在 assistant 消息且不在 btw 面板里）*/}
          {!isUser && !isBtw && !streaming && message.content && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {/* 已有 btw：显示 tag */}
              {showBtwTag && linkedBtw && (
                <span
                  className="btw-tag"
                  onClick={() => reopenBtw(linkedBtw.id)}
                  title={t.viewBtw}
                >
                  <ChatIcon size={13} />
                  BTW · {linkedBtw.messages.filter((m) => m.role === 'user').length} {t.msgs}
                </span>
              )}
              {/* 没有 btw：显示"顺便问一下"按钮 */}
              {!linkedBtw && (
                <span
                  className="btw-tag"
                  style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px dashed rgba(128,128,128,0.35)' }}
                  onClick={() => startBtw(message.id)}
                  title={t.askBtwHint}
                >
                  <ChatIcon size={13} />
                  {t.askBtw}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
