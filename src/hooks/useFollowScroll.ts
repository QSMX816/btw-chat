import { useEffect, useRef, useState } from 'react';
import type { Message } from '../types';

interface Opts {
  messages: Pick<Message, 'content' | 'role'>[];
  streaming: boolean;
  /** 对话 id：变化时认为切换了对话，强制回到底部 */
  convId?: string;
}

/**
 * 聊天列表滚动逻辑：
 *  - 流式输出 token 时，若用户停在底部则自动跟随滚动（保留原行为）
 *  - 用户主动往上滚（滚轮 / 拖滚动条）→ 停止跟随，露出「回到底部」按钮
 *  - 用户发送新消息 / 切换对话 → 重新跟随并回到底部
 */
export function useFollowScroll({ messages, convId }: Opts) {
  const ref = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const prevLen = useRef(messages.length);
  const prevConv = useRef(convId);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 72;
    follow.current = atBottom;
    // 只有内容确实超出视口时才显示「回到底部」
    setShowJump(!atBottom && el.scrollHeight - el.clientHeight > 120);
  };

  const jump = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    follow.current = true;
    setShowJump(false);
  };

  // 内容指纹：token 持续追加时 fingerprint 会变化，触发跟随滚动
  const fingerprint = messages.reduce((n, m) => n + m.content.length, 0) + messages.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 切换对话 → 强制回到底部并恢复跟随
    if (convId !== prevConv.current) {
      prevConv.current = convId;
      prevLen.current = messages.length;
      follow.current = true;
      setShowJump(false);
      el.scrollTop = el.scrollHeight;
      return;
    }

    // 用户刚发出一条消息 → 回到底部
    const len = messages.length;
    const justSentUser = len > prevLen.current && messages[len - 1]?.role === 'user';
    prevLen.current = len;
    if (justSentUser) {
      follow.current = true;
      setShowJump(false);
      el.scrollTop = el.scrollHeight;
      return;
    }

    // 其它情况（流式 token 增长）：仅在仍在跟随时滚到底
    if (follow.current) {
      el.scrollTop = el.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, convId]);

  return { ref, onScroll, jump, showJump };
}
