import { useState, useCallback, useRef, useEffect } from 'react';
import { PinnedFolder } from '../../../hooks';
import { IndexEntry } from '../../../types';
import * as api from '../../../api/electron';
import { PinnedCard } from './PinnedCard';
import { FocusModeToggle } from './FocusModeToggle';

interface PinnedFoldersBarProps {
  pinnedFolders: PinnedFolder[];
  currentPath: string;
  focusMode: boolean;
  isExpanded: boolean;
  expandedFolderId: string | null;
  draggedFolderId: string | null;
  onFolderClick: (folder: PinnedFolder) => void;
  onQuickCopy: (path: string) => void;
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
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

  const isCollapsed = focusMode && !isExpanded;
  const hasQuery = isCollapsed && filterQuery.length >= 2;

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
        // Show folders first, then files — limit to 20 for strip display
        setSearchResults(results.slice(0, 20));
      } catch {
        // Index may not be loaded yet
      }
    }, 80);

    return () => clearTimeout(timeout);
  }, [filterQuery, isCollapsed, currentPath]);

  // Handle clicking a search result: copy path + flash + clear
  const handleResultClick = useCallback((path: string) => {
    onQuickCopy(path);
    setCopiedPath(path);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => {
      setCopiedPath(null);
      setFilterQuery('');
      setSearchResults([]);
      filterInputRef.current?.blur();
      copiedTimeoutRef.current = null;
    }, 250);
  }, [onQuickCopy]);

  // Clear all filter state when leaving collapsed mode
  useEffect(() => {
    if (!isCollapsed) {
      setFilterQuery('');
      setSearchResults([]);
      setCopiedPath(null);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    }
  }, [isCollapsed]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  // Handle Escape in filter input — stop propagation to prevent global handler
  const handleFilterKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setFilterQuery('');
      setSearchResults([]);
      filterInputRef.current?.blur();
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="pinned-cards" onDragOver={handleDragOver}>
      {/* When searching, show results instead of pinned folders */}
      {hasQuery ? (
        searchResults.length > 0 ? (
          searchResults.map((entry) => (
            <div
              key={entry.path}
              className={`card search-result ${copiedPath === entry.path ? 'quick-copied' : ''}`}
              title={entry.path}
              onClick={() => handleResultClick(entry.path)}
            >
              <svg className="card-icon" viewBox="0 0 24 24" fill={entry.is_directory ? 'var(--folder-color)' : 'var(--file-color)'}>
                {entry.is_directory
                  ? <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  : <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4z" />
                }
              </svg>
              <span className="card-name">{entry.name}</span>
            </div>
          ))
        ) : (
          <div className="pinned-hint">No matches</div>
        )
      ) : (
        <>
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
          {pinnedFolders.length === 0 && focusMode && (
            <div className="pinned-hint">No pinned folders</div>
          )}
        </>
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
  );
}
