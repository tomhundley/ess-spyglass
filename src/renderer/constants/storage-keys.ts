// localStorage keys for persisting user preferences
export const STORAGE_KEYS = {
  THEME: 'spyglass-theme',
  SHOW_PATHS: 'spyglass-show-paths',
  WINDOW_SIZE: 'spyglass-window-size',
  FOCUS_COLLAPSED_HEIGHT: 'spyglass-focus-collapsed-height',
  FOCUS_EXPANDED_HEIGHT: 'spyglass-focus-expanded-height',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
