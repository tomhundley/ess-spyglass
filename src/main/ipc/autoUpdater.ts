import { ipcMain } from 'electron';
import {
  getUpdateState,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
} from '../services/autoUpdater';

export function registerAutoUpdaterHandlers() {
  ipcMain.handle('update:getState', async () => {
    return getUpdateState();
  });

  ipcMain.handle('update:check', async () => {
    await checkForUpdates();
  });

  ipcMain.handle('update:download', async () => {
    await downloadUpdate();
  });

  ipcMain.handle('update:install', async () => {
    installUpdate();
  });
}
