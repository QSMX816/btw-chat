import { useEffect } from 'react';
import { useConfig } from '../stores/config';

// 把主题 + 模式 + 玻璃强度 + 字号应用到 <html> 上
export function useTheme() {
  const { settings } = useConfig();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-mode', settings.themeMode);
    root.style.setProperty('--glass-blur', `${20 + (settings.glassIntensity / 100) * 24}px`);
    root.style.setProperty('--glass-saturate', `${1.3 + (settings.glassIntensity / 100) * 1.2}`);
    root.style.setProperty('--font-scale', `${settings.fontScale / 100}`);
  }, [settings.theme, settings.themeMode, settings.glassIntensity, settings.fontScale]);
}
