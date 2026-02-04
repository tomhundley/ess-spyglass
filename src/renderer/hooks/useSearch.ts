import { useState, useMemo, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import { FileEntry, IndexEntry } from '../types';
import { FUSE_THRESHOLD, STORAGE_KEYS } from '../constants';

interface UseSearchProps {
  entries: FileEntry[];
  indexedResults: IndexEntry[];
  searchIndexed: (query: string, currentPath?: string) => Promise<void>;
  clearIndexedResults: () => void;
  searchDebounceDelay: number;
  currentPath?: string;
}

export function useSearch({
  entries,
  indexedResults,
  searchIndexed,
  clearIndexedResults,
  searchDebounceDelay,
  currentPath,
}: UseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [useIndexSearch, setUseIndexSearch] = useState(true);
  const [showPaths, setShowPaths] = useState(true);

  // Load saved preferences
  useEffect(() => {
    const savedShowPaths = localStorage.getItem(STORAGE_KEYS.SHOW_PATHS);
    if (savedShowPaths !== null) setShowPaths(savedShowPaths === 'true');
  }, []);

  // Toggle paths
  const togglePaths = useCallback(() => {
    setShowPaths(prev => {
      localStorage.setItem(STORAGE_KEYS.SHOW_PATHS, (!prev).toString());
      return !prev;
    });
  }, []);

  // Memoize Fuse instance for local search
  const fuse = useMemo(() => {
    return new Fuse(entries, { keys: ['name'], threshold: FUSE_THRESHOLD });
  }, [entries]);

  // Memoize filtered entries (local search)
  const filteredEntries = useMemo(() => {
    if (!searchQuery || (useIndexSearch && searchQuery)) return entries;
    return fuse.search(searchQuery).map(r => r.item);
  }, [entries, fuse, searchQuery, useIndexSearch]);

  // Group indexed results by type
  const indexedGroups = useMemo(() => {
    if (!useIndexSearch || !searchQuery) {
      return { folders: [] as IndexEntry[], files: [] as IndexEntry[] };
    }
    const folders = indexedResults.filter(e => e.is_directory);
    const files = indexedResults.filter(e => !e.is_directory);
    return { folders, files };
  }, [indexedResults, searchQuery, useIndexSearch]);

  // Debounced index search
  useEffect(() => {
    if (!useIndexSearch || !searchQuery) {
      clearIndexedResults();
      return;
    }

    const timeout = setTimeout(() => {
      searchIndexed(searchQuery, currentPath);
    }, searchDebounceDelay);

    return () => clearTimeout(timeout);
  }, [searchQuery, useIndexSearch, searchIndexed, clearIndexedResults, searchDebounceDelay, currentPath]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    useIndexSearch,
    setUseIndexSearch,
    showPaths,
    togglePaths,
    filteredEntries,
    indexedGroups,
  };
}
