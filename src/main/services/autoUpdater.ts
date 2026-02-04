import { BrowserWindow, app, dialog, clipboard } from 'electron';
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
let isManualCheck = false;

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

  autoUpdater.on('update-available', async (info: UpdateInfo) => {
    setUpdateState({
      status: 'available',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
      },
    });

    if (isManualCheck) {
      isManualCheck = false;
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version of Spyglass is available!`,
        detail: `Version ${info.version} is ready to download.\n\nCurrent version: ${app.getVersion()}`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
      });

      if (result.response === 0) {
        downloadUpdate();
      }
    }
  });

  autoUpdater.on('update-not-available', () => {
    setUpdateState({ status: 'idle' });
    if (isManualCheck) {
      isManualCheck = false;
      dialog.showMessageBox({
        type: 'info',
        title: 'No Updates Available',
        message: 'You\'re up to date!',
        detail: `Spyglass ${app.getVersion()} is the latest version.`,
        buttons: ['OK'],
      });
    }
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

  autoUpdater.on('error', async (error: Error) => {
    const errorMessage = error.message;
    setUpdateState({
      status: 'error',
      error: errorMessage,
    });

    if (isManualCheck) {
      isManualCheck = false;
      const result = await dialog.showMessageBox({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to check for updates',
        detail: errorMessage,
        buttons: ['Copy Error', 'OK'],
        defaultId: 1,
      });

      if (result.response === 0) {
        clipboard.writeText(errorMessage);
      }
    }
  });

  // Check for updates on startup (after a short delay)
  setTimeout(() => {
    checkForUpdates();
  }, 3000);
}

export async function checkForUpdates(manual = false): Promise<void> {
  if (!app.isPackaged) {
    if (manual) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Development Mode',
        message: 'Auto-update is disabled in development mode.',
        buttons: ['OK'],
      });
    }
    return;
  }
  isManualCheck = manual;
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Failed to check for updates:', error);
    if (manual) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Failed to check for updates.',
        detail: error instanceof Error ? error.message : 'Unknown error',
        buttons: ['OK'],
      });
    }
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
