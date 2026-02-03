import { useState, useCallback } from 'react';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from '../constants';

export function useAppZoom() {
  const [appZoom, setAppZoom] = useState(ZOOM_DEFAULT);

  const zoomIn = useCallback(() => {
    setAppZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setAppZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setAppZoom(ZOOM_DEFAULT);
  }, []);

  return {
    appZoom,
    setAppZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
