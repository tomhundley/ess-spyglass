interface BreadcrumbSegmentProps {
  name: string;
  path: string;
  isCurrent: boolean;
  onClick: () => void;
}

export function BreadcrumbSegment({
  name,
  path,
  isCurrent,
  onClick,
}: BreadcrumbSegmentProps) {
  return (
    <span
      className={`breadcrumb-segment ${isCurrent ? 'current' : ''}`}
      onClick={isCurrent ? undefined : onClick}
      title={isCurrent ? path : `Navigate to ${path}`}
    >
      {name}
    </span>
  );
}
