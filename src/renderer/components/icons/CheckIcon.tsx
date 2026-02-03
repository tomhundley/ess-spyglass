import { ICON_COLORS } from '../../constants';

interface CheckIconProps {
  size?: number;
  color?: string;
}

export function CheckIcon({ size = 16, color = ICON_COLORS.CHECK }: CheckIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
