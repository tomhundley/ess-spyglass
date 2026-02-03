// Type-safe wrapper for Electron IPC
import type { FileEntry, IndexEntry, IndexProgress, Config } from '../types';

// Get the electron API from preload script
const electron = window.electron;

// File system operations
export async function readDirectory(path: string): Promise<FileEntry[]> {
  return electron.readDirectory(path);
}

export async function getParentPath(path: string): Promise<string | null> {
  return electron.getParentPath(path);
}

export async function getHomeDir(): Promise<string> {
  return electron.getHomeDir();
}

export async function pathExists(path: string): Promise<boolean> {
  return electron.pathExists(path);
}

// Clipboard
export async function copyToClipboard(text: string): Promise<void> {
  return electron.copyToClipboard(text);
}

// Config
export async function loadConfig(): Promise<Config> {
  return electron.loadConfig();
}

export async function saveConfig(config: Config): Promise<void> {
  return electron.saveConfig(config);
}

// Indexing
export async function startIndexing(): Promise<void> {
  return electron.startIndexing();
}

export async function getIndexProgress(): Promise<IndexProgress> {
  return electron.getIndexProgress();
}

export async function searchIndex(query: string): Promise<IndexEntry[]> {
  return electron.searchIndex(query);
}

export async function loadSavedIndex(): Promise<boolean> {
  return electron.loadSavedIndex();
}

export async function getIndexCount(): Promise<number> {
  return electron.getIndexCount();
}

// Window management
export async function createNewWindow(path: string): Promise<void> {
  return electron.createNewWindow(path);
}

export async function setWindowSize(width: number, height: number): Promise<void> {
  return electron.setWindowSize(width, height);
}

export async function getWindowSize(): Promise<{ width: number; height: number }> {
  return electron.getWindowSize();
}

// Theme
export async function getSystemTheme(): Promise<'light' | 'dark'> {
  return electron.getSystemTheme();
}

export function onThemeChanged(callback: (isDark: boolean) => void): () => void {
  return electron.onThemeChanged(callback);
}

// Window focus events
export async function setupWindowFocusEvents(): Promise<void> {
  return electron.setupWindowFocusEvents();
}

export function onWindowBlur(callback: () => void): () => void {
  return electron.onWindowBlur(callback);
}

export function onWindowFocus(callback: () => void): () => void {
  return electron.onWindowFocus(callback);
}
