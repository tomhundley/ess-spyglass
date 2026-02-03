import { PinnedFolder } from '../../../hooks';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface PinnedContextMenuProps {
  x: number;
  y: number;
  folder: PinnedFolder;
  onCopy: () => void;
  onUnpin: () => void;
  onClose: () => void;
}

export function PinnedContextMenu({
  x,
  y,
  folder,
  onCopy,
  onUnpin,
  onClose,
}: PinnedContextMenuProps) {
  return (
    <ContextMenu x={x} y={y}>
      <ContextMenuItem onClick={() => { onCopy(); onClose(); }}>
        Copy Path
      </ContextMenuItem>
      <ContextMenuItem onClick={() => { onUnpin(); onClose(); }}>
        Unpin
      </ContextMenuItem>
    </ContextMenu>
  );
}
