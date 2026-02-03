import { SunIcon, MoonIcon, MonitorIcon } from '../../icons';
import { Theme } from '../../../hooks';

interface ThemeSectionProps {
  theme: Theme;
  onChangeTheme: (theme: Theme) => void;
}

export function ThemeSection({ theme, onChangeTheme }: ThemeSectionProps) {
  return (
    <div className="settings-section">
      <label className="settings-label">Theme</label>
      <div className="theme-selector">
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => onChangeTheme('light')}
        >
          <SunIcon />
          Light
        </button>
        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => onChangeTheme('dark')}
        >
          <MoonIcon />
          Dark
        </button>
        <button
          className={`theme-option ${theme === 'system' ? 'active' : ''}`}
          onClick={() => onChangeTheme('system')}
        >
          <MonitorIcon />
          System
        </button>
      </div>
    </div>
  );
}
