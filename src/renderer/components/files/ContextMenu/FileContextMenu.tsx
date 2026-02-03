import { FileEntry } from '../../../types';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface FileContextMenuProps {
  x: number;
  y: number;
  entry: FileEntry;
  isPinned: boolean;
  onCopy: () => void;
  onPin: () => void;
  onOpenInNewWindow: () => void;
  onClose: () => void;
}

export function FileContextMenu({
  x,
  y,
  entry,
  isPinned,
  onCopy,
  onPin,
  onOpenInNewWindow,
  onClose,
}: FileContextMenuProps) {
  return (
    <ContextMenu x={x} y={y}>
      <ContextMenuItem onClick={() => { onCopy(); onClose(); }}>
        Copy Path
      </ContextMenuItem>
      {entry.is_directory && (
        <>
          {!isPinned && (
            <ContextMenuItem onClick={() => { onPin(); onClose(); }}>
              Pin Folder
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => { onOpenInNewWindow(); onClose(); }}>
            Open in New Window
          </ContextMenuItem>
        </>
      )}
    </ContextMenu>
  );
}
