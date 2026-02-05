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
  show_hidden_files: boolean;
  tabs: Tab[] | null;
  active_tab_id: string | null;
}

export interface ContextMenu {
  x: number;
  y: number;
  entry: FileEntry;
}

export interface TabContextMenu {
  x: number;
  y: number;
  tab: Tab;
}

// Re-export TAB_COLORS from constants for backwards compatibility
export { TAB_COLORS } from '../constants/colors';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Auto-updater types
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
