import { useState, useCallback, useMemo, useEffect } from 'react';
import * as api from '../api/electron';
import { FileEntry } from '../types';
import { BREADCRUMB_MAX_SEGMENTS } from '../constants';

interface BreadcrumbSegment {
  name: string;
  path: string;
}

export function useNavigation() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.readDirectory(path);
      setEntries(result);
      setCurrentPath(path);
    } catch (e) {
      setError(String(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    const parts = currentPath.split('/').filter(Boolean);
    const segments: BreadcrumbSegment[] = [];
    let path = '';
    for (const part of parts) {
      path += '/' + part;
      segments.push({ name: part, path });
    }
    return segments.slice(-BREADCRUMB_MAX_SEGMENTS);
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
          // Start in last location or home directory
          const startPath = cfg.last_location || await api.getHomeDir();
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
