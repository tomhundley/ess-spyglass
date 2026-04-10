import { ipcMain } from 'electron';
import store from '../store';

export interface Tab {
  id: string;
  path: string;
  name: string;
  color: string;
}

export interface IndexPathEntry {
  path: string;
  recursive: boolean;
}

export interface Config {
  root_folder: string | null;        // legacy — migrated to index_paths
  global_hotkey: string | null;
  remember_location: boolean;
  last_location: string | null;
  show_hidden_files: boolean;
  tabs: Tab[] | null;
  active_tab_id: string | null;
  index_paths: IndexPathEntry[];
  exclude_patterns: string[];
}

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules', 'target', '.git', 'dist', 'build', '.next',
  'vendor', '__pycache__', '.venv', 'venv', '.cargo',
  'Library', '.Trash', 'Applications', '.cache', '.npm', '.yarn', 'Caches',
];

const DEFAULT_CONFIG: Config = {
  root_folder: null,
  global_hotkey: 'CommandOrControl+Shift+Space',
  remember_location: true,
  last_location: null,
  show_hidden_files: true,
  tabs: null,
  active_tab_id: null,
  index_paths: [],
  exclude_patterns: DEFAULT_EXCLUDE_PATTERNS,
};

export function registerConfigHandlers() {
  ipcMain.handle('config:load', async (): Promise<Config> => {
    const config = { ...DEFAULT_CONFIG, ...(store.get('config', DEFAULT_CONFIG) as Config) };

    // Migrate legacy root_folder to index_paths
    if (config.index_paths.length === 0 && config.root_folder) {
      config.index_paths = [{ path: config.root_folder, recursive: true }];
      store.set('config', config);
    }

    return config;
  });

  ipcMain.handle('config:save', async (_event, config: Partial<Config>): Promise<void> => {
    const current = store.get('config', DEFAULT_CONFIG) as Config;
    store.set('config', { ...DEFAULT_CONFIG, ...current, ...config });
  });
}
