import { useCallback, useState } from 'react';

export interface WindowState {
  id: string;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface UseWindowManagerResult {
  windows: Record<string, WindowState>;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  maximize: (id: string) => void;
  restore: (id: string) => void;
  close: (id: string) => void;
}

export function useWindowManager(windowIds: string[]): UseWindowManagerResult {
  const [windows, setWindows] = useState<Record<string, WindowState>>(() => {
    const initial: Record<string, WindowState> = {};
    windowIds.forEach((id, i) => {
      initial[id] = { id, minimized: false, maximized: false, zIndex: i + 1 };
    });
    return initial;
  });

  const getMaxZIndex = (state: Record<string, WindowState>): number =>
    Math.max(0, ...Object.values(state).map((w) => w.zIndex));

  const focus = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      const maxZ = getMaxZIndex(prev);
      if (prev[id].zIndex === maxZ) return prev;
      return { ...prev, [id]: { ...prev[id], zIndex: maxZ + 1 } };
    });
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], minimized: true } };
    });
  }, []);

  const maximize = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], maximized: true, minimized: false } };
    });
  }, []);

  const restore = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], minimized: false, maximized: false } };
    });
  }, []);

  const close = useCallback((id: string) => {
    setWindows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return { windows, focus, minimize, maximize, restore, close };
}
