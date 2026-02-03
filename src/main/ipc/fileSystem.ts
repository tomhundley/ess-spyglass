import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
}

export function registerFileSystemHandlers() {
  ipcMain.handle('fs:readDirectory', async (_event, dirPath: string): Promise<FileEntry[]> => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const fileEntries: FileEntry[] = [];

      for (const entry of entries) {
        // Skip hidden files (starting with .)
        if (entry.name.startsWith('.')) {
          continue;
        }

        fileEntries.push({
          name: entry.name,
          path: path.join(dirPath, entry.name),
          is_directory: entry.isDirectory(),
        });
      }

      // Sort: folders first, then files, both alphabetically
      fileEntries.sort((a, b) => {
        if (a.is_directory && !b.is_directory) return -1;
        if (!a.is_directory && b.is_directory) return 1;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      return fileEntries;
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  });

  ipcMain.handle('fs:getParentPath', async (_event, filePath: string): Promise<string | null> => {
    const parent = path.dirname(filePath);
    // Don't go above root
    if (parent === filePath) {
      return null;
    }
    return parent;
  });

  ipcMain.handle('fs:getHomeDir', async (): Promise<string> => {
    return os.homedir();
  });

  ipcMain.handle('fs:pathExists', async (_event, filePath: string): Promise<boolean> => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });
}
