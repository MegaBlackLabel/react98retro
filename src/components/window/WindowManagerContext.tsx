import { createContext, useContext } from 'react';
import type { UseWindowManagerResult } from '../../hooks/useWindowManager';

export const WindowManagerContext = createContext<UseWindowManagerResult | null>(null);
WindowManagerContext.displayName = 'WindowManagerContext';

export function useWindowManagerContext() {
  return useContext(WindowManagerContext);
}
