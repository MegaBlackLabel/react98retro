import { useCallback, useEffect, useRef, useState } from 'react';
import type { Rect } from './collision';

export interface WindowState {
  id: string;
  minimized: boolean;
  maximized: boolean;
  isSnapped: boolean;
  zIndex: number;
}

export type WindowGeometry = Rect;

export interface MoveRequest {
  x: number;
  y: number;
}

export type ResizeRequest = Rect;

export interface UseWindowManagerResult {
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  geometries: Record<string, WindowGeometry>;
  moveRequests: Record<string, MoveRequest>;
  resizeRequests: Record<string, ResizeRequest>;
  preShrinkGeometries: Record<string, WindowGeometry>;
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
  requestResize: (id: string, rect: ResizeRequest) => void;
  clearResizeRequest: (id: string) => void;
  restoreShrink: (id: string) => void;
  setWindowSnapped: (id: string, isSnapped: boolean) => void;
}

export function useWindowManager(windowIds: string[] = [], autoMoveOnSnap = false): UseWindowManagerResult {
  const [windows, setWindows] = useState<Record<string, WindowState>>(() => {
    const initial: Record<string, WindowState> = {};
    windowIds.forEach((id, i) => {
      initial[id] = { id, minimized: false, maximized: false, isSnapped: false, zIndex: i + 1 };
    });
    return initial;
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [geometries, setGeometries] = useState<Record<string, WindowGeometry>>({});
  const [moveRequests, setMoveRequests] = useState<Record<string, MoveRequest>>({});
  const [resizeRequests, setResizeRequests] = useState<Record<string, ResizeRequest>>({});
  const [preShrinkGeometries, setPreShrinkGeometries] = useState<Record<string, WindowGeometry>>({});
  const activeWindowIdRef = useRef(activeWindowId);
  const geometriesRef = useRef(geometries);
  const resizeRequestsRef = useRef(resizeRequests);
  const preShrinkGeometriesRef = useRef(preShrinkGeometries);

  useEffect(() => {
    activeWindowIdRef.current = activeWindowId;
  }, [activeWindowId]);

  useEffect(() => {
    geometriesRef.current = geometries;
  }, [geometries]);

  useEffect(() => {
    resizeRequestsRef.current = resizeRequests;
  }, [resizeRequests]);

  useEffect(() => {
    preShrinkGeometriesRef.current = preShrinkGeometries;
  }, [preShrinkGeometries]);

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
      const next = { ...prev, [id]: { id, minimized: false, maximized: false, isSnapped: false, zIndex: maxZ + 1 } };

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
    geometriesRef.current = { ...geometriesRef.current, [id]: geometry };
    setGeometries((prev) => ({ ...prev, [id]: geometry }));
  }, []);

  const getAllGeometries = useCallback(() => ({ ...geometries }), [geometries]);

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

  const setWindowSnapped = useCallback((id: string, isSnapped: boolean) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      if (prev[id].isSnapped === isSnapped) return prev;

      return { ...prev, [id]: { ...prev[id], isSnapped } };
    });
  }, []);

  const requestResize = useCallback((id: string, rect: ResizeRequest) => {
    const existingResizeRequest = resizeRequestsRef.current[id];
    const existingPreShrinkGeometry = preShrinkGeometriesRef.current[id];

    if (
      existingResizeRequest
      && existingPreShrinkGeometry
      && existingResizeRequest.x === rect.x
      && existingResizeRequest.y === rect.y
      && existingResizeRequest.width === rect.width
      && existingResizeRequest.height === rect.height
    ) {
      return;
    }

    setResizeRequests((prev) => {
      const existing = prev[id];
      if (
        existing
        && existing.x === rect.x
        && existing.y === rect.y
        && existing.width === rect.width
        && existing.height === rect.height
      ) {
        return prev;
      }

      const next = { ...prev, [id]: rect };
      resizeRequestsRef.current = next;
      return next;
    });
    setPreShrinkGeometries((prev) => {
      if (prev[id]) return prev;

      const currentGeometry = geometriesRef.current[id];
      if (!currentGeometry) return prev;

      const next = { ...prev, [id]: currentGeometry };
      preShrinkGeometriesRef.current = next;
      return next;
    });
  }, []);

  const clearResizeRequest = useCallback((id: string) => {
    setResizeRequests((prev) => {
      if (!prev[id]) return prev;

      const next = { ...prev };
      delete next[id];
      resizeRequestsRef.current = next;
      return next;
    });
  }, []);

  const restoreShrink = useCallback((id: string) => {
    const preShrinkGeometry = preShrinkGeometriesRef.current[id];
    if (!preShrinkGeometry) return;

    requestResize(id, preShrinkGeometry);

    setPreShrinkGeometries((prev) => {
      if (!prev[id]) return prev;

      const next = { ...prev };
      delete next[id];
      preShrinkGeometriesRef.current = next;
      return next;
    });
  }, [requestResize]);

  return {
    windows,
    activeWindowId,
    geometries,
    moveRequests,
    resizeRequests,
    preShrinkGeometries,
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
    requestResize,
    clearResizeRequest,
    restoreShrink,
    setWindowSnapped,
  };
}
