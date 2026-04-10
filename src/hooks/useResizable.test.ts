import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useResizable } from './useResizable';
import type { ResizeDirection } from './useResizable';

const ALL_DIRECTIONS: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

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
      window.dispatchEvent(new Event('resize'));

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
      window.dispatchEvent(new Event('resize'));

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
      window.dispatchEvent(new Event('resize'));

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
      window.dispatchEvent(new Event('resize'));

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
      window.dispatchEvent(new Event('resize'));

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
});
