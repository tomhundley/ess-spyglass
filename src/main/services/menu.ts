import { app, Menu, shell, BrowserWindow } from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';
import { checkForUpdates } from './autoUpdater';

let aboutWindow: BrowserWindow | null = null;

function getLogoBase64(filename: string): string {
  try {
    // In packaged app, extraResources go to Contents/Resources/resources
    // In dev, they're in the project root's resources folder
    const basePath = app.isPackaged
      ? join(process.resourcesPath, 'resources')
      : join(__dirname, '../../resources');
    const logoPath = join(basePath, filename);
    const buffer = readFileSync(logoPath);
    return buffer.toString('base64');
  } catch (e) {
    console.error(`Failed to load logo ${filename}:`, e);
    return '';
  }
}

export function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  // Load logos
  const spyglassLogo = getLogoBase64('icon.iconset/icon_256x256.png');
  const essLogo = getLogoBase64('ess-logo.png');

  aboutWindow = new BrowserWindow({
    width: 400,
    height: 520,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'About Spyglass',
    show: false,
    backgroundColor: '#0b0f14',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDark = true; // Could check nativeTheme.shouldUseDarkColors
  const bgColor = isDark ? '#0b0f14' : '#f3f5fb';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedColor = isDark ? '#6b7280' : '#94a3b8';
  const accentColor = '#31f2b7';
  const cardBg = isDark ? 'rgba(26, 33, 42, 0.92)' : 'rgba(243, 246, 252, 0.95)';
  const borderColor = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 23, 42, 0.12)';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>About Spyglass</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      padding: 60px 32px 32px;
      -webkit-app-region: drag;
      user-select: none;
      height: 100vh;
      overflow-y: auto;
    }

    .content { -webkit-app-region: no-drag; }

    .logo-section {
      text-align: center;
      margin-bottom: 24px;
    }

    .logo {
      width: 96px;
      height: 96px;
      border-radius: 22px;
      margin-bottom: 16px;
      box-shadow: 0 8px 32px rgba(49, 242, 183, 0.3);
      overflow: hidden;
    }

    .logo img { width: 100%; height: 100%; object-fit: contain; }

    .app-name {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -1px;
      margin-bottom: 4px;
    }

    .version {
      font-size: 14px;
      color: ${mutedColor};
      font-family: 'SF Mono', Monaco, monospace;
    }

    .company-card {
      background: ${cardBg};
      border: 1px solid ${borderColor};
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }

    .company-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .company-logo img { width: 100%; height: 100%; object-fit: contain; }

    .company-info h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .company-info p {
      font-size: 11px;
      color: ${mutedColor};
    }

    .description {
      font-size: 13px;
      color: ${mutedColor};
      line-height: 1.7;
      text-align: center;
      margin-bottom: 20px;
    }

    .license {
      background: ${cardBg};
      border: 1px solid ${borderColor};
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }

    .license-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${accentColor}, #34d399);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .license p {
      font-size: 11px;
      color: ${mutedColor};
      line-height: 1.6;
    }

    .links {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 20px;
    }

    .link {
      color: ${accentColor};
      text-decoration: none;
      font-size: 12px;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .link:hover { opacity: 0.8; }

    .footer {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid ${borderColor};
    }

    .copyright {
      font-size: 11px;
      color: ${mutedColor};
      margin-bottom: 4px;
    }

    .tagline {
      font-size: 10px;
      color: ${mutedColor};
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="content">
    <div class="logo-section">
      <div class="logo">
        ${spyglassLogo ? `<img src="data:image/png;base64,${spyglassLogo}" alt="Spyglass">` : ''}
      </div>
      <h1 class="app-name">Spyglass</h1>
      <p class="version">Version ${app.getVersion()}</p>
    </div>

    <div class="company-card">
      <div class="company-logo">
        ${essLogo ? `<img src="data:image/png;base64,${essLogo}" alt="ESS">` : 'ESS'}
      </div>
      <div class="company-info">
        <h3>Elegant Software Solutions, Inc.</h3>
        <p>Crafting elegant tools for modern workflows</p>
      </div>
    </div>

    <p class="description">
      A lightning-fast file explorer with fuzzy search,
      designed for power users who value speed and simplicity.
    </p>

    <div class="license">
      <div class="license-badge">MIT License</div>
      <p>
        Open source software. Free to use, modify, and distribute.
        Provided "as is" without warranty of any kind.
      </p>
    </div>

    <div class="links">
      <a class="link" onclick="require('electron').shell.openExternal('https://github.com/tomhundley/spyglass')">GitHub</a>
    </div>

    <div class="footer">
      <p class="copyright">&copy; ${new Date().getFullYear()} Elegant Software Solutions, Inc.</p>
      <p class="tagline">Made with care in the USA</p>
    </div>
  </div>
</body>
</html>
`;

  aboutWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  aboutWindow.once('ready-to-show', () => {
    aboutWindow?.show();
  });

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

export function createAppMenu(mainWindow: BrowserWindow | null) {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {
          label: 'About Spyglass',
          click: () => createAboutWindow(),
        },
        { type: 'separator' as const },
        {
          label: 'Check for Updates...',
          click: () => checkForUpdates(),
        },
        { type: 'separator' as const },
        {
          label: 'Settings...',
          accelerator: 'Cmd+,',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
              mainWindow.webContents.send('open-settings');
            }
          },
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const },
        ]),
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },

    // Help menu
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'Spyglass Help',
          click: async () => {
            await shell.openExternal('https://github.com/tomhundley/spyglass#readme');
          },
        },
        { type: 'separator' as const },
        {
          label: 'Report an Issue',
          click: async () => {
            await shell.openExternal('https://github.com/tomhundley/spyglass/issues');
          },
        },
        ...(!isMac ? [
          { type: 'separator' as const },
          {
            label: 'About Spyglass',
            click: () => createAboutWindow(),
          },
        ] : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
