import { memo } from 'react';
import { FolderIcon, FileIcon } from '../../icons';
import { FileEntry, IndexEntry } from '../../../types';

interface FileItemProps {
  entry: FileEntry | IndexEntry;
  isCopied: boolean;
  showPath: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const FileItem = memo(function FileItem({
  entry,
  isCopied,
  showPath,
  onClick,
  onDoubleClick,
  onContextMenu,
}: FileItemProps) {
  const displayPath = entry.path.replace(/^\/Users\/[^/]+/, '~');

  return (
    <div
      className={`file-item ${isCopied ? 'copied' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="file-item-content">
        <span className="file-icon">
          {entry.is_directory ? <FolderIcon /> : <FileIcon />}
        </span>
        <div className="file-info">
          <span className="file-name">{entry.name}</span>
          {showPath && <span className="file-path">{displayPath}</span>}
        </div>
      </div>
    </div>
  );
});
