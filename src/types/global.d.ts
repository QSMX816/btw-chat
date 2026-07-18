import type { BtwAPI } from '../../electron/preload';

declare global {
  interface Window {
    btw: BtwAPI;
  }
}
