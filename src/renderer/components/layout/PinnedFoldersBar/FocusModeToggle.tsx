import { ExpandIcon, CollapseIcon } from '../../icons';

interface FocusModeToggleProps {
  focusMode: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({ focusMode, onToggle }: FocusModeToggleProps) {
  return (
    <button
      className={`focus-toggle ${focusMode ? 'active' : ''}`}
      onClick={onToggle}
      title={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
    >
      {focusMode ? <ExpandIcon /> : <CollapseIcon />}
    </button>
  );
}
