import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/electron';

export function useHiddenFiles() {
  const [showHiddenFiles, setShowHiddenFiles] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    let mounted = true;

    async function loadPreference() {
      try {
        const config = await api.loadConfig();
        if (mounted) {
          setShowHiddenFiles(config.show_hidden_files ?? true);
        }
      } catch (e) {
        console.error('Failed to load hidden files preference:', e);
      }
    }

    loadPreference();
    return () => { mounted = false; };
  }, []);

  const persistPreference = useCallback((value: boolean) => {
    void (async () => {
      try {
        await api.saveConfig({ show_hidden_files: value });
      } catch (e) {
        console.error('Failed to save hidden files preference:', e);
      }
    })();
  }, []);

  const toggleShowHiddenFiles = useCallback(() => {
    setShowHiddenFiles(prev => {
      const next = !prev;
      persistPreference(next);
      return next;
    });
  }, [persistPreference]);

  return {
    showHiddenFiles,
    toggleShowHiddenFiles,
  };
}
