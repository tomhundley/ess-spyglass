import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/electron';
import type { UpdateState } from '../types';

export function useAutoUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' });

  // Fetch initial state on mount
  useEffect(() => {
    api.getUpdateState().then(setUpdateState).catch(console.error);
  }, []);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = api.onUpdateStateChanged(setUpdateState);
    return unsubscribe;
  }, []);

  const checkForUpdates = useCallback(async () => {
    await api.checkForUpdates();
  }, []);

  const downloadUpdate = useCallback(async () => {
    await api.downloadUpdate();
  }, []);

  const installUpdate = useCallback(async () => {
    await api.installUpdate();
  }, []);

  return {
    updateState,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
}
