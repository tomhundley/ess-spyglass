import { ipcMain } from 'electron';
import store from '../store';

export interface Tab {
  id: string;
  path: string;
  name: string;
  color: string;
}

export interface Config {
  root_folder: string | null;
  global_hotkey: string | null;
  remember_location: boolean;
  last_location: string | null;
  show_hidden_files: boolean;
  tabs: Tab[] | null;
  active_tab_id: string | null;
}

const DEFAULT_CONFIG: Config = {
  root_folder: null,
  global_hotkey: 'CommandOrControl+Shift+Space',
  remember_location: true,
  last_location: null,
  show_hidden_files: true,
  tabs: null,
  active_tab_id: null,
};

export function registerConfigHandlers() {
  ipcMain.handle('config:load', async (): Promise<Config> => {
    const config = store.get('config', DEFAULT_CONFIG) as Config;
    return { ...DEFAULT_CONFIG, ...config };
  });

  ipcMain.handle('config:save', async (_event, config: Partial<Config>): Promise<void> => {
    const current = store.get('config', DEFAULT_CONFIG) as Config;
    store.set('config', { ...DEFAULT_CONFIG, ...current, ...config });
  });
}
