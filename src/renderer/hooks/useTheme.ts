import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/electron';
import { STORAGE_KEYS } from '../constants';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);

      const unsubscribe = api.onThemeChanged(applyTheme);

      return () => {
        mediaQuery.removeEventListener('change', handler);
        unsubscribe();
      };
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    changeTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
  }, [theme, changeTheme]);

  return {
    theme,
    changeTheme,
    cycleTheme,
  };
}
