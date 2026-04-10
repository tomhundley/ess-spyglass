// localStorage keys for persisting user preferences
export const STORAGE_KEYS = {
  THEME: 'spyglass-theme',
  SHOW_PATHS: 'spyglass-show-paths',
  USE_INDEX_SEARCH: 'spyglass-use-index-search',
  WINDOW_SIZE: 'spyglass-window-size',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
