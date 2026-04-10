import { useState, useCallback, useRef, useEffect } from 'react';
import { PinnedFolder } from '../../../hooks';
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
  const [copiedFolderId, setCopiedFolderId] = useState<string | null>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCollapsedWithFilter = focusMode && !isExpanded;

  // Filter pinned folders when typing
  const displayedFolders = isCollapsedWithFilter && filterQuery
    ? pinnedFolders.filter(f =>
        f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        f.path.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : pinnedFolders;

  // Handle clicking a folder in quick-filter mode: copy path + flash + clear filter
  const handleFilteredClick = useCallback((folder: PinnedFolder) => {
    if (isCollapsedWithFilter && filterQuery) {
      onQuickCopy(folder.path);
      // Brief flash on the card to confirm copy
      setCopiedFolderId(folder.id);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setCopiedFolderId(null);
        setFilterQuery('');
        filterInputRef.current?.blur();
        copiedTimeoutRef.current = null;
      }, 250);
    } else {
      onFolderClick(folder);
    }
  }, [isCollapsedWithFilter, filterQuery, onQuickCopy, onFolderClick]);

  // Clear all filter state when leaving collapsed mode
  useEffect(() => {
    if (!isCollapsedWithFilter) {
      setFilterQuery('');
      setCopiedFolderId(null);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    }
  }, [isCollapsedWithFilter]);

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
      filterInputRef.current?.blur();
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="pinned-cards" onDragOver={handleDragOver}>
      {displayedFolders.map((folder) => {
        const isActive = currentPath.startsWith(folder.path);
        const isCopiedCard = copiedFolderId === folder.id;
        const isExpandedActive = focusMode && isExpanded && expandedFolderId === folder.id;
        const isDragging = draggedFolderId === folder.id;
        const isDropTarget = draggedFolderId !== null && draggedFolderId !== folder.id;

        return (
          <PinnedCard
            key={folder.id}
            folder={folder}
            isActive={isActive}
            isCopied={isCopiedCard}
            isExpandedActive={isExpandedActive}
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            focusMode={focusMode}
            onClick={() => handleFilteredClick(folder)}
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

      {isCollapsedWithFilter && (
        <input
          ref={filterInputRef}
          className="collapsed-filter-input"
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          onKeyDown={handleFilterKeyDown}
          placeholder="Filter..."
          spellCheck={false}
          autoComplete="off"
        />
      )}

      <FocusModeToggle focusMode={focusMode} onToggle={onToggleFocusMode} />
    </div>
  );
}
