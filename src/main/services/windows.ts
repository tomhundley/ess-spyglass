import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

// Track all windows
const windows: Map<number, BrowserWindow> = new Map();
let mainWindowId: number | null = null;

export function createWindow(options: BrowserWindowConstructorOptions): BrowserWindow {
  const win = new BrowserWindow({
    show: false,
    backgroundColor: '#0b0f14',
    ...options,
  });

  // Track this window
  windows.set(win.id, win);

  // Set main window if this is the first
  if (mainWindowId === null) {
    mainWindowId = win.id;
  }

  // Clean up when closed
  win.on('closed', () => {
    windows.delete(win.id);
    if (mainWindowId === win.id) {
      mainWindowId = null;
    }
  });

  // Show when ready
  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

export function getMainWindow(): BrowserWindow | null {
  if (mainWindowId === null) return null;
  return windows.get(mainWindowId) || null;
}

export function getWindow(id: number): BrowserWindow | null {
  return windows.get(id) || null;
}

export function getAllWindows(): BrowserWindow[] {
  return Array.from(windows.values());
}

export function setMainWindow(win: BrowserWindow): void {
  mainWindowId = win.id;
}
