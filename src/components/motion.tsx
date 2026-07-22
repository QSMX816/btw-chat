import { motion } from 'framer-motion';
import type { Transition, Variants, PanInfo } from 'framer-motion';

// ============ 弹簧过渡 ============
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 34, mass: 0.7 };
export const springSoft: Transition = { type: 'spring', stiffness: 280, damping: 30, mass: 0.8 };
export const springBouncy: Transition = { type: 'spring', stiffness: 340, damping: 26 };

// ============ 覆盖层变体 ============
export const scrimV: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// 桌面模态：缩放 + 上浮 + 淡入（材质化）
export const modalV: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

// BTW 分栏：从右滑入 + 轻微缩放
export const btwV: Variants = {
  initial: { opacity: 0, x: 24, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 24, scale: 0.98 },
};

export const msgV: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export const fadeV: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function shouldDismiss(_e: unknown, info: PanInfo, axis: 'x' | 'y', threshold = 120, velocity = 600): boolean {
  const off = axis === 'x' ? info.offset.x : info.offset.y;
  const vel = axis === 'x' ? info.velocity.x : info.velocity.y;
  if (axis === 'x') return off < -threshold || vel < -velocity;
  return off > threshold || vel > velocity;
}

export { motion };
