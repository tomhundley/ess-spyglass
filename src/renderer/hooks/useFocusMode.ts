import { useState, useCallback, useEffect, useRef } from 'react';
import * as api from '../api/electron';
import {
  NORMAL_SIZE,
  FOCUS_COLLAPSED_HEIGHT,
  STORAGE_KEYS,
} from '../constants';
import { PinnedFolder } from './usePinnedFolders';

// Mouse leave delay before auto-collapse (3 seconds)
const MOUSE_LEAVE_COLLAPSE_DELAY = 3000;

// Row height for calculating dynamic expanded height
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 90; // Breadcrumb + search bar
const MIN_EXPANDED_HEIGHT = 200;
const MAX_EXPANDED_HEIGHT = 600;

interface UseFocusModeProps {
  navigateTo: (path: string) => Promise<void>;
  clearSearch: () => void;
}

export function useFocusMode({ navigateTo, clearSearch }: UseFocusModeProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalSizeRef = useRef<{ width: number; height: number }>(NORMAL_SIZE);
  const isMouseInsideRef = useRef(true);

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

  // Calculate dynamic height based on entry count
  const calculateExpandedHeight = useCallback((count: number) => {
    const contentHeight = HEADER_HEIGHT + (count * ROW_HEIGHT) + 20; // 20px padding
    return Math.min(Math.max(contentHeight, MIN_EXPANDED_HEIGHT), MAX_EXPANDED_HEIGHT);
  }, []);

  // Update window height when entry count changes
  const updateExpandedHeight = useCallback(async (count: number) => {
    if (!focusMode || !isExpanded) return;

    const currentSize = await api.getWindowSize();
    const height = calculateExpandedHeight(count);
    await api.setWindowSize(currentSize.width, height);
  }, [focusMode, isExpanded, calculateExpandedHeight]);

  // Expand to show folder contents
  const expandToFolder = useCallback(async (folder: PinnedFolder) => {
    if (!focusMode) return;

    // Cancel any pending collapse
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    setExpandedFolderId(folder.id);
    setIsExpanded(true);
    isMouseInsideRef.current = true;

    // Navigate to the folder
    await navigateTo(folder.path);

    // Start with minimum height, will adjust when entries load
    const currentSize = await api.getWindowSize();
    await api.setWindowSize(currentSize.width, MIN_EXPANDED_HEIGHT);
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

  // Handle mouse entering the expanded content area
  const handleMouseEnter = useCallback(() => {
    isMouseInsideRef.current = true;
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, []);

  // Handle mouse leaving the expanded content area
  const handleMouseLeave = useCallback(() => {
    if (!focusMode || !isExpanded) return;

    isMouseInsideRef.current = false;

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }

    collapseTimeoutRef.current = setTimeout(() => {
      // Only collapse if mouse is still outside
      if (!isMouseInsideRef.current) {
        collapseToStrip();
      }
      collapseTimeoutRef.current = null;
    }, MOUSE_LEAVE_COLLAPSE_DELAY);
  }, [focusMode, isExpanded, collapseToStrip]);

  // Set entry count and update height
  const setExpandedEntryCount = useCallback((count: number) => {
    setEntryCount(count);
    updateExpandedHeight(count);
  }, [updateExpandedHeight]);

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
    handleMouseEnter,
    handleMouseLeave,
    setExpandedEntryCount,
  };
}
