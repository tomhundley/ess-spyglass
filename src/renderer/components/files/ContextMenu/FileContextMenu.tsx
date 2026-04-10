import { FileEntry } from '../../../types';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface FileContextMenuProps {
  x: number;
  y: number;
  entry: FileEntry;
  isPinned: boolean;
  onOpen: () => void;
  onReveal: () => void;
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
  onOpen,
  onReveal,
  onCopy,
  onPin,
  onOpenInNewWindow,
  onClose,
}: FileContextMenuProps) {
  return (
    <ContextMenu x={x} y={y}>
      <ContextMenuItem onClick={() => { onOpen(); onClose(); }}>
        {entry.is_directory ? 'Open in File Manager' : 'Open'}
      </ContextMenuItem>
      {!entry.is_directory && (
        <ContextMenuItem onClick={() => { onReveal(); onClose(); }}>
          Show in Folder
        </ContextMenuItem>
      )}
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
