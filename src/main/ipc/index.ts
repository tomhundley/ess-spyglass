import { ipcMain, BrowserWindow, clipboard, nativeTheme, app, shell } from 'electron';
import { registerFileSystemHandlers } from './fileSystem';
import { registerConfigHandlers } from './config';
import { registerIndexerHandlers } from './indexer';
import { registerAutoUpdaterHandlers } from './autoUpdater';
import { createWindow } from '../services/windows';
import { join, basename } from 'path';

export function registerIpcHandlers() {
  // Register domain-specific handlers
  registerFileSystemHandlers();
  registerConfigHandlers();
  registerIndexerHandlers();
  registerAutoUpdaterHandlers();

  // Clipboard
  ipcMain.handle('clipboard:write', async (_event, text: string) => {
    clipboard.writeText(text);
  });

  // Shell / OS integration
  ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
    const error = await shell.openPath(targetPath);
    if (error) {
      throw new Error(error);
    }
  });

  ipcMain.handle('shell:showItemInFolder', async (_event, targetPath: string) => {
    shell.showItemInFolder(targetPath);
  });

  // Window management
  ipcMain.handle('window:create', async (_event, targetPath: string) => {
    const name = basename(targetPath) || 'Spyglass';
    const win = createWindow({
      width: 700,
      height: 600,
      title: `Spyglass - ${name}`,
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
      },
    });

    const rendererUrl = process.env.ELECTRON_RENDERER_URL;
    if (rendererUrl) {
      const url = new URL(rendererUrl);
      url.searchParams.set('path', targetPath);
      win.loadURL(url.toString());
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { path: targetPath },
      });
    }
  });

  ipcMain.handle('window:setSize', async (event, width: number, height: number) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setSize(width, height);
    }
  });

  ipcMain.handle('window:getSize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const [width, height] = win.getSize();
      return { width, height };
    }
    return { width: 700, height: 600 };
  });

  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  // Window focus events - forward to renderer
  ipcMain.handle('window:setupFocusEvents', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.on('blur', () => {
        if (!win.isDestroyed()) {
          win.webContents.send('window-blur');
        }
      });
      win.on('focus', () => {
        if (!win.isDestroyed()) {
          win.webContents.send('window-focus');
        }
      });
    }
  });

  // Theme
  ipcMain.handle('theme:getSystem', async () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  // App info
  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion();
  });
}
