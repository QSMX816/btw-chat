import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.btw.chat',
  appName: 'BTW Chat',
  webDir: 'dist',
  android: {
    // 让 WebView 走 https 协议（默认），避免混合内容限制
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      launchAutoHide: true,
      backgroundColor: '#eef0f4',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    // 覆盖状态栏样式在运行时由 JS 设置（StatusBar plugin）
  },
};

export default config;
