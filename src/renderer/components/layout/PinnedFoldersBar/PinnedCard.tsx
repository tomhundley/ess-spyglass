import { FolderIcon } from '../../icons';
import { PinnedFolder } from '../../../hooks';

interface PinnedCardProps {
  folder: PinnedFolder;
  isActive: boolean;
  isExpandedActive: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  focusMode: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function PinnedCard({
  folder,
  isActive,
  isExpandedActive,
  isDragging,
  isDropTarget,
  focusMode,
  onClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onContextMenu,
}: PinnedCardProps) {
  const cardClasses = [
    'card',
    isActive ? 'active' : '',
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : '',
    isExpandedActive ? 'expanded-active' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={{ borderColor: folder.color }}
      title={folder.path}
      draggable={!focusMode}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
    >
      <svg className="card-icon" viewBox="0 0 24 24" fill={folder.color}>
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
      <span className="card-name">{folder.name}</span>
    </div>
  );
}
