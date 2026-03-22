import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useWindowManager } from './useWindowManager';

describe('useWindowManager', () => {
  it('initializes windows from provided ids', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    expect(result.current.windows['win1']).toBeDefined();
    expect(result.current.windows['win2']).toBeDefined();
  });

  it('initializes windows with correct default state', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));
    expect(result.current.windows['win1'].minimized).toBe(false);
    expect(result.current.windows['win1'].maximized).toBe(false);
  });

  it('focus brings window to highest z-index', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    act(() => {
      result.current.focus('win1');
    });
    const { win1, win2 } = result.current.windows;
    expect(win1.zIndex).toBeGreaterThan(win2.zIndex);
  });

  it('minimize sets minimized=true', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));
    act(() => {
      result.current.minimize('win1');
    });
    expect(result.current.windows['win1'].minimized).toBe(true);
  });

  it('maximize sets maximized=true and minimized=false', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));
    act(() => {
      result.current.minimize('win1');
      result.current.maximize('win1');
    });
    expect(result.current.windows['win1'].maximized).toBe(true);
    expect(result.current.windows['win1'].minimized).toBe(false);
  });

  it('restore sets minimized=false and maximized=false', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));
    act(() => {
      result.current.maximize('win1');
      result.current.restore('win1');
    });
    expect(result.current.windows['win1'].minimized).toBe(false);
    expect(result.current.windows['win1'].maximized).toBe(false);
  });

  it('close removes window from state', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    act(() => {
      result.current.close('win1');
    });
    expect(result.current.windows['win1']).toBeUndefined();
    expect(result.current.windows['win2']).toBeDefined();
  });
});
