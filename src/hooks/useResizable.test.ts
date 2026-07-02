import { act, renderHook, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useResizable } from './useResizable';
import type { ResizeDirection } from './useResizable';

function createPointerEvent(type: string, init: PointerEventInit) {
  return new PointerEvent(type, init);
}

const ALL_DIRECTIONS: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const source = readFileSync(`${process.cwd()}/src/hooks/useResizable.ts`, 'utf8');

describe('useResizable', () => {
  it('returns default initial size', () => {
    const { result } = renderHook(() => useResizable());
    expect(result.current.size).toEqual({ width: 400, height: 300 });
  });

  it('returns custom initial size', () => {
    const { result } = renderHook(() =>
      useResizable({ initialWidth: 600, initialHeight: 450 }),
    );
    expect(result.current.size).toEqual({ width: 600, height: 450 });
  });

  it('returns initial position', () => {
    const { result } = renderHook(() =>
      useResizable({ initialX: 100, initialY: 150 }),
    );
    expect(result.current.position).toEqual({ x: 100, y: 150 });
  });

  it('returns handle props for all 8 directions', () => {
    const { result } = renderHook(() => useResizable());
    for (const dir of ALL_DIRECTIONS) {
      const props = result.current.getResizeHandleProps(dir);
      expect(typeof props.onPointerDown).toBe('function');
      expect(props.style).toHaveProperty('cursor');
    }
  });

  it('handle props have correct cursors', () => {
    const { result } = renderHook(() => useResizable());
    expect(result.current.getResizeHandleProps('n').style.cursor).toBe('n-resize');
    expect(result.current.getResizeHandleProps('se').style.cursor).toBe('se-resize');
    expect(result.current.getResizeHandleProps('w').style.cursor).toBe('w-resize');
  });

  describe('synchronous ref freshness', () => {
    it('updates position and size refs during render', () => {
      expect(source).toContain('positionRef.current = position;');
      expect(source).toContain('sizeRef.current = size;');
      expect(source).not.toMatch(/useEffect\(\(\) => \{\s*positionRef\.current = position;\s*\}, \[position\]\);/);
      expect(source).not.toMatch(/useEffect\(\(\) => \{\s*sizeRef\.current = size;\s*\}, \[size\]\);/);
    });

    it('updates pointer listeners ref during render', () => {
      expect(source).toMatch(/listenersRef\.current = \{\s*move: onPointerMove,\s*up: onPointerUp,\s*\};/);
      expect(source).not.toMatch(/useEffect\(\(\) => \{\s*listenersRef\.current = \{\s*move: onPointerMove,\s*up: onPointerUp,\s*\};\s*\}, \[onPointerMove, onPointerUp\]\);/);
    });
  });

  describe('viewport clamping', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('clamps initial size to viewport when bounds enabled', () => {
      const { result } = renderHook(() =>
        useResizable({
          initialWidth: 1000,
          initialHeight: 800,
          clampToViewport: true,
        }),
      );
      // Should be clamped to viewport
      expect(result.current.size.width).toBeLessThanOrEqual(800);
      expect(result.current.size.height).toBeLessThanOrEqual(600);
    });

    it('clamps initial position to keep window in viewport', () => {
      const { result } = renderHook(() =>
        useResizable({
          initialX: 600,
          initialY: 500,
          initialWidth: 300,
          initialHeight: 200,
          clampToViewport: true,
        }),
      );
      // Window should be positioned so it fits within viewport
      expect(result.current.position.x + result.current.size.width).toBeLessThanOrEqual(800);
      expect(result.current.position.y + result.current.size.height).toBeLessThanOrEqual(600);
    });
  });

  describe('viewport resize reconciliation', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('re-clamps position when viewport shrinks and reconcileOnResize is enabled', async () => {
      // Use fully uncontrolled mode (no onPositionChange callback) to test internal state reconciliation
      const { result } = renderHook(() =>
        useResizable({
          initialX: 500,
          initialY: 400,
          initialWidth: 200,
          initialHeight: 150,
          clampToViewport: true,
          reconcileOnResize: true,
        }),
      );

      // Initial position within large viewport
      expect(result.current.position.x).toBe(500);
      expect(result.current.position.y).toBe(400);

      // Simulate viewport shrink
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for the effect to run
      await waitFor(() => {
        // Position should be reclamped to fit smaller viewport
        expect(result.current.position.x).toBeLessThanOrEqual(200);
        expect(result.current.position.y).toBeLessThanOrEqual(150);
      });
    });

    it('re-clamps size when viewport shrinks and reconcileOnResize is enabled', async () => {
      // Use fully uncontrolled mode
      const { result } = renderHook(() =>
        useResizable({
          initialWidth: 700,
          initialHeight: 500,
          clampToViewport: true,
          reconcileOnResize: true,
        }),
      );

      // Initial size within large viewport
      expect(result.current.size.width).toBe(700);
      expect(result.current.size.height).toBe(500);

      // Simulate viewport shrink
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for the effect to run
      await waitFor(() => {
        // Size should be reclamped to fit smaller viewport
        expect(result.current.size.width).toBeLessThanOrEqual(400);
        expect(result.current.size.height).toBeLessThanOrEqual(300);
      });
    });

    it('does not re-clamp when reconcileOnResize is disabled', async () => {
      const { result } = renderHook(() =>
        useResizable({
          initialX: 500,
          initialY: 400,
          initialWidth: 200,
          initialHeight: 150,
          clampToViewport: true,
          reconcileOnResize: false, // Disabled
        }),
      );

      // Initial position
      const initialX = result.current.position.x;
      const initialY = result.current.position.y;

      // Simulate viewport shrink
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Wait a bit to ensure no updates happen
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Position should NOT have changed
      expect(result.current.position.x).toBe(initialX);
      expect(result.current.position.y).toBe(initialY);
    });

    it('does not re-clamp when clampToViewport is disabled even if reconcileOnResize is enabled', async () => {
      const { result } = renderHook(() =>
        useResizable({
          initialX: 500,
          initialY: 400,
          initialWidth: 200,
          initialHeight: 150,
          clampToViewport: false, // Disabled - this should prevent reconciliation
          reconcileOnResize: true, // Enabled but will not work without clampToViewport
        }),
      );

      // Initial position
      const initialX = result.current.position.x;
      const initialY = result.current.position.y;
      const initialWidth = result.current.size.width;
      const initialHeight = result.current.size.height;

      // Simulate viewport shrink
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Wait a bit to ensure no updates happen
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Position and size should NOT have changed because clampToViewport is disabled
      expect(result.current.position.x).toBe(initialX);
      expect(result.current.position.y).toBe(initialY);
      expect(result.current.size.width).toBe(initialWidth);
      expect(result.current.size.height).toBe(initialHeight);
    });

    it('calls onPositionChange callback when viewport changes and reconcileOnResize is enabled', async () => {
      const onPositionChange = vi.fn();
      
      renderHook(() =>
        useResizable({
          initialX: 500,
          initialY: 400,
          initialWidth: 200,
          initialHeight: 150,
          clampToViewport: true,
          reconcileOnResize: true,
          onPositionChange,
        }),
      );

      // Simulate viewport shrink
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for the callback to be called
      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });

      // Verify the callback was called with reclamped values
      const lastCall = onPositionChange.mock.calls[onPositionChange.mock.calls.length - 1][0];
      expect(lastCall.x).toBeLessThanOrEqual(200);
      expect(lastCall.y).toBeLessThanOrEqual(150);
    });
  });

  describe('pointer event resize', () => {
    it('resizes width when dragging east handle', () => {
      const { result } = renderHook(() => useResizable());

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('e');
      act(() => {
        handleProps.onPointerDown({
          clientX: 400,
          clientY: 150,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      // Drag right by 100px — width should increase by 100
      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 500, clientY: 150, pointerId: 1 }));
      });

      expect(result.current.size.width).toBe(500);
      // Height unchanged for pure 'e' direction
      expect(result.current.size.height).toBe(300);

      act(() => {
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 500, clientY: 150, pointerId: 1 }));
      });

      expect(currentTarget.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('resizes width and height when dragging south-east corner', () => {
      const { result } = renderHook(() => useResizable());

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('se');
      act(() => {
        handleProps.onPointerDown({
          clientX: 400,
          clientY: 300,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      // Drag diagonally: +120 width, +80 height
      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 520, clientY: 380, pointerId: 1 }));
      });

      expect(result.current.size.width).toBe(520);
      expect(result.current.size.height).toBe(380);

      act(() => {
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 520, clientY: 380, pointerId: 1 }));
      });

      expect(currentTarget.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('respects minWidth and minHeight during resize', () => {
      const { result } = renderHook(() =>
        useResizable({ minWidth: 250, minHeight: 150 }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('se');
      act(() => {
        handleProps.onPointerDown({
          clientX: 400,
          clientY: 300,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      // Drag inward past min constraints
      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 100, clientY: 100, pointerId: 1 }));
      });

      expect(result.current.size.width).toBe(250);
      expect(result.current.size.height).toBe(150);
    });

    it('clamps position during resize when clampToViewport is enabled', () => {
      // window at right edge, resize to push it out
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

      const { result } = renderHook(() =>
        useResizable({
          initialX: 200,
          initialY: 200,
          initialWidth: 400,
          initialHeight: 300,
          clampToViewport: true,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('e');
      act(() => {
        handleProps.onPointerDown({
          clientX: 600,
          clientY: 350,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      // Drag right beyond viewport boundary
      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 800, clientY: 350, pointerId: 1 }));
      });

      // Width should be clamped to viewport
      expect(result.current.size.width).toBeLessThanOrEqual(600);
    });

    it('cleans up listeners and releases capture on pointerup', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { result } = renderHook(() => useResizable());

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('e');
      act(() => {
        handleProps.onPointerDown({
          clientX: 400,
          clientY: 150,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 500, clientY: 150, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 500, clientY: 150, pointerId: 1 }));
      });

      expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(currentTarget.releasePointerCapture).toHaveBeenCalledWith(1);

      removeSpy.mockRestore();
    });

    it('ignores pointermove from a different pointerId', () => {
      const { result } = renderHook(() => useResizable());

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('e');
      act(() => {
        handleProps.onPointerDown({
          clientX: 400,
          clientY: 150,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      // Dispatch pointermove with different pointerId
      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 700, clientY: 150, pointerId: 2 }));
      });

      // Size should be unchanged because pointerId 2 is ignored
      expect(result.current.size.width).toBe(400);
    });

    it('registers pointer capture on the handle element', () => {
      const { result } = renderHook(() => useResizable());

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      const handleProps = result.current.getResizeHandleProps('e');
      act(() => {
        handleProps.onPointerDown({
          clientX: 400,
          clientY: 150,
          pointerId: 1,
          stopPropagation: vi.fn(),
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      expect(currentTarget.setPointerCapture).toHaveBeenCalledWith(1);
    });
  });
});
