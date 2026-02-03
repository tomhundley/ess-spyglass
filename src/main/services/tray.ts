import { Tray, Menu, app, nativeImage } from 'electron';
import { getMainWindow } from './windows';
import * as path from 'path';

let tray: Tray | null = null;

export function createTray(): void {
  // Create a simple icon (you can replace with actual icon file)
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, '../../resources/iconTemplate.png')
    : path.join(__dirname, '../../resources/icon.png');

  // Try to load icon, fall back to empty image if not found
  let icon: nativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      // Create a simple 16x16 icon if file doesn't exist
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Spyglass');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Spyglass',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: 'Hide Spyglass',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Click to toggle visibility
  tray.on('click', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export function getTray(): Tray | null {
  return tray;
}
