import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import * as api from './api/electron';
import {
  FileEntry,
  IndexEntry,
  IndexProgress,
  TAB_COLORS,
  generateId,
} from './types';

interface PinnedFolder {
  id: string;
  path: string;
  name: string;
  color: string;
}

// Default window sizes
const NORMAL_SIZE = { width: 700, height: 600 };
const FOCUS_COLLAPSED_HEIGHT = 42;
const FOCUS_EXPANDED_HEIGHT = 400;

interface ContextMenu {
  x: number;
  y: number;
  entry: FileEntry;
}

interface PinnedContextMenu {
  x: number;
  y: number;
  folder: PinnedFolder;
}

function App() {
  const [pinnedFolders, setPinnedFolders] = useState<PinnedFolder[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [pinnedContextMenu, setPinnedContextMenu] = useState<PinnedContextMenu | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [indexProgress, setIndexProgress] = useState<IndexProgress | null>(null);
  const [indexCount, setIndexCount] = useState(0);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedResults, setIndexedResults] = useState<IndexEntry[]>([]);
  const [useIndexSearch, setUseIndexSearch] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [showPaths, setShowPaths] = useState(false);
  const [appZoom, setAppZoom] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexSearchRequestIdRef = useRef(0);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalSizeRef = useRef<{ width: number; height: number }>(NORMAL_SIZE);

  // Memoize Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(entries, { keys: ['name'], threshold: 0.4 });
  }, [entries]);

  // Memoize filtered entries
  const filteredEntries = useMemo(() => {
    if (!searchQuery || (useIndexSearch && searchQuery)) return entries;
    return fuse.search(searchQuery).map(r => r.item);
  }, [entries, fuse, searchQuery, useIndexSearch]);

  const indexedGroups = useMemo(() => {
    if (!useIndexSearch || !searchQuery) {
      return { folders: [] as IndexEntry[], files: [] as IndexEntry[] };
    }
    const folders = indexedResults.filter(e => e.is_directory);
    const files = indexedResults.filter(e => !e.is_directory);
    return { folders, files };
  }, [indexedResults, searchQuery, useIndexSearch]);

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

  // Load directory
  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setSearchQuery('');
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

  // Navigate to path
  const navigateTo = useCallback(async (path: string) => {
    await loadDirectory(path);
  }, [loadDirectory]);

  // Navigate back
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

  // Open path in new window
  const openInNewWindow = useCallback(async (path: string) => {
    try {
      await api.createNewWindow(path);
    } catch (e) {
      console.error('Failed to open new window:', e);
    }
  }, []);

  const scheduleCopyReset = useCallback((delayMs: number) => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedPath(null);
      copyTimeoutRef.current = null;
    }, delayMs);
  }, []);

  // Handle copy
  const handleCopy = useCallback(async (path: string) => {
    try {
      await api.copyToClipboard(path);
      setCopiedPath(path);
      scheduleCopyReset(200);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, [scheduleCopyReset]);

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
    }, 500);

    return () => clearInterval(interval);
  }, [isIndexing]);

  // Search indexed files
  const searchIndexed = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setIndexedResults([]);
      return;
    }
    const requestId = ++indexSearchRequestIdRef.current;
    try {
      const results = await api.searchIndex(query);
      if (requestId !== indexSearchRequestIdRef.current) return;
      setIndexedResults(results);
    } catch (e) {
      if (requestId !== indexSearchRequestIdRef.current) return;
      console.error('Search failed:', e);
    }
  }, []);

  // Debounced index search
  useEffect(() => {
    if (!useIndexSearch || !searchQuery) {
      indexSearchRequestIdRef.current += 1;
      setIndexedResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchIndexed(searchQuery);
    }, 100);

    return () => clearTimeout(timeout);
  }, [searchQuery, useIndexSearch, searchIndexed]);

  // Load saved index on startup
  useEffect(() => {
    async function loadIndex() {
      try {
        const loaded = await api.loadSavedIndex();
        if (loaded) {
          const count = await api.getIndexCount();
          setIndexCount(count);
          setIndexProgress({ total_folders: 0, indexed_folders: 0, total_files: count, current_folder: '', is_complete: true });
        } else {
          startIndexing();
        }
      } catch (e) {
        console.error('Failed to load index:', e);
      }
    }
    loadIndex();
  }, [startIndexing]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);

      const unsubscribe = api.onThemeChanged(applyTheme);

      return () => {
        mediaQuery.removeEventListener('change', handler);
        unsubscribe();
      };
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('spyglass-theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) setTheme(savedTheme);
    const savedShowPaths = localStorage.getItem('spyglass-show-paths');
    if (savedShowPaths) setShowPaths(savedShowPaths === 'true');
  }, []);

  // Save theme
  const changeTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('spyglass-theme', newTheme);
  }, []);

  // Toggle paths
  const togglePaths = useCallback(() => {
    setShowPaths(prev => {
      localStorage.setItem('spyglass-show-paths', (!prev).toString());
      return !prev;
    });
  }, []);

  // Focus mode: toggle on/off
  const toggleFocusMode = useCallback(async () => {
    if (focusMode) {
      // Exiting focus mode - restore normal size
      setFocusMode(false);
      setIsExpanded(false);
      setExpandedFolderId(null);
      const savedNormalSize = localStorage.getItem('spyglass-window-size');
      const size = savedNormalSize ? JSON.parse(savedNormalSize) : normalSizeRef.current;
      await api.setWindowSize(size.width, size.height);
    } else {
      // Entering focus mode - save current size and collapse (keep width, change height)
      const currentSize = await api.getWindowSize();
      normalSizeRef.current = currentSize;
      localStorage.setItem('spyglass-window-size', JSON.stringify(currentSize));
      setFocusMode(true);
      setIsExpanded(false);
      setExpandedFolderId(null);
      const savedCollapsedHeight = localStorage.getItem('spyglass-focus-collapsed-height');
      const height = savedCollapsedHeight ? parseInt(savedCollapsedHeight) : FOCUS_COLLAPSED_HEIGHT;
      await api.setWindowSize(currentSize.width, height);
    }
  }, [focusMode]);

  // Focus mode: expand to show folder contents
  const expandToFolder = useCallback(async (folder: PinnedFolder) => {
    if (!focusMode) return;

    setExpandedFolderId(folder.id);
    setIsExpanded(true);

    // Navigate to the folder
    await navigateTo(folder.path);

    // Resize window to expanded height (keep current width)
    const currentSize = await api.getWindowSize();
    const savedExpandedHeight = localStorage.getItem('spyglass-focus-expanded-height');
    const height = savedExpandedHeight ? parseInt(savedExpandedHeight) : FOCUS_EXPANDED_HEIGHT;
    await api.setWindowSize(currentSize.width, height);
  }, [focusMode, navigateTo]);

  // Focus mode: collapse back to strip
  const collapseToStrip = useCallback(async () => {
    if (!focusMode) return;

    setIsExpanded(false);
    setExpandedFolderId(null);
    setSearchQuery('');

    // Resize window to collapsed height (keep current width)
    const currentSize = await api.getWindowSize();
    const savedCollapsedHeight = localStorage.getItem('spyglass-focus-collapsed-height');
    const height = savedCollapsedHeight ? parseInt(savedCollapsedHeight) : FOCUS_COLLAPSED_HEIGHT;
    await api.setWindowSize(currentSize.width, height);
  }, [focusMode]);

  // Handle window blur - start 2 second timer to collapse
  const handleWindowBlur = useCallback(() => {
    if (!focusMode || !isExpanded) return;

    // Clear any existing timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }

    // Start 2 second timer to collapse
    collapseTimeoutRef.current = setTimeout(() => {
      collapseToStrip();
      collapseTimeoutRef.current = null;
    }, 2000);
  }, [focusMode, isExpanded, collapseToStrip]);

  // Handle window focus - cancel pending collapse
  const handleWindowFocus = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, []);

  // Set up window focus/blur event listeners for focus mode
  useEffect(() => {
    // Set up the focus event handlers in main process
    api.setupWindowFocusEvents();

    // Subscribe to blur/focus events
    const unsubscribeBlur = api.onWindowBlur(handleWindowBlur);
    const unsubscribeFocus = api.onWindowFocus(handleWindowFocus);

    return () => {
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [handleWindowBlur, handleWindowFocus]);

  // Initialize - load config and start in home directory
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

        // Load saved config
        const cfg = await api.loadConfig();

        if (mounted) {
          // Load pinned folders if any
          if (cfg.tabs && cfg.tabs.length > 0) {
            setPinnedFolders(cfg.tabs.map(t => ({
              id: t.id,
              path: t.path,
              name: t.name,
              color: t.color,
            })));
          }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (contextMenu || pinnedContextMenu) {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setPinnedContextMenu(null);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      navigateBack();
    } else if (e.key === 'Escape') {
      // In expanded focus mode, Escape collapses to strip
      if (focusMode && isExpanded) {
        collapseToStrip();
      } else {
        setSearchQuery('');
      }
    } else if ((e.key === '=' || e.key === '+') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setAppZoom(z => Math.min(1.5, z + 0.1));
    } else if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setAppZoom(z => Math.max(0.7, z - 0.1));
    } else if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setAppZoom(1);
    }
  }, [contextMenu, pinnedContextMenu, navigateBack, focusMode, isExpanded, collapseToStrip]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close context menus on click outside
  useEffect(() => {
    function onClick() {
      setContextMenu(null);
      setPinnedContextMenu(null);
    }
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  // Handle item click - copy path (and collapse in focus mode)
  const handleItemClick = useCallback(async (entry: FileEntry | IndexEntry) => {
    await handleCopy(entry.path);
    // Auto-collapse after copying in expanded focus mode
    if (focusMode && isExpanded) {
      // Small delay so user sees the copy feedback
      setTimeout(() => {
        collapseToStrip();
      }, 300);
    }
  }, [handleCopy, focusMode, isExpanded, collapseToStrip]);

  // Handle double click - drill down into folder
  const handleDoubleClick = useCallback((entry: FileEntry | IndexEntry) => {
    if (entry.is_directory) {
      navigateTo(entry.path);
    }
  }, [navigateTo]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry | IndexEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry: entry as FileEntry });
  }, []);

  // Build breadcrumb segments
  const breadcrumbSegments = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(Boolean);
    const segments: { name: string; path: string }[] = [];
    let path = '';
    for (const part of parts) {
      path += '/' + part;
      segments.push({ name: part, path });
    }
    return segments.slice(-4);
  }, [currentPath]);

  // Determine CSS classes for focus mode
  const appClassName = focusMode
    ? `app focus-mode ${isExpanded ? 'expanded' : 'collapsed'}`
    : 'app';

  return (
    <div
      className={appClassName}
      style={{ fontSize: `${appZoom * 13}px` }}
      onClick={() => { setContextMenu(null); setPinnedContextMenu(null); }}
    >
      {/* Pinned Folders Bar */}
      <div
        className="pinned-cards"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
      >
        {pinnedFolders.map((folder) => {
          // In focus mode expanded state, highlight the active folder
          const isExpandedActive = focusMode && isExpanded && expandedFolderId === folder.id;
          const cardClasses = [
            'card',
            currentPath.startsWith(folder.path) ? 'active' : '',
            draggedFolderId === folder.id ? 'dragging' : '',
            draggedFolderId && draggedFolderId !== folder.id ? 'drop-target' : '',
            isExpandedActive ? 'expanded-active' : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={folder.id}
              className={cardClasses}
              style={{ borderColor: folder.color }}
              title={folder.path}
              draggable={!focusMode}
              onClick={() => {
                if (focusMode) {
                  // In focus mode, clicking a card expands to that folder
                  expandToFolder(folder);
                } else {
                  navigateTo(folder.path);
                }
              }}
              onDragStart={(e) => {
                if (focusMode) return;
                setDraggedFolderId(folder.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', folder.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnd={() => {
                setDraggedFolderId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const fromId = e.dataTransfer.getData('text/plain');
                if (fromId && fromId !== folder.id) {
                  reorderPinnedFolders(fromId, folder.id);
                }
                setDraggedFolderId(null);
              }}
              onContextMenu={(e) => {
                if (focusMode) return; // No context menu in focus mode
                e.preventDefault();
                e.stopPropagation();
                setPinnedContextMenu({ x: e.clientX, y: e.clientY, folder });
              }}
            >
              <svg className="card-icon" viewBox="0 0 24 24" fill={folder.color}>
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
              <span className="card-name">{folder.name}</span>
            </div>
          );
        })}
        {pinnedFolders.length === 0 && !focusMode && (
          <div className="pinned-hint">Right-click a folder to pin it</div>
        )}
        {pinnedFolders.length === 0 && focusMode && (
          <div className="pinned-hint">No pinned folders</div>
        )}
        {/* Focus mode toggle button */}
        <button
          className={`focus-toggle ${focusMode ? 'active' : ''}`}
          onClick={toggleFocusMode}
          title={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {focusMode ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>

      {/* Content area - hidden in collapsed focus mode */}
      {(!focusMode || isExpanded) && (
        <div className={focusMode ? 'expanded-content-area' : ''}>
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <button
              className={`breadcrumb-back ${!currentPath ? 'disabled' : ''}`}
              onClick={navigateBack}
              disabled={!currentPath}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="breadcrumb-back-text">Back</span>
            </button>
            <div className="breadcrumb-path">
              {breadcrumbSegments.map((seg, i) => (
                <span key={seg.path}>
                  {i > 0 && <span className="breadcrumb-separator"> / </span>}
                  <span
                    className={`breadcrumb-segment ${seg.path === currentPath ? 'current' : ''}`}
                    onClick={() => seg.path !== currentPath && navigateTo(seg.path)}
                  >
                    {seg.name}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="search-bar">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={useIndexSearch ? `Search ${indexCount.toLocaleString()} files...` : "Search folder..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearchQuery('');
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          className={`toolbar-btn ${showPaths ? 'active' : ''}`}
          onClick={togglePaths}
          title={showPaths ? "Hide paths" : "Show paths"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h12" />
          </svg>
        </button>
        <button
          className="theme-toggle"
          onClick={() => changeTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          )}
        </button>
        <button className="settings-button" onClick={() => setShowSettings(true)} title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          </button>
          </div>

          {/* File List */}
          <div className="file-list">
        {loading && !useIndexSearch ? (
          <div className="file-list-loading">
            <div className="loading-spinner" />
          </div>
        ) : error && !useIndexSearch ? (
          <div className="file-list-error">
            <span className="error-icon">!</span>
            <span className="error-message">{error}</span>
          </div>
        ) : useIndexSearch && searchQuery ? (
          (() => {
            if (indexedResults.length === 0) {
              return (
                <div className="file-list-empty">
                  {searchQuery.length < 2 ? 'Type at least 2 characters...' : 'No matches'}
                </div>
              );
            }

            const folders = indexedGroups.folders;
            const files = indexedGroups.files;

            return (
              <>
                {folders.length > 0 && (
                  <>
                    <div className="file-group-header">Folders ({folders.length})</div>
                    {folders.map((entry) => (
                      <div
                        key={entry.path}
                        className={`file-item ${copiedPath === entry.path ? 'copied' : ''}`}
                        onClick={() => handleItemClick(entry)}
                        onDoubleClick={() => handleDoubleClick(entry)}
                        onContextMenu={(e) => handleContextMenu(e, entry)}
                      >
                        <div className="file-item-content">
                          <span className="file-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24">
                              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                            </svg>
                          </span>
                          <div className="file-info">
                            <span className="file-name">{entry.name}</span>
                            {showPaths && <span className="file-path">{entry.path.replace(/^\/Users\/[^/]+/, '~')}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {files.length > 0 && (
                  <>
                    <div className="file-group-header">Files ({files.length})</div>
                    {files.map((entry) => (
                      <div
                        key={entry.path}
                        className={`file-item ${copiedPath === entry.path ? 'copied' : ''}`}
                        onClick={() => handleItemClick(entry)}
                        onDoubleClick={() => handleDoubleClick(entry)}
                        onContextMenu={(e) => handleContextMenu(e, entry)}
                      >
                        <div className="file-item-content">
                          <span className="file-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#60a5fa">
                              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                            </svg>
                          </span>
                          <div className="file-info">
                            <span className="file-name">{entry.name}</span>
                            {showPaths && <span className="file-path">{entry.path.replace(/^\/Users\/[^/]+/, '~')}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            );
          })()
        ) : filteredEntries.length === 0 ? (
          <div className="file-list-empty">
            {searchQuery ? 'No matches' : 'Empty folder'}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.path}
              className={`file-item ${copiedPath === entry.path ? 'copied' : ''}`}
              onClick={() => handleItemClick(entry)}
              onDoubleClick={() => handleDoubleClick(entry)}
              onContextMenu={(e) => handleContextMenu(e, entry)}
            >
              <div className="file-item-content">
                <span className="file-icon">
                  {entry.is_directory ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#60a5fa">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                  )}
                </span>
                <div className="file-info">
                  <span className="file-name">{entry.name}</span>
                  {showPaths && <span className="file-path">{entry.path.replace(/^\/Users\/[^/]+/, '~')}</span>}
                </div>
              </div>
            </div>
          ))
        )}
          </div>
        </div>
      )}

      {/* Context Menu for Files/Folders */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            onClick={() => { handleCopy(contextMenu.entry.path); setContextMenu(null); }}
          >
            Copy Path
          </div>
          {contextMenu.entry.is_directory && (
            <>
              {!isPinned(contextMenu.entry.path) && (
                <div
                  className="context-menu-item"
                  onClick={() => { pinFolder(contextMenu.entry.path); setContextMenu(null); }}
                >
                  Pin Folder
                </div>
              )}
              <div
                className="context-menu-item"
                onClick={() => { openInNewWindow(contextMenu.entry.path); setContextMenu(null); }}
              >
                Open in New Window
              </div>
            </>
          )}
        </div>
      )}

      {/* Context Menu for Pinned Folders */}
      {pinnedContextMenu && (
        <div
          className="context-menu"
          style={{ left: pinnedContextMenu.x, top: pinnedContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            onClick={() => { handleCopy(pinnedContextMenu.folder.path); setPinnedContextMenu(null); }}
          >
            Copy Path
          </div>
          <div
            className="context-menu-item"
            onClick={() => { unpinFolder(pinnedContextMenu.folder.id); setPinnedContextMenu(null); }}
          >
            Unpin
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="settings-close" onClick={() => setShowSettings(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <label className="settings-label">Theme</label>
                <div className="theme-selector">
                  <button
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => changeTheme('light')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    Light
                  </button>
                  <button
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => changeTheme('dark')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Dark
                  </button>
                  <button
                    className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => changeTheme('system')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    System
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <label className="settings-label">Display</label>
                <div className="settings-toggles">
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={showPaths}
                      onChange={() => togglePaths()}
                    />
                    <span>Show full file paths</span>
                  </label>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={useIndexSearch}
                      onChange={() => setUseIndexSearch(!useIndexSearch)}
                    />
                    <span>Search all indexed files (not just current folder)</span>
                  </label>
                </div>
                <div className="settings-zoom">
                  <span className="settings-zoom-label">Zoom: {Math.round(appZoom * 100)}%</span>
                  <div className="settings-zoom-controls">
                    <button onClick={() => setAppZoom(z => Math.max(0.7, z - 0.1))}>-</button>
                    <button onClick={() => setAppZoom(1)}>Reset</button>
                    <button onClick={() => setAppZoom(z => Math.min(1.5, z + 0.1))}>+</button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <label className="settings-label">File Index</label>
                <div className="index-status">
                  {isIndexing ? (
                    <>
                      <div className="index-progress">
                        <div className="index-progress-bar">
                          <div
                            className="index-progress-fill"
                            style={{
                              width: `${indexProgress ? Math.round((indexProgress.indexed_folders / Math.max(indexProgress.total_folders, 1)) * 100) : 0}%`
                            }}
                          />
                        </div>
                        <span className="index-progress-text">
                          {indexProgress ? `${Math.round((indexProgress.indexed_folders / Math.max(indexProgress.total_folders, 1)) * 100)}%` : '0%'}
                        </span>
                      </div>
                      <div className="index-stats">
                        <span>{indexProgress?.total_files.toLocaleString() || 0} files indexed</span>
                      </div>
                      <div className="index-current">
                        Scanning: {indexProgress?.current_folder.split('/').slice(-2).join('/') || '...'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="index-complete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span>{indexCount.toLocaleString()} files indexed</span>
                      </div>
                      <button className="settings-button" onClick={startIndexing}>
                        Re-index Home Folder
                      </button>
                    </>
                  )}
                </div>
                <span className="settings-hint">
                  Indexes all files in ~ (excluding node_modules, .git, etc.) for instant search.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
