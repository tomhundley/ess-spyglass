import { useState, useCallback, useRef, useEffect } from 'react';
import * as api from '../api/electron';
import { COPY_FEEDBACK_DELAY } from '../constants';

export function useClipboard() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCopyReset = useCallback((delayMs: number = COPY_FEEDBACK_DELAY) => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedPath(null);
      copyTimeoutRef.current = null;
    }, delayMs);
  }, []);

  const handleCopy = useCallback(async (path: string) => {
    try {
      await api.copyToClipboard(path);
      setCopiedPath(path);
      scheduleCopyReset();
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, [scheduleCopyReset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return {
    copiedPath,
    handleCopy,
  };
}
