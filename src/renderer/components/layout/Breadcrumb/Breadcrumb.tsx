import { BackArrowIcon } from '../../icons';
import { BreadcrumbSegment } from './BreadcrumbSegment';

interface Segment {
  name: string;
  path: string;
}

interface BreadcrumbProps {
  segments: Segment[];
  currentPath: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({
  segments,
  currentPath,
  onBack,
  onNavigate,
}: BreadcrumbProps) {
  const canGoBack = !!currentPath;

  return (
    <div className="breadcrumb">
      <button
        className={`breadcrumb-back ${!canGoBack ? 'disabled' : ''}`}
        onClick={onBack}
        disabled={!canGoBack}
      >
        <BackArrowIcon />
        <span className="breadcrumb-back-text">Back</span>
      </button>
      <div className="breadcrumb-path">
        {segments.map((seg, i) => (
          <span key={seg.path}>
            {i > 0 && <span className="breadcrumb-separator"> / </span>}
            <BreadcrumbSegment
              name={seg.name}
              path={seg.path}
              isCurrent={seg.path === currentPath}
              onClick={() => onNavigate(seg.path)}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
