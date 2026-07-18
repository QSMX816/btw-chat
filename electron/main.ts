import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import * as path from 'path';
import { registerConfigHandlers } from './ipc/config';
import { registerConversationHandlers } from './ipc/conversations';
import { registerStreamHandlers } from './ipc/stream';
import { registerSearchHandlers } from './ipc/search';
import { registerSniffHandlers } from './ipc/sniff';
import { registerWindowHandlers, createWindow } from './ipc/window';

// 单例锁
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length) {
    if (wins[0].isMinimized()) wins[0].restore();
    wins[0].focus();
  }
});

app.whenReady().then(() => {
  // 注册 IPC
  registerConfigHandlers();
  registerConversationHandlers();
  registerStreamHandlers();
  registerSearchHandlers();
  registerSniffHandlers();
  registerWindowHandlers();

  // 使用 Vibrancy 风格（macOS）；Windows 通过 CSS backdrop-filter 实现
  nativeTheme.themeSource = 'dark';

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
