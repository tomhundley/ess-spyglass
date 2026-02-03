interface BreadcrumbSegmentProps {
  name: string;
  path: string;
  isCurrent: boolean;
  onClick: () => void;
}

export function BreadcrumbSegment({
  name,
  isCurrent,
  onClick,
}: BreadcrumbSegmentProps) {
  return (
    <span
      className={`breadcrumb-segment ${isCurrent ? 'current' : ''}`}
      onClick={isCurrent ? undefined : onClick}
    >
      {name}
    </span>
  );
}
