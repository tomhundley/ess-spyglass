import { ReactNode } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  children: ReactNode;
  onStopPropagation?: (e: React.MouseEvent) => void;
}

export function ContextMenu({ x, y, children, onStopPropagation }: ContextMenuProps) {
  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => {
        e.stopPropagation();
        onStopPropagation?.(e);
      }}
    >
      {children}
    </div>
  );
}

interface ContextMenuItemProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function ContextMenuItem({ children, onClick, disabled }: ContextMenuItemProps) {
  return (
    <div
      className={`context-menu-item ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </div>
  );
}
