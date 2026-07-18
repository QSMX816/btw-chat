import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    frame: process.platform === 'darwin',
    backgroundColor: '#00000000',
    transparent: false,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 自定义标题栏拖拽区域由 CSS 处理
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.on('maximize', () => mainWindow?.webContents.send('win:maximize-changed', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('win:maximize-changed', false));

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', '..', 'dist', 'index.html'));
  }

  return mainWindow;
}

export function registerWindowHandlers() {
  ipcMain.handle('win:minimize', () => mainWindow?.minimize());
  ipcMain.handle('win:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('win:close', () => mainWindow?.close());
}
