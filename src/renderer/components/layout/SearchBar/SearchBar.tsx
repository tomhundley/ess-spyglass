import { SearchIcon, CloseIcon } from '../../icons';
import { Theme } from '../../../hooks';
import { ToolbarButtons } from './ToolbarButtons';

interface SearchBarProps {
  searchQuery: string;
  placeholder: string;
  showPaths: boolean;
  theme: Theme;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onTogglePaths: () => void;
  onCycleTheme: () => void;
  onOpenSettings: () => void;
}

export function SearchBar({
  searchQuery,
  placeholder,
  showPaths,
  theme,
  onSearchChange,
  onClearSearch,
  onTogglePaths,
  onCycleTheme,
  onOpenSettings,
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClearSearch();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="search-bar">
      <SearchIcon className="search-icon" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {searchQuery && (
        <button className="search-clear" onClick={onClearSearch}>
          <CloseIcon />
        </button>
      )}
      <ToolbarButtons
        showPaths={showPaths}
        theme={theme}
        onTogglePaths={onTogglePaths}
        onCycleTheme={onCycleTheme}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}
