import React, { useState } from 'react';
import { Message } from '../types';
import { Markdown } from './Markdown';
import { BrainIcon, ChatIcon, ChevronDown } from './Icons';
import { useChat } from '../stores/conversations';

interface Props {
  message: Message;
  isBtw?: boolean;
  btwId?: string; // 如果在 btw 面板里
}

export const MessageBubble: React.FC<Props> = ({ message, isBtw }) => {
  const { openBtwId, reopenBtw, startBtw, active } = useChat();
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
      <div style={{ display: 'flex', gap: 10, maxWidth: '100%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div className={`msg-avatar ${isUser ? 'user' : 'ai'}`}>
          {isUser ? '我' : 'BTW'}
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
                    {message.thinkingDone ? '思考过程' : '正在思考…'}
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
              !message.reasoning && streaming && <span className="typing-cursor" />
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
                  title="查看 BTW 对话"
                >
                  <ChatIcon size={13} />
                  BTW · {linkedBtw.messages.filter((m) => m.role === 'user').length} 条
                </span>
              )}
              {/* 没有 btw：显示"顺便问一下"按钮 */}
              {!linkedBtw && (
                <span
                  className="btw-tag"
                  style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px dashed rgba(128,128,128,0.35)' }}
                  onClick={() => startBtw(message.id)}
                  title="就这条回答，顺便问点别的"
                >
                  <ChatIcon size={13} />
                  顺便问一下 (BTW)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
