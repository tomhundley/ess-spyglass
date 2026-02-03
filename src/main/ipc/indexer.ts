import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface IndexEntry {
  name: string;
  path: string;
  is_directory: boolean;
  parent_folder: string;
}

export interface IndexProgress {
  total_folders: number;
  indexed_folders: number;
  total_files: number;
  current_folder: string;
  is_complete: boolean;
}

// Skip these directories during indexing
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  'target',
  '.git',
  'dist',
  'build',
  '.next',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.cargo',
  'Library',
  '.Trash',
  'Applications',
  '.cache',
  '.npm',
  '.yarn',
  'Caches',
]);

// Global indexing state
let indexEntries: IndexEntry[] = [];
let lowerNames: string[] = [];
let indexProgress: IndexProgress = {
  total_folders: 0,
  indexed_folders: 0,
  total_files: 0,
  current_folder: '',
  is_complete: false,
};
let isIndexing = false;

function getConfigDir(): string {
  const configDir = process.platform === 'darwin'
    ? path.join(os.homedir(), '.config', 'spyglass')
    : path.join(os.homedir(), '.spyglass');
  return configDir;
}

function getIndexPath(): string {
  return path.join(getConfigDir(), 'index.json');
}

async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir();
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

async function indexDirectory(
  dirPath: string,
  entries: IndexEntry[],
  lowerNamesArr: string[],
  skipHidden: boolean = true
): Promise<void> {
  try {
    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
    const parentFolder = path.basename(dirPath) || '~';

    // Update current folder in progress
    indexProgress.current_folder = dirPath;

    const subdirs: string[] = [];

    for (const entry of dirEntries) {
      const name = entry.name;

      // Skip hidden files/folders
      if (skipHidden && name.startsWith('.')) {
        continue;
      }

      const filePath = path.join(dirPath, name);
      const isDir = entry.isDirectory();
      const nameLower = name.toLowerCase();

      entries.push({
        name,
        path: filePath,
        is_directory: isDir,
        parent_folder: parentFolder,
      });
      lowerNamesArr.push(nameLower);

      // Update total files count less frequently
      if (entries.length % 100 === 0) {
        indexProgress.total_files = entries.length;
      }

      if (isDir) {
        // Skip common large/unneeded directories
        if (!SKIP_DIRECTORIES.has(name)) {
          indexProgress.total_folders += 1;
          subdirs.push(filePath);
        }
      }
    }

    // Update indexed folders count
    indexProgress.indexed_folders += 1;
    indexProgress.total_files = entries.length;

    // Recursively index subdirectories
    for (const subdir of subdirs) {
      await indexDirectory(subdir, entries, lowerNamesArr, skipHidden);
    }
  } catch {
    // Skip directories we can't read
  }
}

export function registerIndexerHandlers() {
  ipcMain.handle('indexer:start', async (): Promise<void> => {
    if (isIndexing) {
      return;
    }

    isIndexing = true;
    indexProgress = {
      total_folders: 1,
      indexed_folders: 0,
      total_files: 0,
      current_folder: '',
      is_complete: false,
    };

    const homeDir = os.homedir();

    // Run indexing in background
    setImmediate(async () => {
      try {
        const newEntries: IndexEntry[] = [];
        const newLowerNames: string[] = [];

        await indexDirectory(homeDir, newEntries, newLowerNames, true);

        // Update global state
        indexEntries = newEntries;
        lowerNames = newLowerNames;
        indexProgress.is_complete = true;
        indexProgress.total_files = newEntries.length;
        isIndexing = false;

        // Save index to disk
        await ensureConfigDir();
        const indexPath = getIndexPath();
        await fs.writeFile(indexPath, JSON.stringify(newEntries));

        // Notify all windows
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('index-complete', indexProgress.total_files);
        });
      } catch (error) {
        console.error('Indexing failed:', error);
        isIndexing = false;
        indexProgress.is_complete = true;
      }
    });
  });

  ipcMain.handle('indexer:getProgress', async (): Promise<IndexProgress> => {
    return { ...indexProgress };
  });

  ipcMain.handle('indexer:search', async (_event, query: string): Promise<IndexEntry[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryDash = `-${queryLower}`;
    const queryUnderscore = `_${queryLower}`;

    // Collect matching entries with scores
    const scored: Array<{ score: number; entry: IndexEntry }> = [];

    for (let i = 0; i < indexEntries.length; i++) {
      const entry = indexEntries[i];
      const nameLower = lowerNames[i] || entry.name.toLowerCase();

      if (!nameLower.includes(queryLower)) {
        continue;
      }

      let score = 0;

      // Exact match gets highest score
      if (nameLower === queryLower) {
        score += 1000;
      }
      // Starts with query gets high score
      else if (nameLower.startsWith(queryLower)) {
        score += 500;
      }
      // Query at word boundary (after - or _)
      else if (nameLower.includes(queryDash) || nameLower.includes(queryUnderscore)) {
        score += 300;
      }

      // Directories get bonus
      if (entry.is_directory) {
        score += 200;
      }

      // Shorter names rank higher (more relevant)
      score += 50 - Math.min(entry.name.length, 50);

      // Files in projects folder get bonus
      if (entry.path.includes('/projects/')) {
        score += 100;
      }

      scored.push({ score, entry });
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top 100
    return scored.slice(0, 100).map(s => s.entry);
  });

  ipcMain.handle('indexer:loadSaved', async (): Promise<boolean> => {
    const indexPath = getIndexPath();

    try {
      if (!fsSync.existsSync(indexPath)) {
        return false;
      }

      const content = await fs.readFile(indexPath, 'utf-8');
      const entries = JSON.parse(content) as IndexEntry[];

      indexEntries = entries;
      lowerNames = entries.map(e => e.name.toLowerCase());
      indexProgress = {
        total_folders: 0,
        indexed_folders: 0,
        total_files: entries.length,
        current_folder: '',
        is_complete: true,
      };

      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('indexer:getCount', async (): Promise<number> => {
    return indexEntries.length;
  });
}
