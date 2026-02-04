import { useState, useEffect } from 'react';

interface AboutSectionProps {
  onCheckForUpdates: () => void;
  isCheckingForUpdates: boolean;
}

export function AboutSection({ onCheckForUpdates, isCheckingForUpdates }: AboutSectionProps) {
  const [version, setVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    window.electron.getAppVersion().then(setVersion).catch(() => setVersion('Unknown'));
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) setPlatform('macOS');
    else if (userAgent.includes('win')) setPlatform('Windows');
    else if (userAgent.includes('linux')) setPlatform('Linux');
    else setPlatform('Unknown');
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="settings-section about-section">
      <label className="settings-label">About Spyglass</label>

      {/* App Header */}
      <div className="about-header">
        <div className="about-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <circle cx="11" cy="11" r="3" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <div className="about-header-info">
          <h3 className="about-app-name">Spyglass</h3>
          <div className="about-version-row">
            <span className="about-version">v{version || '...'}</span>
            <span className="about-platform">{platform}</span>
          </div>
        </div>
      </div>

      {/* Company Card */}
      <div className="about-card about-company-card">
        <div className="about-company-logo">ESS</div>
        <div className="about-company-info">
          <h4>Elegant Software Solutions, Inc.</h4>
          <p>Crafting elegant tools for modern workflows</p>
        </div>
      </div>

      {/* Description */}
      <div className="about-description">
        <p>
          Spyglass is a lightning-fast file explorer designed for power users.
          Navigate your filesystem with fuzzy search, pin your favorite folders,
          and copy paths instantly.
        </p>
      </div>

      {/* Features */}
      <div className="about-card about-features">
        <h4>Features</h4>
        <ul>
          <li><span className="feature-icon">⚡</span> Instant fuzzy search across files</li>
          <li><span className="feature-icon">📌</span> Pin folders for quick access</li>
          <li><span className="feature-icon">🎯</span> Focus mode for minimal distraction</li>
          <li><span className="feature-icon">📋</span> One-click path copying</li>
          <li><span className="feature-icon">🌙</span> Dark & light themes</li>
          <li><span className="feature-icon">⌨️</span> Global hotkey support</li>
        </ul>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="about-card about-shortcuts">
        <h4>Keyboard Shortcuts</h4>
        <div className="shortcut-grid">
          <div className="shortcut-item">
            <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Space</kbd>
            <span>Toggle window</span>
          </div>
          <div className="shortcut-item">
            <kbd>⌘</kbd><kbd>[</kbd>
            <span>Navigate back</span>
          </div>
          <div className="shortcut-item">
            <kbd>⌘</kbd><kbd>+</kbd>
            <span>Zoom in</span>
          </div>
          <div className="shortcut-item">
            <kbd>⌘</kbd><kbd>-</kbd>
            <span>Zoom out</span>
          </div>
          <div className="shortcut-item">
            <kbd>Esc</kbd>
            <span>Clear search / collapse</span>
          </div>
        </div>
      </div>

      {/* Updates */}
      <div className="about-card about-updates">
        <h4>Updates</h4>
        <p className="about-update-info">
          Spyglass automatically checks for updates. You can also check manually below.
        </p>
        <button
          className="about-update-btn"
          onClick={onCheckForUpdates}
          disabled={isCheckingForUpdates}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          {isCheckingForUpdates ? 'Checking...' : 'Check for Updates'}
        </button>
      </div>

      {/* License */}
      <div className="about-card about-license">
        <h4>License</h4>
        <div className="license-badge">MIT License</div>
        <p>
          This is open source software released under the MIT License.
          You are free to use, modify, and distribute this software.
        </p>
        <div className="license-disclaimer">
          <strong>Disclaimer:</strong> This software is provided "as is", without warranty
          of any kind, express or implied, including but not limited to the warranties of
          merchantability, fitness for a particular purpose and noninfringement. In no event
          shall the authors or copyright holders be liable for any claim, damages or other
          liability arising from the use of this software.
        </div>
      </div>

      {/* Credits */}
      <div className="about-card about-credits">
        <h4>Credits</h4>
        <p>Built with:</p>
        <div className="credits-list">
          <span className="credit-item">Electron</span>
          <span className="credit-item">React</span>
          <span className="credit-item">TypeScript</span>
          <span className="credit-item">Vite</span>
          <span className="credit-item">Fuse.js</span>
        </div>
      </div>

      {/* Links */}
      <div className="about-card about-links-card">
        <h4>Links</h4>
        <div className="about-links-single">
          <a href="#" onClick={(e) => { e.preventDefault(); window.electron.copyToClipboard('https://github.com/tomhundley/spyglass'); }} className="about-link-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>View on GitHub</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="about-footer">
        <div className="about-copyright">
          &copy; {currentYear} Elegant Software Solutions, Inc.
        </div>
        <div className="about-tagline">
          Made with care in the USA
        </div>
      </div>
    </div>
  );
}
