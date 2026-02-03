import { FileEntry, IndexEntry } from '../../../types';
import { MIN_SEARCH_LENGTH } from '../../../constants';
import { FileItem } from './FileItem';
import { FileGroupHeader } from './FileGroupHeader';
import { EmptyState, LoadingState, ErrorState } from './EmptyState';

interface IndexedGroups {
  folders: IndexEntry[];
  files: IndexEntry[];
}

interface FileListProps {
  loading: boolean;
  error: string | null;
  searchQuery: string;
  useIndexSearch: boolean;
  filteredEntries: FileEntry[];
  indexedResults: IndexEntry[];
  indexedGroups: IndexedGroups;
  copiedPath: string | null;
  showPaths: boolean;
  onItemClick: (entry: FileEntry | IndexEntry) => void;
  onItemDoubleClick: (entry: FileEntry | IndexEntry) => void;
  onItemContextMenu: (e: React.MouseEvent, entry: FileEntry | IndexEntry) => void;
}

export function FileList({
  loading,
  error,
  searchQuery,
  useIndexSearch,
  filteredEntries,
  indexedResults,
  indexedGroups,
  copiedPath,
  showPaths,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
}: FileListProps) {
  // Loading state (only for non-index search)
  if (loading && !useIndexSearch) {
    return (
      <div className="file-list">
        <LoadingState />
      </div>
    );
  }

  // Error state (only for non-index search)
  if (error && !useIndexSearch) {
    return (
      <div className="file-list">
        <ErrorState message={error} />
      </div>
    );
  }

  // Index search results
  if (useIndexSearch && searchQuery) {
    if (indexedResults.length === 0) {
      const message = searchQuery.length < MIN_SEARCH_LENGTH
        ? 'Type at least 2 characters...'
        : 'No matches';
      return (
        <div className="file-list">
          <EmptyState message={message} />
        </div>
      );
    }

    const { folders, files } = indexedGroups;

    return (
      <div className="file-list">
        {folders.length > 0 && (
          <>
            <FileGroupHeader label="Folders" count={folders.length} />
            {folders.map((entry) => (
              <FileItem
                key={entry.path}
                entry={entry}
                isCopied={copiedPath === entry.path}
                showPath={showPaths}
                onClick={() => onItemClick(entry)}
                onDoubleClick={() => onItemDoubleClick(entry)}
                onContextMenu={(e) => onItemContextMenu(e, entry)}
              />
            ))}
          </>
        )}
        {files.length > 0 && (
          <>
            <FileGroupHeader label="Files" count={files.length} />
            {files.map((entry) => (
              <FileItem
                key={entry.path}
                entry={entry}
                isCopied={copiedPath === entry.path}
                showPath={showPaths}
                onClick={() => onItemClick(entry)}
                onDoubleClick={() => onItemDoubleClick(entry)}
                onContextMenu={(e) => onItemContextMenu(e, entry)}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  // Local file list (filtered or all)
  if (filteredEntries.length === 0) {
    const message = searchQuery ? 'No matches' : 'Empty folder';
    return (
      <div className="file-list">
        <EmptyState message={message} />
      </div>
    );
  }

  return (
    <div className="file-list">
      {filteredEntries.map((entry) => (
        <FileItem
          key={entry.path}
          entry={entry}
          isCopied={copiedPath === entry.path}
          showPath={showPaths}
          onClick={() => onItemClick(entry)}
          onDoubleClick={() => onItemDoubleClick(entry)}
          onContextMenu={(e) => onItemContextMenu(e, entry)}
        />
      ))}
    </div>
  );
}
