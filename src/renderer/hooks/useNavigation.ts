import { useState, useCallback, useMemo, useEffect } from 'react';
import * as api from '../api/electron';
import { FileEntry } from '../types';
import { BREADCRUMB_MAX_SEGMENTS } from '../constants';
import { buildBreadcrumbSegments, type BreadcrumbSegment } from '../utils/path';

export function useNavigation() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rememberLocation, setRememberLocation] = useState(true);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.readDirectory(path);
      setEntries(result);
      setCurrentPath(path);
      if (rememberLocation) {
        void api.saveConfig({ last_location: path });
      }
    } catch (e) {
      setError(String(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [rememberLocation]);

  const navigateTo = useCallback(async (path: string) => {
    await loadDirectory(path);
  }, [loadDirectory]);

  const navigateBack = useCallback(async () => {
    if (!currentPath) return;
    try {
      const parent = await api.getParentPath(currentPath);
      if (parent) {
        await navigateTo(parent);
      }
    } catch (e) {
      console.error('Navigate back failed:', e);
    }
  }, [currentPath, navigateTo]);

  const openInNewWindow = useCallback(async (path: string) => {
    try {
      await api.createNewWindow(path);
    } catch (e) {
      console.error('Failed to open new window:', e);
    }
  }, []);

  // Build breadcrumb segments
  const breadcrumbSegments = useMemo((): BreadcrumbSegment[] => {
    if (!currentPath) return [];
    return buildBreadcrumbSegments(currentPath).slice(-BREADCRUMB_MAX_SEGMENTS);
  }, [currentPath]);

  // Initialize with path from URL or home directory
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Check for path in URL (for new windows)
        const urlParams = new URLSearchParams(window.location.search);
        const pathParam = urlParams.get('path');

        if (pathParam && mounted) {
          await loadDirectory(pathParam);
          return;
        }

        // Load saved config for last location
        const cfg = await api.loadConfig();

        if (mounted) {
          const shouldRemember = cfg.remember_location ?? true;
          setRememberLocation(shouldRemember);

          // Prefer a configured root folder, then last location, then home directory.
          const fallbackRoot = cfg.root_folder || await api.getHomeDir();
          const preferred = (shouldRemember && cfg.last_location) ? cfg.last_location : fallbackRoot;
          const exists = await api.pathExists(preferred);
          const startPath = exists ? preferred : fallbackRoot;
          await loadDirectory(startPath);
        }
      } catch (e) {
        if (mounted) {
          // Fallback to home directory
          try {
            const homePath = await api.getHomeDir();
            await loadDirectory(homePath);
          } catch {
            setError(String(e));
            setLoading(false);
          }
        }
      }
    }

    init();
    return () => { mounted = false; };
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    currentPath,
    entries,
    loading,
    error,
    navigateTo,
    navigateBack,
    openInNewWindow,
    breadcrumbSegments,
    loadDirectory,
  };
}
