import { ipcMain, BrowserWindow, clipboard, nativeTheme, app } from 'electron';
import { registerFileSystemHandlers } from './fileSystem';
import { registerConfigHandlers } from './config';
import { registerIndexerHandlers } from './indexer';
import { createWindow } from '../services/windows';
import { join } from 'path';

export function registerIpcHandlers() {
  // Register domain-specific handlers
  registerFileSystemHandlers();
  registerConfigHandlers();
  registerIndexerHandlers();

  // Clipboard
  ipcMain.handle('clipboard:write', async (_event, text: string) => {
    clipboard.writeText(text);
  });

  // Window management
  ipcMain.handle('window:create', async (_event, path: string) => {
    const name = path.split('/').pop() || 'Spyglass';
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

    // Pass the path to the new window
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('init-path', path);
    });

    if (process.env.NODE_ENV === 'development') {
      win.loadURL(`http://localhost:5173?path=${encodeURIComponent(path)}`);
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { path },
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
