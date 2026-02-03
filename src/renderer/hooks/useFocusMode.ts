import { useState, useCallback, useEffect, useRef } from 'react';
import * as api from '../api/electron';
import {
  NORMAL_SIZE,
  FOCUS_COLLAPSED_HEIGHT,
  FOCUS_EXPANDED_HEIGHT,
  FOCUS_COLLAPSE_DELAY,
  STORAGE_KEYS,
} from '../constants';
import { PinnedFolder } from './usePinnedFolders';

interface UseFocusModeProps {
  navigateTo: (path: string) => Promise<void>;
  clearSearch: () => void;
}

export function useFocusMode({ navigateTo, clearSearch }: UseFocusModeProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalSizeRef = useRef<{ width: number; height: number }>(NORMAL_SIZE);

  // Toggle focus mode on/off
  const toggleFocusMode = useCallback(async () => {
    if (focusMode) {
      // Exiting focus mode - restore normal size
      setFocusMode(false);
      setIsExpanded(false);
      setExpandedFolderId(null);
      const savedNormalSize = localStorage.getItem(STORAGE_KEYS.WINDOW_SIZE);
      const size = savedNormalSize ? JSON.parse(savedNormalSize) : normalSizeRef.current;
      await api.setWindowSize(size.width, size.height);
    } else {
      // Entering focus mode - save current size and collapse
      const currentSize = await api.getWindowSize();
      normalSizeRef.current = currentSize;
      localStorage.setItem(STORAGE_KEYS.WINDOW_SIZE, JSON.stringify(currentSize));
      setFocusMode(true);
      setIsExpanded(false);
      setExpandedFolderId(null);
      const savedCollapsedHeight = localStorage.getItem(STORAGE_KEYS.FOCUS_COLLAPSED_HEIGHT);
      const height = savedCollapsedHeight ? parseInt(savedCollapsedHeight) : FOCUS_COLLAPSED_HEIGHT;
      await api.setWindowSize(currentSize.width, height);
    }
  }, [focusMode]);

  // Expand to show folder contents
  const expandToFolder = useCallback(async (folder: PinnedFolder) => {
    if (!focusMode) return;

    setExpandedFolderId(folder.id);
    setIsExpanded(true);

    // Navigate to the folder
    await navigateTo(folder.path);

    // Resize window to expanded height
    const currentSize = await api.getWindowSize();
    const savedExpandedHeight = localStorage.getItem(STORAGE_KEYS.FOCUS_EXPANDED_HEIGHT);
    const height = savedExpandedHeight ? parseInt(savedExpandedHeight) : FOCUS_EXPANDED_HEIGHT;
    await api.setWindowSize(currentSize.width, height);
  }, [focusMode, navigateTo]);

  // Collapse back to strip
  const collapseToStrip = useCallback(async () => {
    if (!focusMode) return;

    setIsExpanded(false);
    setExpandedFolderId(null);
    clearSearch();

    // Resize window to collapsed height
    const currentSize = await api.getWindowSize();
    const savedCollapsedHeight = localStorage.getItem(STORAGE_KEYS.FOCUS_COLLAPSED_HEIGHT);
    const height = savedCollapsedHeight ? parseInt(savedCollapsedHeight) : FOCUS_COLLAPSED_HEIGHT;
    await api.setWindowSize(currentSize.width, height);
  }, [focusMode, clearSearch]);

  // Handle window blur - start timer to collapse
  const handleWindowBlur = useCallback(() => {
    if (!focusMode || !isExpanded) return;

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }

    collapseTimeoutRef.current = setTimeout(() => {
      collapseToStrip();
      collapseTimeoutRef.current = null;
    }, FOCUS_COLLAPSE_DELAY);
  }, [focusMode, isExpanded, collapseToStrip]);

  // Handle window focus - cancel pending collapse
  const handleWindowFocus = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, []);

  // Set up window focus/blur event listeners
  useEffect(() => {
    api.setupWindowFocusEvents();

    const unsubscribeBlur = api.onWindowBlur(handleWindowBlur);
    const unsubscribeFocus = api.onWindowFocus(handleWindowFocus);

    return () => {
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [handleWindowBlur, handleWindowFocus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  return {
    focusMode,
    isExpanded,
    expandedFolderId,
    toggleFocusMode,
    expandToFolder,
    collapseToStrip,
  };
}
