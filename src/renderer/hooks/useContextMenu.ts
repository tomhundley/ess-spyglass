import { useState, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

export function useContextMenu<T>() {
  const [contextMenu, setContextMenu] = useState<(Position & { data: T }) | null>(null);

  const openContextMenu = useCallback((e: React.MouseEvent, data: T) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, data });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu, closeContextMenu]);

  // Close on Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, closeContextMenu]);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}
