import { useState, useCallback, useRef, useEffect } from 'react';
import { PinnedFolder } from '../../../hooks';
import { IndexEntry } from '../../../types';
import { FOCUS_COLLAPSED_HEIGHT } from '../../../constants';
import { abbreviatePathForDisplay } from '../../../utils/path';
import * as api from '../../../api/electron';
import { PinnedCard } from './PinnedCard';
import { FocusModeToggle } from './FocusModeToggle';
import { FolderIcon, FileIcon } from '../../icons';

const RESULT_ROW_HEIGHT = 36;
const STRIP_HEIGHT = FOCUS_COLLAPSED_HEIGHT;
const MAX_VISIBLE_RESULTS = 12;

interface PinnedFoldersBarProps {
  pinnedFolders: PinnedFolder[];
  currentPath: string;
  focusMode: boolean;
  isExpanded: boolean;
  expandedFolderId: string | null;
  draggedFolderId: string | null;
  onFolderClick: (folder: PinnedFolder) => void;
  onQuickCopy: (path: string) => Promise<void>;
  onDragStart: (folderId: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (targetFolderId: string, e: React.DragEvent) => void;
  onContextMenu: (e: React.MouseEvent, folder: PinnedFolder) => void;
  onToggleFocusMode: () => void;
}

export function PinnedFoldersBar({
  pinnedFolders,
  currentPath,
  focusMode,
  isExpanded,
  expandedFolderId,
  draggedFolderId,
  onFolderClick,
  onQuickCopy,
  onDragStart,
  onDragEnd,
  onDrop,
  onContextMenu,
  onToggleFocusMode,
}: PinnedFoldersBarProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IndexEntry[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRequestRef = useRef(0);

  const isCollapsed = focusMode && !isExpanded;
  const hasQuery = isCollapsed && filterQuery.length >= 2;
  const showResults = hasQuery && searchResults.length > 0;

  // Auto-focus input when entering collapsed mode or when window regains focus
  useEffect(() => {
    if (!isCollapsed) return;

    // Focus immediately when entering collapsed mode
    const raf = requestAnimationFrame(() => {
      filterInputRef.current?.focus();
    });

    // Also focus when the window regains focus (e.g. via global hotkey)
    const handleWindowFocus = () => {
      // Delay slightly to ensure Electron has finished showing the window
      setTimeout(() => filterInputRef.current?.focus(), 50);
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isCollapsed]);

  // Search the file index when typing (debounced)
  useEffect(() => {
    if (!isCollapsed || filterQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const requestId = ++searchRequestRef.current;
    const timeout = setTimeout(async () => {
      try {
        const results = await api.searchIndex(filterQuery, currentPath);
        if (requestId !== searchRequestRef.current) return;
        setSearchResults(results.slice(0, 50));
      } catch {
        // Index may not be loaded yet
      }
    }, 80);

    return () => clearTimeout(timeout);
  }, [filterQuery, isCollapsed, currentPath]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchResults]);

  // Resize window when results appear/disappear
  useEffect(() => {
    if (!isCollapsed) return;

    async function resize() {
      const { width } = await api.getWindowSize();
      if (showResults) {
        const visibleCount = Math.min(searchResults.length, MAX_VISIBLE_RESULTS);
        const height = STRIP_HEIGHT + (visibleCount * RESULT_ROW_HEIGHT) + 8;
        await api.setWindowSize(width, height);
      } else {
        await api.setWindowSize(width, STRIP_HEIGHT);
      }
    }

    resize();
  }, [isCollapsed, showResults, searchResults.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0) return;
    const container = resultsRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.file-item');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Copy path + hide window instantly
  const copyAndHide = useCallback(async (path: string) => {
    await onQuickCopy(path);
    // Clear state so it's fresh when window re-appears
    setFilterQuery('');
    setSearchResults([]);
    setHighlightedIndex(-1);
    api.hideWindow();
  }, [onQuickCopy]);

  // Clear all filter state when leaving collapsed mode
  useEffect(() => {
    if (!isCollapsed) {
      setFilterQuery('');
      setSearchResults([]);
      setHighlightedIndex(-1);
    }
  }, [isCollapsed]);

  // Keyboard navigation: ArrowUp/Down, Enter, Escape
  const handleFilterKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setFilterQuery('');
      setSearchResults([]);
      setHighlightedIndex(-1);
      filterInputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setHighlightedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setHighlightedIndex(prev =>
          prev <= 0 ? searchResults.length - 1 : prev - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const index = highlightedIndex >= 0 ? highlightedIndex : 0;
        void copyAndHide(searchResults[index].path);
      }
    }
  }, [searchResults, highlightedIndex, copyAndHide]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <>
      <div className="pinned-cards" onDragOver={handleDragOver}>
        {pinnedFolders.map((folder) => {
          const isActive = currentPath.startsWith(folder.path);
          const isExpandedActive = focusMode && isExpanded && expandedFolderId === folder.id;
          const isDragging = draggedFolderId === folder.id;
          const isDropTarget = draggedFolderId !== null && draggedFolderId !== folder.id;

          return (
            <PinnedCard
              key={folder.id}
              folder={folder}
              isActive={isActive}
              isCopied={false}
              isExpandedActive={isExpandedActive}
              isDragging={isDragging}
              isDropTarget={isDropTarget}
              focusMode={focusMode}
              onClick={() => onFolderClick(folder)}
              onDragStart={(e) => onDragStart(folder.id, e)}
              onDragOver={handleDragOver}
              onDragEnd={onDragEnd}
              onDrop={(e) => onDrop(folder.id, e)}
              onContextMenu={(e) => onContextMenu(e, folder)}
            />
          );
        })}

        {pinnedFolders.length === 0 && !focusMode && (
          <div className="pinned-hint">Right-click a folder to pin it</div>
        )}
        {pinnedFolders.length === 0 && focusMode && !hasQuery && (
          <div className="pinned-hint">No pinned folders</div>
        )}

        {isCollapsed && (
          <input
            ref={filterInputRef}
            className="collapsed-filter-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            onKeyDown={handleFilterKeyDown}
            placeholder="Search..."
            spellCheck={false}
            autoComplete="off"
          />
        )}

        <FocusModeToggle focusMode={focusMode} onToggle={onToggleFocusMode} />
      </div>

      {/* Search results list below the strip */}
      {showResults && (
        <div className="collapsed-search-results" ref={resultsRef}>
          {searchResults.map((entry, index) => {
            const isHighlighted = highlightedIndex === -1
              ? index === 0
              : index === highlightedIndex;

            return (
              <div
                key={entry.path}
                className={`file-item ${isHighlighted ? 'highlighted' : ''}`}
                onClick={() => void copyAndHide(entry.path)}
              >
                <div className="file-item-content">
                  <span className="file-icon">
                    {entry.is_directory ? <FolderIcon /> : <FileIcon />}
                  </span>
                  <div className="file-info">
                    <span className="file-name">{entry.name}</span>
                    <span className="file-path">{abbreviatePathForDisplay(entry.path)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
