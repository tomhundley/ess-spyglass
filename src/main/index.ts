import { app, BrowserWindow, nativeTheme, globalShortcut } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc';
import { createTray, destroyTray } from './services/tray';
import { createWindow, getAllWindows, getMainWindow } from './services/windows';
import store from './store';

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  // Get saved window size
  const savedSize = store.get('windowSize', { width: 700, height: 600 }) as { width: number; height: number };

  mainWindow = createWindow({
    width: savedSize.width,
    height: savedSize.height,
    minWidth: 300,
    minHeight: 38,
    title: 'Spyglass',
    show: false,
    frame: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    transparent: false,
    resizable: true,
    movable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Load the renderer - use electron-vite's URL in dev mode
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Save window size on resize
  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isMinimized()) {
      const [width, height] = mainWindow.getSize();
      store.set('windowSize', { width, height });
    }
  });

  // Handle close - hide to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus the main window if another instance is launched
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Register IPC handlers
    registerIpcHandlers();

    // Create the main window
    createMainWindow();

    // Create system tray
    createTray();

    // Register global shortcut
    const hotkey = store.get('globalHotkey', 'CommandOrControl+Shift+Space') as string;
    try {
      globalShortcut.register(hotkey, () => {
        const win = getMainWindow() || mainWindow;
        if (win) {
          if (win.isVisible() && win.isFocused()) {
            win.hide();
          } else {
            win.show();
            win.focus();
          }
        }
      });
    } catch (e) {
      console.error('Failed to register global shortcut:', e);
    }

    // Handle theme changes
    nativeTheme.on('updated', () => {
      const windows = getAllWindows();
      windows.forEach(win => {
        win.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors);
      });
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    (app as any).isQuitting = true;
    globalShortcut.unregisterAll();
    destroyTray();
  });
}

// Export for external access
export function getAppMainWindow(): BrowserWindow | null {
  return mainWindow;
}
