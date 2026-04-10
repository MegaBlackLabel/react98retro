import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDraggable } from './useDraggable';

describe('useDraggable', () => {
  it('returns default initial position', () => {
    const { result } = renderHook(() => useDraggable());
    expect(result.current.position).toEqual({ x: 50, y: 50 });
  });

  it('returns custom initial position', () => {
    const { result } = renderHook(() => useDraggable({ initialX: 100, initialY: 200 }));
    expect(result.current.position).toEqual({ x: 100, y: 200 });
  });

  it('setPosition updates position', () => {
    const { result } = renderHook(() => useDraggable({ initialX: 0, initialY: 0 }));
    act(() => {
      result.current.setPosition({ x: 300, y: 400 });
    });
    expect(result.current.position).toEqual({ x: 300, y: 400 });
  });

  it('exposes dragHandleProps with onPointerDown', () => {
    const { result } = renderHook(() => useDraggable());
    expect(typeof result.current.dragHandleProps.onPointerDown).toBe('function');
  });

  describe('viewport clamping', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('clamps initial position to viewport bounds when bounds provided', () => {
      const { result } = renderHook(() =>
        useDraggable({
          initialX: 1000,
          initialY: 800,
          bounds: { width: 400, height: 300 },
        }),
      );
      // Should be clamped to viewport - window size
      expect(result.current.position.x).toBeLessThanOrEqual(400);
      expect(result.current.position.y).toBeLessThanOrEqual(300);
    });

    it('keeps window within viewport during drag', () => {
      const { result } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
        }),
      );

      act(() => {
        result.current.setPosition({ x: 700, y: 500 });
      });

      expect(result.current.position.x).toBeLessThanOrEqual(600);
      expect(result.current.position.y).toBeLessThanOrEqual(450);
    });
  });
});
