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
  onDragStart,
  onDragEnd,
  onDrop,
  onContextMenu,
  onToggleFocusMode,
}: PinnedFoldersBarProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
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

      <FocusModeToggle focusMode={focusMode} onToggle={onToggleFocusMode} />
    </div>
  );
}
