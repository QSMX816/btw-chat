import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useConfig } from '../stores/config';

// 应用主题 + 显示模式 + 字号缩放到 <html>，并同步 Android 状态栏样式。
export function useTheme() {
  const { settings } = useConfig();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.style.setProperty('--font-scale', String(settings.fontScale / 100));

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = settings.themeMode === 'dark' || (settings.themeMode === 'auto' && prefersDark);
    root.setAttribute('data-mode', isDark ? 'dark' : 'light');

    // 同步状态栏（仅原生平台）
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      // 状态栏底色跟随纯色背景，避免突兀
      StatusBar.setBackgroundColor({ color: isDark ? '#1b1b22' : '#eef0f4' }).catch(() => {});
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#1b1b22' : '#eef0f4');
  }, [settings.theme, settings.themeMode, settings.fontScale]);
}
