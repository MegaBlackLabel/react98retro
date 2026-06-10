import { useCallback, useRef, useState } from 'react';

export interface WindowState {
  id: string;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MoveRequest {
  x: number;
  y: number;
}

export interface UseWindowManagerResult {
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  geometries: Record<string, WindowGeometry>;
  moveRequests: Record<string, MoveRequest>;
  autoMoveOnSnap: boolean;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  maximize: (id: string) => void;
  restore: (id: string) => void;
  close: (id: string) => void;
  register: (id: string) => void;
  unregister: (id: string) => void;
  isActive: (id: string) => boolean;
  updateGeometry: (id: string, geometry: WindowGeometry) => void;
  getAllGeometries: () => Record<string, WindowGeometry>;
  requestMove: (id: string, position: MoveRequest) => void;
  clearMoveRequest: (id: string) => void;
}

export function useWindowManager(windowIds: string[] = [], autoMoveOnSnap = false): UseWindowManagerResult {
  const [windows, setWindows] = useState<Record<string, WindowState>>(() => {
    const initial: Record<string, WindowState> = {};
    windowIds.forEach((id, i) => {
      initial[id] = { id, minimized: false, maximized: false, zIndex: i + 1 };
    });
    return initial;
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [geometries, setGeometries] = useState<Record<string, WindowGeometry>>({});
  const [moveRequests, setMoveRequests] = useState<Record<string, MoveRequest>>({});
  const activeWindowIdRef = useRef(activeWindowId);
  activeWindowIdRef.current = activeWindowId;

  const getMaxZIndex = (state: Record<string, WindowState>): number =>
    Math.max(0, ...Object.values(state).map((w) => w.zIndex));

  const focus = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      const maxZ = getMaxZIndex(prev);
      if (prev[id].zIndex === maxZ) return prev;
      return { ...prev, [id]: { ...prev[id], zIndex: maxZ + 1 } };
    });
    setActiveWindowId(id);
    activeWindowIdRef.current = id;
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
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const register = useCallback((id: string) => {
    setWindows((prev) => {
      if (prev[id]) return prev;

      const maxZ = getMaxZIndex(prev);
      const next = { ...prev, [id]: { id, minimized: false, maximized: false, zIndex: maxZ + 1 } };

      const currentActive = activeWindowIdRef.current;
      if (currentActive && currentActive !== id && next[currentActive]) {
        next[currentActive] = { ...next[currentActive], zIndex: maxZ + 2 };
      }

      return next;
    });
    setActiveWindowId((current) => {
      const newActive = current ?? id;
      activeWindowIdRef.current = newActive;
      return newActive;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const isActive = useCallback((id: string) => activeWindowId === id, [activeWindowId]);

  const updateGeometry = useCallback((id: string, geometry: WindowGeometry) => {
    setGeometries((prev) => ({ ...prev, [id]: geometry }));
  }, []);

  const getAllGeometries = useCallback(() => geometries, [geometries]);

  const requestMove = useCallback((id: string, position: MoveRequest) => {
    setMoveRequests((prev) => ({ ...prev, [id]: position }));
  }, []);

  const clearMoveRequest = useCallback((id: string) => {
    setMoveRequests((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return {
    windows,
    activeWindowId,
    geometries,
    moveRequests,
    autoMoveOnSnap,
    focus,
    minimize,
    maximize,
    restore,
    close,
    register,
    unregister,
    isActive,
    updateGeometry,
    getAllGeometries,
    requestMove,
    clearMoveRequest,
  };
}
