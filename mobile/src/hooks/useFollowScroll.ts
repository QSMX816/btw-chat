import { useCallback, useEffect, useRef, useState } from 'react';

// 聊天区滚动跟随：流式输出时自动贴底；用户手动上滑则停止跟随并显示「回到底部」。
export function useFollowScroll(deps: unknown[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const follow = useRef(true);
  const [showJump, setShowJump] = useState(false);

  // 依赖变化（新消息/token）时，若仍处于跟随状态就贴底
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (follow.current) {
      el.scrollTop = el.scrollHeight;
      setShowJump(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    follow.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  const jump = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    follow.current = true;
    setShowJump(false);
  }, []);

  // 切换对话/打开面板时重置为跟随
  const reset = useCallback(() => {
    follow.current = true;
    setShowJump(false);
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return { ref, onScroll, jump, showJump, reset };
}
