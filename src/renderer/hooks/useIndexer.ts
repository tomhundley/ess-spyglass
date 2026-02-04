import { useState, useCallback, useEffect, useRef } from 'react';
import * as api from '../api/electron';
import { IndexEntry, IndexProgress } from '../types';
import { INDEX_POLL_INTERVAL, SEARCH_DEBOUNCE_DELAY, MIN_SEARCH_LENGTH } from '../constants';

export function useIndexer() {
  const [indexProgress, setIndexProgress] = useState<IndexProgress | null>(null);
  const [indexCount, setIndexCount] = useState(0);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedResults, setIndexedResults] = useState<IndexEntry[]>([]);
  const indexSearchRequestIdRef = useRef(0);

  // Start indexing
  const startIndexing = useCallback(async () => {
    try {
      setIsIndexing(true);
      await api.startIndexing();
    } catch (e) {
      console.error('Failed to start indexing:', e);
      setIsIndexing(false);
    }
  }, []);

  // Poll index progress
  useEffect(() => {
    if (!isIndexing) return;

    const interval = setInterval(async () => {
      try {
        const progress = await api.getIndexProgress();
        setIndexProgress(progress);

        if (progress.is_complete) {
          setIsIndexing(false);
          const count = await api.getIndexCount();
          setIndexCount(count);
        }
      } catch (e) {
        console.error('Failed to get progress:', e);
      }
    }, INDEX_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isIndexing]);

  // Search indexed files
  const searchIndexed = useCallback(async (query: string, currentPath?: string) => {
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      setIndexedResults([]);
      return;
    }
    const requestId = ++indexSearchRequestIdRef.current;
    try {
      const results = await api.searchIndex(query, currentPath);
      if (requestId !== indexSearchRequestIdRef.current) return;
      setIndexedResults(results);
    } catch (e) {
      if (requestId !== indexSearchRequestIdRef.current) return;
      console.error('Search failed:', e);
    }
  }, []);

  // Clear indexed results
  const clearIndexedResults = useCallback(() => {
    indexSearchRequestIdRef.current += 1;
    setIndexedResults([]);
  }, []);

  // Load saved index on startup
  useEffect(() => {
    async function loadIndex() {
      try {
        const loaded = await api.loadSavedIndex();
        if (loaded) {
          const count = await api.getIndexCount();
          setIndexCount(count);
          setIndexProgress({
            total_folders: 0,
            indexed_folders: 0,
            total_files: count,
            current_folder: '',
            is_complete: true,
          });
        } else {
          startIndexing();
        }
      } catch (e) {
        console.error('Failed to load index:', e);
      }
    }
    loadIndex();
  }, [startIndexing]);

  return {
    indexProgress,
    indexCount,
    isIndexing,
    indexedResults,
    startIndexing,
    searchIndexed,
    clearIndexedResults,
    searchDebounceDelay: SEARCH_DEBOUNCE_DELAY,
  };
}
