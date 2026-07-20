import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// 移动端构建：产物给 Capacitor 打进 APK 的 WebView 用。
// assetsInlineLimit 设小一点，避免 pdfjs worker / 字体被内联成 base64 出问题。
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 2000,
    },
});
