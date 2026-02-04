import { CloseIcon } from '../../icons';
import { Theme } from '../../../hooks';
import { IndexProgress, UpdateState } from '../../../types';
import { ThemeSection } from './ThemeSection';
import { DisplaySection } from './DisplaySection';
import { IndexSection } from './IndexSection';
import { AboutSection } from './AboutSection';

interface SettingsPanelProps {
  // Theme
  theme: Theme;
  onChangeTheme: (theme: Theme) => void;

  // Display
  showPaths: boolean;
  useIndexSearch: boolean;
  appZoom: number;
  onTogglePaths: () => void;
  onToggleIndexSearch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;

  // Index
  isIndexing: boolean;
  indexProgress: IndexProgress | null;
  indexCount: number;
  onStartIndexing: () => void;

  // Updates
  updateState: UpdateState;
  onCheckForUpdates: () => void;

  // Panel
  onClose: () => void;
}

export function SettingsPanel({
  theme,
  onChangeTheme,
  showPaths,
  useIndexSearch,
  appZoom,
  onTogglePaths,
  onToggleIndexSearch,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isIndexing,
  indexProgress,
  indexCount,
  onStartIndexing,
  updateState,
  onCheckForUpdates,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="settings-content">
          <ThemeSection theme={theme} onChangeTheme={onChangeTheme} />
          <DisplaySection
            showPaths={showPaths}
            useIndexSearch={useIndexSearch}
            appZoom={appZoom}
            onTogglePaths={onTogglePaths}
            onToggleIndexSearch={onToggleIndexSearch}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
          />
          <IndexSection
            isIndexing={isIndexing}
            indexProgress={indexProgress}
            indexCount={indexCount}
            onStartIndexing={onStartIndexing}
          />
          <AboutSection
            onCheckForUpdates={onCheckForUpdates}
            isCheckingForUpdates={updateState.status === 'checking'}
          />
        </div>
      </div>
    </div>
  );
}
