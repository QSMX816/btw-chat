import { useEffect, useRef, useState } from 'react';

/**
 * 让条件渲染的覆盖层（抽屉 / sheet）在卸载前播一段退场动画。
 * - visible=true → 立即渲染（挂载，播入场动画）
 * - visible=false → 先 leaving=true 播退场，duration 后才真正卸载
 * 组件拿到 leaving 后给根节点加 data-leaving，CSS 据此切到退场关键帧。
 */
export function usePresence(visible: boolean, duration = 240) {
  const [render, setRender] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (visible) {
      setRender(true);
      setLeaving(false);
    } else if (render) {
      setLeaving(true);
      timer.current = window.setTimeout(() => {
        setRender(false);
        setLeaving(false);
        timer.current = null;
      }, duration);
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return { render, leaving };
}
