import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Rect } from './collision';
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
    expect(result.current.windows['win1'].isSnapped).toBe(false);
  });

  it('setWindowSnapped updates snapped state for an existing window', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      (result.current as typeof result.current & {
        setWindowSnapped: (id: string, isSnapped: boolean) => void;
      }).setWindowSnapped('win1', true);
    });

    expect(result.current.windows['win1'].isSnapped).toBe(true);

    act(() => {
      (result.current as typeof result.current & {
        setWindowSnapped: (id: string, isSnapped: boolean) => void;
      }).setWindowSnapped('win1', false);
    });

    expect(result.current.windows['win1'].isSnapped).toBe(false);
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

  it('register adds a new window dynamically', () => {
    const { result } = renderHook(() => useWindowManager());
    act(() => {
      result.current.register('win1');
    });
    expect(result.current.windows['win1']).toBeDefined();
    expect(result.current.windows['win1'].minimized).toBe(false);
    expect(result.current.windows['win1'].maximized).toBe(false);
    expect(result.current.windows['win1'].isSnapped).toBe(false);
    expect(result.current.windows['win1'].zIndex).toBe(1);
  });

  it('keeps the active window above newly registered inactive windows', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.focus('win1');
    });

    act(() => {
      result.current.register('win2');
    });

    expect(result.current.activeWindowId).toBe('win1');
    expect(result.current.windows['win1'].zIndex).toBeGreaterThan(result.current.windows['win2'].zIndex);
  });

  it('unregister removes a window', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    act(() => {
      result.current.unregister('win1');
    });
    expect(result.current.windows['win1']).toBeUndefined();
    expect(result.current.windows['win2']).toBeDefined();
  });

  it('focus sets activeWindowId', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    act(() => {
      result.current.focus('win1');
    });
    expect(result.current.activeWindowId).toBe('win1');
  });

  it('isActive returns true for focused window', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    act(() => {
      result.current.focus('win1');
    });
    expect(result.current.isActive('win1')).toBe(true);
  });

  it('isActive returns false for unfocused window', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));
    act(() => {
      result.current.focus('win1');
    });
    expect(result.current.isActive('win2')).toBe(false);
  });

  it('works without initial windowIds (optional parameter)', () => {
    const { result } = renderHook(() => useWindowManager());
    expect(result.current.windows).toEqual({});
    act(() => {
      result.current.register('win1');
    });
    expect(result.current.windows['win1']).toBeDefined();
  });

  it('defaults autoMoveOnSnap to false', () => {
    const { result } = renderHook(() => useWindowManager());
    expect(result.current.autoMoveOnSnap).toBe(false);
  });

  it('returns configured autoMoveOnSnap value', () => {
    const { result } = renderHook(() => useWindowManager([], true));
    expect(result.current.autoMoveOnSnap).toBe(true);
  });

  it('updateGeometry stores geometry correctly', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
    });

    expect(result.current.geometries['win1']).toEqual({ x: 10, y: 20, width: 320, height: 240 });
  });

  it('getAllGeometries returns all stored geometries', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
      result.current.updateGeometry('win2', { x: 400, y: 60, width: 200, height: 180 });
    });

    expect(result.current.getAllGeometries()).toEqual({
      win1: { x: 10, y: 20, width: 320, height: 240 },
      win2: { x: 400, y: 60, width: 200, height: 180 },
    });
  });

  it('getAllGeometries returns a copy so callers cannot mutate internal state', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
    });

    const returnedGeometries = result.current.getAllGeometries();
    delete returnedGeometries.win1;

    expect(result.current.geometries['win1']).toEqual({ x: 10, y: 20, width: 320, height: 240 });
  });

  it('requestMove stores move request correctly', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.requestMove('win1', { x: 120, y: 80 });
    });

    expect(result.current.moveRequests['win1']).toEqual({ x: 120, y: 80 });
  });

  it('move requests can be cleared', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));

    act(() => {
      result.current.requestMove('win1', { x: 120, y: 80 });
      result.current.requestMove('win2', { x: 240, y: 160 });
    });

    act(() => {
      result.current.clearMoveRequest('win1');
    });

    expect(result.current.moveRequests).toEqual({
      win2: { x: 240, y: 160 },
    });
  });

  it('requestResize stores resize request correctly', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));
    const resizeRect: Rect = { x: 10, y: 20, width: 200, height: 120 };

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
      result.current.requestResize('win1', resizeRect);
    });

    expect(result.current.resizeRequests['win1']).toEqual(resizeRect);
  });

  it('requestResize does not rerender for duplicate resize rects', async () => {
    const renderCount = vi.fn();
    const { result } = renderHook(() => {
      renderCount();
      return useWindowManager(['win1']);
    });
    const resizeRect: Rect = { x: 10, y: 20, width: 200, height: 120 };

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    const rendersAfterFirstUpdate = renderCount.mock.calls.length;

    act(() => {
      result.current.requestResize('win1', resizeRect);
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    const rendersAfterFirstResize = renderCount.mock.calls.length;

    act(() => {
      result.current.requestResize('win1', resizeRect);
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rendersAfterFirstUpdate).toBeGreaterThanOrEqual(2);
    expect(rendersAfterFirstResize).toBeGreaterThan(rendersAfterFirstUpdate);
    expect(renderCount.mock.calls.length).toBe(rendersAfterFirstResize);
  });

  it('clearResizeRequest removes only the pending resize request', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
      result.current.updateGeometry('win2', { x: 400, y: 60, width: 260, height: 180 });
      result.current.requestResize('win1', { x: 10, y: 20, width: 200, height: 120 });
      result.current.requestResize('win2', { x: 400, y: 60, width: 220, height: 140 });
    });

    act(() => {
      result.current.clearResizeRequest('win1');
    });

    expect(result.current.resizeRequests).toEqual({
      win2: { x: 400, y: 60, width: 220, height: 140 },
    });
    expect(result.current.geometries['win1']).toEqual({ x: 10, y: 20, width: 320, height: 240 });
  });

  it('repeated shrink resize requests reuse the original pre-shrink geometry', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
      result.current.requestResize('win1', { x: 10, y: 20, width: 220, height: 240 });
    });

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 220, height: 240 });
      result.current.requestResize('win1', { x: 10, y: 20, width: 200, height: 240 });
    });

    act(() => {
      result.current.restoreShrink('win1');
    });

    expect(result.current.geometries['win1']).toEqual({ x: 10, y: 20, width: 220, height: 240 });
    expect(result.current.resizeRequests['win1']).toEqual({ x: 10, y: 20, width: 320, height: 240 });
    expect(result.current.preShrinkGeometries['win1']).toBeUndefined();
  });

  it('restoreShrink emits a resize request for the pre-shrink geometry and clears stored shrink state', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 320, height: 240 });
      result.current.requestResize('win1', { x: 10, y: 20, width: 220, height: 240 });
    });

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 220, height: 240 });
      result.current.restoreShrink('win1');
    });

    expect(result.current.geometries['win1']).toEqual({ x: 10, y: 20, width: 220, height: 240 });
    expect(result.current.resizeRequests['win1']).toEqual({ x: 10, y: 20, width: 320, height: 240 });
    expect(result.current.preShrinkGeometries['win1']).toBeUndefined();
  });

  it('restoreShrink is a no-op when no pre-shrink geometry exists', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.updateGeometry('win1', { x: 10, y: 20, width: 220, height: 240 });
      result.current.restoreShrink('win1');
    });

    expect(result.current.geometries['win1']).toEqual({ x: 10, y: 20, width: 220, height: 240 });
    expect(result.current.resizeRequests['win1']).toBeUndefined();
    expect(result.current.preShrinkGeometries['win1']).toBeUndefined();
  });
});

  describe('noop guards for non-existent windows', () => {
    it('minimize on unknown id returns state unchanged', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows;
      act(() => {
        result.current.minimize('no-such-window');
      });

      expect(result.current.windows).toBe(before);
      expect(result.current.windows['no-such-window']).toBeUndefined();
    });

    it('maximize on unknown id returns state unchanged', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows;
      act(() => {
        result.current.maximize('no-such-window');
      });

      expect(result.current.windows).toBe(before);
    });

    it('restore on unknown id returns state unchanged', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows;
      act(() => {
        result.current.restore('no-such-window');
      });

      expect(result.current.windows).toBe(before);
    });

    it('focus on unknown id returns state unchanged', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows;
      act(() => {
        result.current.focus('no-such-window');
      });

      expect(result.current.windows).toBe(before);
    });

    it('register with an already-existing id preserves the existing window', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows['win1'];
      act(() => {
        result.current.register('win1');
      });

      // Reference equality: the same window object should survive
      expect(result.current.windows['win1']).toBe(before);
    });

    it('unregister of unknown id is a no-op', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows;
      act(() => {
        result.current.unregister('no-such-window');
      });

      expect(result.current.windows).toBe(before);
      expect(result.current.windows['win1']).toBeDefined();
    });

    it('setWindowSnapped on unknown id returns state unchanged', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      const before = result.current.windows;
      act(() => {
        result.current.setWindowSnapped('no-such-window', true);
      });

      expect(result.current.windows).toBe(before);
    });

    it('setWindowSnapped with same value does not replace the window object', () => {
      const { result } = renderHook(() => useWindowManager(['win1']));

      act(() => {
        result.current.setWindowSnapped('win1', false);
      });
      const afterFirst = result.current.windows['win1'];

      act(() => {
        result.current.setWindowSnapped('win1', false);
      });

      expect(result.current.windows['win1']).toBe(afterFirst);
    });
  });

  it('minimize preserves zIndex and activeWindowId after focal sequence', () => {
    const { result } = renderHook(() => useWindowManager(['win1', 'win2']));

    act(() => {
      result.current.focus('win1');
    });
    const zIndexAfterFocus = result.current.windows['win1'].zIndex;
    expect(result.current.activeWindowId).toBe('win1');

    act(() => {
      result.current.minimize('win1');
    });
    // activeWindowId is unchanged by minimize
    expect(result.current.activeWindowId).toBe('win1');
    // zIndex is unchanged by minimize
    expect(result.current.windows['win1'].zIndex).toBe(zIndexAfterFocus);
  });

  it('minimize clears maximized flag for consistent state', () => {
    const { result } = renderHook(() => useWindowManager(['win1']));

    act(() => {
      result.current.maximize('win1');
    });
    expect(result.current.windows['win1'].maximized).toBe(true);
    expect(result.current.windows['win1'].minimized).toBe(false);

    act(() => {
      result.current.minimize('win1');
    });

    // A window cannot be both maximized and minimized — minimize must clear maximized
    expect(result.current.windows['win1'].minimized).toBe(true);
    expect(result.current.windows['win1'].maximized).toBe(false);
  });
