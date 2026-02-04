import { BrowserWindow, app } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  info?: {
    version: string;
    releaseDate?: string;
  };
  progress?: {
    percent: number;
    bytesPerSecond: number;
    total: number;
    transferred: number;
  };
  error?: string;
}

let mainWindow: BrowserWindow | null = null;
let updateState: UpdateState = { status: 'idle' };

function sendUpdateState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update:state-changed', updateState);
  }
}

function setUpdateState(newState: Partial<UpdateState>) {
  updateState = { ...updateState, ...newState };
  sendUpdateState();
}

export function initAutoUpdater(window: BrowserWindow) {
  // Only run in packaged app
  if (!app.isPackaged) {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  mainWindow = window;

  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    setUpdateState({ status: 'checking', error: undefined });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    setUpdateState({
      status: 'available',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
      },
    });
  });

  autoUpdater.on('update-not-available', () => {
    setUpdateState({ status: 'idle' });
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    setUpdateState({
      status: 'downloading',
      progress: {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        total: progress.total,
        transferred: progress.transferred,
      },
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    setUpdateState({
      status: 'downloaded',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
      },
      progress: undefined,
    });
  });

  autoUpdater.on('error', (error: Error) => {
    setUpdateState({
      status: 'error',
      error: error.message,
    });
  });

  // Check for updates on startup (after a short delay)
  setTimeout(() => {
    checkForUpdates();
  }, 3000);
}

export async function checkForUpdates(): Promise<void> {
  if (!app.isPackaged) {
    return;
  }
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

export async function downloadUpdate(): Promise<void> {
  if (!app.isPackaged) {
    return;
  }
  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error('Failed to download update:', error);
    setUpdateState({
      status: 'error',
      error: error instanceof Error ? error.message : 'Download failed',
    });
  }
}

export function installUpdate(): void {
  if (!app.isPackaged) {
    return;
  }
  autoUpdater.quitAndInstall();
}

export function getUpdateState(): UpdateState {
  return updateState;
}
