import { PathsIcon, SunIcon, MoonIcon, MonitorIcon, SettingsIcon } from '../../icons';
import { Theme } from '../../../hooks';

interface ToolbarButtonsProps {
  showPaths: boolean;
  theme: Theme;
  onTogglePaths: () => void;
  onCycleTheme: () => void;
  onOpenSettings: () => void;
}

export function ToolbarButtons({
  showPaths,
  theme,
  onTogglePaths,
  onCycleTheme,
  onOpenSettings,
}: ToolbarButtonsProps) {
  return (
    <>
      <button
        className={`toolbar-btn ${showPaths ? 'active' : ''}`}
        onClick={onTogglePaths}
        title={showPaths ? 'Hide paths' : 'Show paths'}
      >
        <PathsIcon />
      </button>

      <button
        className="theme-toggle"
        onClick={onCycleTheme}
        title={`Theme: ${theme}`}
      >
        {theme === 'dark' ? (
          <MoonIcon />
        ) : theme === 'light' ? (
          <SunIcon />
        ) : (
          <MonitorIcon />
        )}
      </button>

      <button
        className="settings-button"
        onClick={onOpenSettings}
        title="Settings"
      >
        <SettingsIcon />
      </button>
    </>
  );
}
