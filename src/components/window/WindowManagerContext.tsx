import { createContext, useContext } from 'react';
import type { UseWindowManagerResult } from '../../hooks/useWindowManager';

export interface WindowManagerContextValue extends UseWindowManagerResult {
  /** True when the viewport is mobile-sized (< 640px). Provided by Win98Provider. */
  isMobile: boolean;
}

export const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);
WindowManagerContext.displayName = 'WindowManagerContext';

export function useWindowManagerContext(): WindowManagerContextValue | null {
  return useContext(WindowManagerContext);
}

/** Convenience: returns isMobile from the nearest Win98Provider, or false if none. */
export function useIsMobile(): boolean {
  return useContext(WindowManagerContext)?.isMobile ?? false;
}
