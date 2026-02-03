import { CheckIcon } from '../../icons';
import { IndexProgress } from '../../../types';

interface IndexSectionProps {
  isIndexing: boolean;
  indexProgress: IndexProgress | null;
  indexCount: number;
  onStartIndexing: () => void;
}

export function IndexSection({
  isIndexing,
  indexProgress,
  indexCount,
  onStartIndexing,
}: IndexSectionProps) {
  const progressPercent = indexProgress
    ? Math.round((indexProgress.indexed_folders / Math.max(indexProgress.total_folders, 1)) * 100)
    : 0;

  return (
    <div className="settings-section">
      <label className="settings-label">File Index</label>
      <div className="index-status">
        {isIndexing ? (
          <>
            <div className="index-progress">
              <div className="index-progress-bar">
                <div
                  className="index-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="index-progress-text">{progressPercent}%</span>
            </div>
            <div className="index-stats">
              <span>{indexProgress?.total_files.toLocaleString() || 0} files indexed</span>
            </div>
            <div className="index-current">
              Scanning: {indexProgress?.current_folder.split('/').slice(-2).join('/') || '...'}
            </div>
          </>
        ) : (
          <>
            <div className="index-complete">
              <CheckIcon color="#4ade80" />
              <span>{indexCount.toLocaleString()} files indexed</span>
            </div>
            <button className="settings-button" onClick={onStartIndexing}>
              Re-index Home Folder
            </button>
          </>
        )}
      </div>
      <span className="settings-hint">
        Indexes all files in ~ (excluding node_modules, .git, etc.) for instant search.
      </span>
    </div>
  );
}
