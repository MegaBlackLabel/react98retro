import { createContext, useContext } from 'react';
import type { UseWindowManagerResult } from '../../hooks/useWindowManager';

export type WindowManagerContextValue = UseWindowManagerResult;

export const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);
WindowManagerContext.displayName = 'WindowManagerContext';

export function useWindowManagerContext() {
  return useContext(WindowManagerContext);
}
