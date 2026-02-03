import { ICON_COLORS } from '../../constants';

interface FolderIconProps {
  size?: number;
  color?: string;
}

export function FolderIcon({ size = 16, color = ICON_COLORS.FOLDER }: FolderIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}
