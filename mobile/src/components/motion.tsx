import { motion } from 'framer-motion';
import type { Transition, Variants, PanInfo } from 'framer-motion';

// ============ 弹簧过渡 ============
// critically damped 为主：干脆、不浮夸；只在拖拽甩动等物理交互上加点回弹。
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 34, mass: 0.7 };
export const springSoft: Transition = { type: 'spring', stiffness: 280, damping: 30, mass: 0.8 };
export const springBouncy: Transition = { type: 'spring', stiffness: 340, damping: 26 };

// ============ 覆盖层变体（进/出同路径）============
export const scrimV: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const drawerV: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

// 全屏 sheet：从右缘推入（iOS 导航 push 质感）
export const sheetV: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

// 底部 sheet：从底部托起
export const bottomSheetV: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

// 消息进场
export const msgV: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

// 通用淡入
export const fadeV: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// 拖拽甩动判定：位移过阈 或 速度够快 → 关闭
export function shouldDismiss(_e: unknown, info: PanInfo, axis: 'x' | 'y', threshold = 120, velocity = 600): boolean {
  const off = axis === 'x' ? info.offset.x : info.offset.y;
  const vel = axis === 'x' ? info.velocity.x : info.velocity.y;
  if (axis === 'x') return off < -threshold || vel < -velocity;
  return off > threshold || vel > velocity;
}

export { motion };
