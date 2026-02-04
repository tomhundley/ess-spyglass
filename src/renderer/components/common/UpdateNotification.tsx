import React from 'react';
import type { UpdateState } from '../../types';

interface UpdateNotificationProps {
  updateState: UpdateState;
  onDownload: () => void;
  onInstall: () => void;
  onDismiss: () => void;
}

export const UpdateNotification = React.memo(function UpdateNotification({
  updateState,
  onDownload,
  onInstall,
  onDismiss,
}: UpdateNotificationProps) {
  const { status, info, progress, error } = updateState;

  // Only show for relevant states
  if (status === 'idle' || status === 'checking') {
    return null;
  }

  return (
    <div className="update-notification">
      {status === 'available' && (
        <>
          <div className="update-notification-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Version {info?.version} available</span>
          </div>
          <div className="update-notification-actions">
            <button className="update-btn update-btn-primary" onClick={onDownload}>
              Download
            </button>
            <button className="update-btn update-btn-secondary" onClick={onDismiss}>
              Later
            </button>
          </div>
        </>
      )}

      {status === 'downloading' && (
        <>
          <div className="update-notification-content">
            <div className="update-spinner" />
            <span>Downloading... {Math.round(progress?.percent || 0)}%</span>
          </div>
          <div className="update-progress-bar">
            <div
              className="update-progress-fill"
              style={{ width: `${progress?.percent || 0}%` }}
            />
          </div>
        </>
      )}

      {status === 'downloaded' && (
        <>
          <div className="update-notification-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Update ready to install</span>
          </div>
          <div className="update-notification-actions">
            <button className="update-btn update-btn-primary" onClick={onInstall}>
              Restart Now
            </button>
            <button className="update-btn update-btn-secondary" onClick={onDismiss}>
              Later
            </button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="update-notification-content update-notification-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Update failed: {error}</span>
          </div>
          <div className="update-notification-actions">
            <button className="update-btn update-btn-secondary" onClick={onDismiss}>
              Dismiss
            </button>
          </div>
        </>
      )}
    </div>
  );
});
