import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsProps {
  onNavigateBack: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onEscape: () => void;
  isContextMenuOpen: boolean;
  onCloseContextMenus: () => void;
}

export function useKeyboardShortcuts({
  onNavigateBack,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onEscape,
  isContextMenuOpen,
  onCloseContextMenus,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Close context menus on Escape
    if (isContextMenuOpen) {
      if (e.key === 'Escape') {
        onCloseContextMenus();
      }
      return;
    }

    // Skip navigation shortcuts when focus is inside an input/textarea
    const isInputFocused = document.activeElement instanceof HTMLInputElement
      || document.activeElement instanceof HTMLTextAreaElement;

    if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onNavigateBack();
    } else if (e.key === 'ArrowLeft' && !isInputFocused) {
      onNavigateBack();
    } else if (e.key === 'Escape') {
      onEscape();
    } else if ((e.key === '=' || e.key === '+') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onZoomIn();
    } else if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onZoomOut();
    } else if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onResetZoom();
    }
  }, [
    isContextMenuOpen,
    onCloseContextMenus,
    onNavigateBack,
    onEscape,
    onZoomIn,
    onZoomOut,
    onResetZoom,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
