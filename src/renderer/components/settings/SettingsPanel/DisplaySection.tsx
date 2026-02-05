import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from '../../../constants';

interface DisplaySectionProps {
  showPaths: boolean;
  showHiddenFiles: boolean;
  useIndexSearch: boolean;
  appZoom: number;
  onTogglePaths: () => void;
  onToggleHiddenFiles: () => void;
  onToggleIndexSearch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function DisplaySection({
  showPaths,
  showHiddenFiles,
  useIndexSearch,
  appZoom,
  onTogglePaths,
  onToggleHiddenFiles,
  onToggleIndexSearch,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: DisplaySectionProps) {
  return (
    <div className="settings-section">
      <label className="settings-label">Display</label>
      <div className="settings-toggles">
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={showPaths}
            onChange={onTogglePaths}
          />
          <span>Show full file paths</span>
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={showHiddenFiles}
            onChange={onToggleHiddenFiles}
          />
          <span>Show hidden files and folders</span>
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={useIndexSearch}
            onChange={onToggleIndexSearch}
          />
          <span>Search all indexed files (not just current folder)</span>
        </label>
      </div>
      <div className="settings-zoom">
        <span className="settings-zoom-label">Zoom: {Math.round(appZoom * 100)}%</span>
        <div className="settings-zoom-controls">
          <button onClick={onZoomOut}>-</button>
          <button onClick={onResetZoom}>Reset</button>
          <button onClick={onZoomIn}>+</button>
        </div>
      </div>
    </div>
  );
}
