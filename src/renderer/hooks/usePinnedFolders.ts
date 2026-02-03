import { useState, useCallback, useEffect } from 'react';
import * as api from '../api/electron';
import { generateId } from '../types';
import { TAB_COLORS } from '../constants';

export interface PinnedFolder {
  id: string;
  path: string;
  name: string;
  color: string;
}

export function usePinnedFolders(currentPath: string) {
  const [pinnedFolders, setPinnedFolders] = useState<PinnedFolder[]>([]);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);

  // Save pinned folders to config
  const savePinnedFolders = useCallback(async (folders: PinnedFolder[]) => {
    try {
      await api.saveConfig({
        root_folder: null,
        global_hotkey: null,
        remember_location: true,
        last_location: currentPath,
        tabs: folders.map(f => ({ id: f.id, path: f.path, name: f.name, color: f.color })),
        active_tab_id: null,
      });
    } catch (e) {
      console.error('Failed to save pinned folders:', e);
    }
  }, [currentPath]);

  // Pin a folder
  const pinFolder = useCallback((path: string) => {
    const name = path.split('/').pop() || '~';
    const newFolder: PinnedFolder = {
      id: generateId(),
      path,
      name,
      color: TAB_COLORS[pinnedFolders.length % TAB_COLORS.length],
    };
    const newFolders = [...pinnedFolders, newFolder];
    setPinnedFolders(newFolders);
    savePinnedFolders(newFolders);
  }, [pinnedFolders, savePinnedFolders]);

  // Unpin a folder
  const unpinFolder = useCallback((folderId: string) => {
    const newFolders = pinnedFolders.filter(f => f.id !== folderId);
    setPinnedFolders(newFolders);
    savePinnedFolders(newFolders);
  }, [pinnedFolders, savePinnedFolders]);

  // Reorder pinned folders
  const reorderPinnedFolders = useCallback((fromId: string, toId: string) => {
    const fromIdx = pinnedFolders.findIndex(f => f.id === fromId);
    const toIdx = pinnedFolders.findIndex(f => f.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const newFolders = [...pinnedFolders];
    const [moved] = newFolders.splice(fromIdx, 1);
    newFolders.splice(toIdx, 0, moved);
    setPinnedFolders(newFolders);
    savePinnedFolders(newFolders);
  }, [pinnedFolders, savePinnedFolders]);

  // Check if path is pinned
  const isPinned = useCallback((path: string) => {
    return pinnedFolders.some(f => f.path === path);
  }, [pinnedFolders]);

  // Load pinned folders from config on mount
  useEffect(() => {
    let mounted = true;

    async function loadPinned() {
      try {
        const cfg = await api.loadConfig();
        if (mounted && cfg.tabs && cfg.tabs.length > 0) {
          setPinnedFolders(cfg.tabs.map(t => ({
            id: t.id,
            path: t.path,
            name: t.name,
            color: t.color,
          })));
        }
      } catch (e) {
        console.error('Failed to load pinned folders:', e);
      }
    }

    loadPinned();
    return () => { mounted = false; };
  }, []);

  return {
    pinnedFolders,
    draggedFolderId,
    setDraggedFolderId,
    pinFolder,
    unpinFolder,
    reorderPinnedFolders,
    isPinned,
  };
}
