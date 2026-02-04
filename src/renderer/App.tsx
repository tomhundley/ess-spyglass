import { useState, useCallback, useEffect } from 'react';
import { FileEntry, IndexEntry } from './types';
import { BASE_FONT_SIZE, COPY_COLLAPSE_DELAY } from './constants';
import {
  useTheme,
  useAppZoom,
  useClipboard,
  useNavigation,
  usePinnedFolders,
  useIndexer,
  useSearch,
  useFocusMode,
  useKeyboardShortcuts,
  useAutoUpdater,
  PinnedFolder,
} from './hooks';
import {
  ErrorBoundary,
  PinnedFoldersBar,
  Breadcrumb,
  SearchBar,
  FileList,
  FileContextMenu,
  PinnedContextMenu,
  SettingsPanel,
  UpdateNotification,
} from './components';

interface FileContextMenuState {
  x: number;
  y: number;
  entry: FileEntry;
}

interface PinnedContextMenuState {
  x: number;
  y: number;
  folder: PinnedFolder;
}

function App() {
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);

  // Update notification dismissed state
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // Context menu states
  const [fileContextMenu, setFileContextMenu] = useState<FileContextMenuState | null>(null);
  const [pinnedContextMenu, setPinnedContextMenu] = useState<PinnedContextMenuState | null>(null);

  // Theme hook
  const { theme, changeTheme, cycleTheme } = useTheme();

  // Zoom hook
  const { appZoom, zoomIn, zoomOut, resetZoom } = useAppZoom();

  // Clipboard hook
  const { copiedPath, handleCopy } = useClipboard();

  // Navigation hook
  const {
    currentPath,
    entries,
    loading,
    error,
    navigateTo,
    navigateBack,
    openInNewWindow,
    breadcrumbSegments,
  } = useNavigation();

  // Pinned folders hook
  const {
    pinnedFolders,
    draggedFolderId,
    setDraggedFolderId,
    pinFolder,
    unpinFolder,
    reorderPinnedFolders,
    isPinned,
  } = usePinnedFolders(currentPath);

  // Indexer hook
  const {
    indexProgress,
    indexCount,
    isIndexing,
    indexedResults,
    startIndexing,
    searchIndexed,
    clearIndexedResults,
    searchDebounceDelay,
  } = useIndexer();

  // Search hook
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    useIndexSearch,
    setUseIndexSearch,
    showPaths,
    togglePaths,
    filteredEntries,
    indexedGroups,
  } = useSearch({
    entries,
    indexedResults,
    searchIndexed,
    clearIndexedResults,
    searchDebounceDelay,
    currentPath,
  });

  // Focus mode hook
  const {
    focusMode,
    isExpanded,
    expandedFolderId,
    toggleFocusMode,
    expandToFolder,
    collapseToStrip,
    handleMouseEnter,
    handleMouseLeave,
    setExpandedEntryCount,
  } = useFocusMode({
    navigateTo,
    clearSearch,
  });

  // Update entry count when entries change (for dynamic height in focus mode)
  useEffect(() => {
    if (focusMode && isExpanded && entries.length > 0) {
      setExpandedEntryCount(entries.length);
    }
  }, [focusMode, isExpanded, entries, setExpandedEntryCount]);

  // Auto-updater hook
  const {
    updateState,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useAutoUpdater();

  // Listen for menu events
  useEffect(() => {
    const unsubscribe = window.electron.onOpenSettings(() => {
      setShowSettings(true);
    });
    return unsubscribe;
  }, []);

  // Close context menus
  const closeContextMenus = useCallback(() => {
    setFileContextMenu(null);
    setPinnedContextMenu(null);
  }, []);

  // Handle escape (collapse in focus mode or clear search)
  const handleEscape = useCallback(() => {
    if (focusMode && isExpanded) {
      collapseToStrip();
    } else {
      clearSearch();
    }
  }, [focusMode, isExpanded, collapseToStrip, clearSearch]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNavigateBack: navigateBack,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    onEscape: handleEscape,
    isContextMenuOpen: !!(fileContextMenu || pinnedContextMenu),
    onCloseContextMenus: closeContextMenus,
  });

  // Handle item click - copy path (and collapse in focus mode)
  const handleItemClick = useCallback(async (entry: FileEntry | IndexEntry) => {
    await handleCopy(entry.path);
    // Auto-collapse after copying in expanded focus mode
    if (focusMode && isExpanded) {
      setTimeout(() => {
        collapseToStrip();
      }, COPY_COLLAPSE_DELAY);
    }
  }, [handleCopy, focusMode, isExpanded, collapseToStrip]);

  // Handle double click - drill down into folder
  const handleDoubleClick = useCallback((entry: FileEntry | IndexEntry) => {
    if (entry.is_directory) {
      navigateTo(entry.path);
    }
  }, [navigateTo]);

  // Handle pinned folder click
  const handlePinnedFolderClick = useCallback((folder: PinnedFolder) => {
    if (focusMode) {
      expandToFolder(folder);
    } else {
      navigateTo(folder.path);
    }
  }, [focusMode, expandToFolder, navigateTo]);

  // Handle drag start for pinned folders
  const handleDragStart = useCallback((folderId: string, e: React.DragEvent) => {
    if (focusMode) return;
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', folderId);
  }, [focusMode, setDraggedFolderId]);

  // Handle drop on pinned folder
  const handleDrop = useCallback((targetFolderId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fromId = e.dataTransfer.getData('text/plain');
    if (fromId && fromId !== targetFolderId) {
      reorderPinnedFolders(fromId, targetFolderId);
    }
    setDraggedFolderId(null);
  }, [reorderPinnedFolders, setDraggedFolderId]);

  // Determine CSS classes for focus mode
  const appClassName = focusMode
    ? `app focus-mode ${isExpanded ? 'expanded' : 'collapsed'}`
    : 'app';

  // Search placeholder
  const searchPlaceholder = useIndexSearch
    ? `Search ${indexCount.toLocaleString()} files...`
    : 'Search folder...';

  return (
    <ErrorBoundary>
      <div
        className={appClassName}
        style={{ fontSize: `${appZoom * BASE_FONT_SIZE}px` }}
        onClick={closeContextMenus}
        onMouseEnter={focusMode && isExpanded ? handleMouseEnter : undefined}
        onMouseLeave={focusMode && isExpanded ? handleMouseLeave : undefined}
      >
        {/* Pinned Folders Bar */}
        <PinnedFoldersBar
          pinnedFolders={pinnedFolders}
          currentPath={currentPath}
          focusMode={focusMode}
          isExpanded={isExpanded}
          expandedFolderId={expandedFolderId}
          draggedFolderId={draggedFolderId}
          onFolderClick={handlePinnedFolderClick}
          onDragStart={handleDragStart}
          onDragEnd={() => setDraggedFolderId(null)}
          onDrop={handleDrop}
          onContextMenu={(e, folder) => {
            if (focusMode) return;
            e.preventDefault();
            e.stopPropagation();
            setPinnedContextMenu({ x: e.clientX, y: e.clientY, folder });
          }}
          onToggleFocusMode={toggleFocusMode}
        />

        {/* Content area - hidden in collapsed focus mode */}
        {(!focusMode || isExpanded) && (
          <div className={focusMode ? 'expanded-content-area' : 'content-area'}>
            {/* Breadcrumb */}
            <Breadcrumb
              segments={breadcrumbSegments}
              currentPath={currentPath}
              onBack={navigateBack}
              onNavigate={navigateTo}
            />

            {/* Search Bar */}
            <SearchBar
              searchQuery={searchQuery}
              placeholder={searchPlaceholder}
              showPaths={showPaths}
              theme={theme}
              onSearchChange={setSearchQuery}
              onClearSearch={clearSearch}
              onTogglePaths={togglePaths}
              onCycleTheme={cycleTheme}
              onOpenSettings={() => setShowSettings(true)}
            />

            {/* File List */}
            <FileList
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              useIndexSearch={useIndexSearch}
              filteredEntries={filteredEntries}
              indexedResults={indexedResults}
              indexedGroups={indexedGroups}
              copiedPath={copiedPath}
              showPaths={showPaths}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleDoubleClick}
              onItemContextMenu={(e, entry) => {
                e.preventDefault();
                setFileContextMenu({ x: e.clientX, y: e.clientY, entry: entry as FileEntry });
              }}
            />
          </div>
        )}

        {/* File Context Menu */}
        {fileContextMenu && (
          <FileContextMenu
            x={fileContextMenu.x}
            y={fileContextMenu.y}
            entry={fileContextMenu.entry}
            isPinned={isPinned(fileContextMenu.entry.path)}
            onCopy={() => handleCopy(fileContextMenu.entry.path)}
            onPin={() => pinFolder(fileContextMenu.entry.path)}
            onOpenInNewWindow={() => openInNewWindow(fileContextMenu.entry.path)}
            onClose={() => setFileContextMenu(null)}
          />
        )}

        {/* Pinned Folder Context Menu */}
        {pinnedContextMenu && (
          <PinnedContextMenu
            x={pinnedContextMenu.x}
            y={pinnedContextMenu.y}
            folder={pinnedContextMenu.folder}
            onCopy={() => handleCopy(pinnedContextMenu.folder.path)}
            onUnpin={() => unpinFolder(pinnedContextMenu.folder.id)}
            onClose={() => setPinnedContextMenu(null)}
          />
        )}

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            theme={theme}
            onChangeTheme={changeTheme}
            showPaths={showPaths}
            useIndexSearch={useIndexSearch}
            appZoom={appZoom}
            onTogglePaths={togglePaths}
            onToggleIndexSearch={() => setUseIndexSearch(!useIndexSearch)}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            isIndexing={isIndexing}
            indexProgress={indexProgress}
            indexCount={indexCount}
            onStartIndexing={startIndexing}
            updateState={updateState}
            onCheckForUpdates={checkForUpdates}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Update Notification */}
        {!updateDismissed && (
          <UpdateNotification
            updateState={updateState}
            onDownload={downloadUpdate}
            onInstall={installUpdate}
            onDismiss={() => setUpdateDismissed(true)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
