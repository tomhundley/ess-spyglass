interface PathsIconProps {
  size?: number;
}

export function PathsIcon({ size = 16 }: PathsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18M3 12h18M3 18h12" />
    </svg>
  );
}
