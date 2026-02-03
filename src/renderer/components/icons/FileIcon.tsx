import { ICON_COLORS } from '../../constants';

interface FileIconProps {
  size?: number;
  color?: string;
}

export function FileIcon({ size = 16, color = ICON_COLORS.FILE }: FileIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
    </svg>
  );
}
