import { useState } from 'react';
import { IndexPathEntry } from '../../../types';
import { abbreviatePathForDisplay } from '../../../utils/path';

// Must match DEFAULT_EXCLUDE_PATTERNS in config.ts
const DEFAULT_EXCLUDES = [
  'node_modules', 'target', '.git', 'dist', 'build', '.next',
  'vendor', '__pycache__', '.venv', 'venv', '.cargo',
  'Library', '.Trash', 'Applications', '.cache', '.npm', '.yarn', 'Caches',
];

interface ScopeSectionProps {
  indexPaths: IndexPathEntry[];
  excludePatterns: string[];
  onUpdatePaths: (paths: IndexPathEntry[]) => void;
  onUpdateExcludes: (patterns: string[]) => void;
  onPickFolder: () => Promise<string | null>;
}

export function ScopeSection({
  indexPaths,
  excludePatterns,
  onUpdatePaths,
  onUpdateExcludes,
  onPickFolder,
}: ScopeSectionProps) {
  const [newExclude, setNewExclude] = useState('');

  const handleAddFolder = async () => {
    const folder = await onPickFolder();
    if (folder && !indexPaths.some(p => p.path === folder)) {
      onUpdatePaths([...indexPaths, { path: folder, recursive: true }]);
    }
  };

  const handleRemovePath = (path: string) => {
    onUpdatePaths(indexPaths.filter(p => p.path !== path));
  };

  const handleToggleRecursive = (path: string) => {
    onUpdatePaths(indexPaths.map(p =>
      p.path === path ? { ...p, recursive: !p.recursive } : p
    ));
  };

  const handleAddExclude = () => {
    const trimmed = newExclude.trim();
    if (trimmed && !excludePatterns.includes(trimmed)) {
      onUpdateExcludes([...excludePatterns, trimmed]);
      setNewExclude('');
    }
  };

  const handleRemoveExclude = (pattern: string) => {
    onUpdateExcludes(excludePatterns.filter(p => p !== pattern));
  };

  const handleResetExcludes = () => {
    onUpdateExcludes([...DEFAULT_EXCLUDES]);
  };

  return (
    <div className="settings-section">
      <label className="settings-label">Search Scope</label>

      {/* Indexed Folders */}
      <div className="scope-subsection">
        <span className="scope-sublabel">Indexed Folders</span>
        <div className="scope-path-list">
          {indexPaths.map((entry) => (
            <div key={entry.path} className="scope-path-row">
              <span className="scope-path-icon">📁</span>
              <span className="scope-path-name" title={entry.path}>
                {abbreviatePathForDisplay(entry.path)}
              </span>
              <label className="scope-recursive-toggle" title="Index all subdirectories">
                <input
                  type="checkbox"
                  checked={entry.recursive}
                  onChange={() => handleToggleRecursive(entry.path)}
                />
                <span>subdirs</span>
              </label>
              <button
                className="scope-remove-btn"
                onClick={() => handleRemovePath(entry.path)}
                title="Remove this folder from index"
              >
                ×
              </button>
            </div>
          ))}
          {indexPaths.length === 0 && (
            <div className="scope-empty">No folders configured — defaults to ~/projects</div>
          )}
        </div>
        <button className="settings-button scope-add-btn" onClick={handleAddFolder}>
          + Add folder...
        </button>
      </div>

      {/* Exclude Patterns */}
      <div className="scope-subsection">
        <span className="scope-sublabel">Excluded Directories</span>
        <div className="scope-chips">
          {excludePatterns.map((pattern) => (
            <span key={pattern} className="scope-chip" title={`Exclude directories named "${pattern}"`}>
              {pattern}
              <button
                className="scope-chip-remove"
                onClick={() => handleRemoveExclude(pattern)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="scope-add-exclude">
          <input
            type="text"
            className="scope-exclude-input"
            value={newExclude}
            onChange={(e) => setNewExclude(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExclude()}
            placeholder="Directory name..."
          />
          <button className="settings-button" onClick={handleAddExclude}>Add</button>
          <button
            className="settings-button"
            onClick={handleResetExcludes}
            title="Restore the default exclude list"
          >
            Reset
          </button>
        </div>
      </div>

      <span className="settings-hint">
        Re-index after changing scope. Only these folders will appear in search results.
      </span>
    </div>
  );
}
