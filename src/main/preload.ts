import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for the exposed API
export interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
}

export interface IndexEntry {
  name: string;
  path: string;
  is_directory: boolean;
  parent_folder: string;
}

export interface IndexProgress {
  total_folders: number;
  indexed_folders: number;
  total_files: number;
  current_folder: string;
  is_complete: boolean;
}

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
  tabs: Tab[] | null;
  active_tab_id: string | null;
}

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
}

export interface ProgressInfo {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  info?: UpdateInfo;
  progress?: ProgressInfo;
  error?: string;
}

export interface ElectronAPI {
  // File system operations
  readDirectory: (path: string) => Promise<FileEntry[]>;
  getParentPath: (path: string) => Promise<string | null>;
  getHomeDir: () => Promise<string>;
  pathExists: (path: string) => Promise<boolean>;

  // Clipboard
  copyToClipboard: (text: string) => Promise<void>;

  // Config
  loadConfig: () => Promise<Config>;
  saveConfig: (config: Config) => Promise<void>;

  // Indexing
  startIndexing: () => Promise<void>;
  getIndexProgress: () => Promise<IndexProgress>;
  searchIndex: (query: string) => Promise<IndexEntry[]>;
  loadSavedIndex: () => Promise<boolean>;
  getIndexCount: () => Promise<number>;

  // Window management
  createNewWindow: (path: string) => Promise<void>;
  setWindowSize: (width: number, height: number) => Promise<void>;
  getWindowSize: () => Promise<{ width: number; height: number }>;
  minimizeWindow: () => void;
  closeWindow: () => void;

  // Theme
  getSystemTheme: () => Promise<'light' | 'dark'>;
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void;

  // Window focus events
  setupWindowFocusEvents: () => Promise<void>;
  onWindowBlur: (callback: () => void) => () => void;
  onWindowFocus: (callback: () => void) => () => void;

  // App info
  getAppVersion: () => Promise<string>;

  // Auto-updater
  getUpdateState: () => Promise<UpdateState>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  onUpdateStateChanged: (callback: (state: UpdateState) => void) => () => void;

  // Menu events
  onOpenSettings: (callback: () => void) => () => void;
}

// Expose the API to the renderer process
const api: ElectronAPI = {
  // File system operations
  readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
  getParentPath: (path: string) => ipcRenderer.invoke('fs:getParentPath', path),
  getHomeDir: () => ipcRenderer.invoke('fs:getHomeDir'),
  pathExists: (path: string) => ipcRenderer.invoke('fs:pathExists', path),

  // Clipboard
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),

  // Config
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config: Config) => ipcRenderer.invoke('config:save', config),

  // Indexing
  startIndexing: () => ipcRenderer.invoke('indexer:start'),
  getIndexProgress: () => ipcRenderer.invoke('indexer:getProgress'),
  searchIndex: (query: string) => ipcRenderer.invoke('indexer:search', query),
  loadSavedIndex: () => ipcRenderer.invoke('indexer:loadSaved'),
  getIndexCount: () => ipcRenderer.invoke('indexer:getCount'),

  // Window management
  createNewWindow: (path: string) => ipcRenderer.invoke('window:create', path),
  setWindowSize: (width: number, height: number) => ipcRenderer.invoke('window:setSize', width, height),
  getWindowSize: () => ipcRenderer.invoke('window:getSize'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Theme
  getSystemTheme: () => ipcRenderer.invoke('theme:getSystem'),
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isDark: boolean) => callback(isDark);
    ipcRenderer.on('theme-changed', handler);
    return () => ipcRenderer.removeListener('theme-changed', handler);
  },

  // Window focus events
  setupWindowFocusEvents: () => ipcRenderer.invoke('window:setupFocusEvents'),
  onWindowBlur: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('window-blur', handler);
    return () => ipcRenderer.removeListener('window-blur', handler);
  },
  onWindowFocus: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('window-focus', handler);
    return () => ipcRenderer.removeListener('window-focus', handler);
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Auto-updater
  getUpdateState: () => ipcRenderer.invoke('update:getState'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateStateChanged: (callback: (state: UpdateState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: UpdateState) => callback(state);
    ipcRenderer.on('update:state-changed', handler);
    return () => ipcRenderer.removeListener('update:state-changed', handler);
  },

  // Menu events
  onOpenSettings: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('open-settings', handler);
    return () => ipcRenderer.removeListener('open-settings', handler);
  },
};

contextBridge.exposeInMainWorld('electron', api);

// Also expose types for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
