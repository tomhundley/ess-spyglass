interface BackArrowIconProps {
  size?: number;
}

export function BackArrowIcon({ size = 18 }: BackArrowIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
