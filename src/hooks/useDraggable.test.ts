import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDraggable } from './useDraggable';

function createPointerEvent(type: string, init: PointerEventInit) {
  return new PointerEvent(type, init);
}

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

  it('captures the pointer on pointerdown', () => {
    const { result, unmount } = renderHook(() => useDraggable());

    const currentTarget = document.createElement('div');
    currentTarget.setPointerCapture = vi.fn();
    currentTarget.releasePointerCapture = vi.fn();

    act(() => {
      result.current.dragHandleProps.onPointerDown({
        clientX: 10,
        clientY: 10,
        pointerId: 1,
        target: document.createElement('div'),
        currentTarget,
      } as unknown as React.PointerEvent);
    });

    expect(currentTarget.setPointerCapture).toHaveBeenCalledWith(1);
    unmount();
  });

  describe('snap behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('sets snapTarget when pointer moves into a snap zone', () => {
      const { result, unmount } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 240, pointerId: 1 }));
      });

      expect((result.current as { snapTarget: unknown }).snapTarget).toEqual({
        x: 0,
        y: 0,
        width: 400,
        height: 600,
        zone: 'left',
      });

      unmount();
    });

    it('clears snapTarget when pointer returns to the center', () => {
      const { result, unmount } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 240, pointerId: 1 }));
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 400, clientY: 300, pointerId: 1 }));
      });

      expect((result.current as { snapTarget: unknown }).snapTarget).toBeNull();
      unmount();
    });

    it('calls onSnapCommit once on pointerup when snap target exists', () => {
      const onSnapCommit = vi.fn();
      const { result } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
          onSnapCommit,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 240, pointerId: 1 }));
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 5, clientY: 240, pointerId: 1 }));
      });

      expect(onSnapCommit).toHaveBeenCalledTimes(1);
      expect(onSnapCommit).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        width: 400,
        height: 600,
        zone: 'left',
      });
      expect((result.current as { snapTarget: unknown }).snapTarget).toBeNull();
    });

    it('does not call onSnapCommit when snapEnabled is false', () => {
      const onSnapCommit = vi.fn();
      const { result } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: false,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
          onSnapCommit,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 240, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 5, clientY: 240, pointerId: 1 }));
      });

      expect(onSnapCommit).not.toHaveBeenCalled();
      expect((result.current as { snapTarget: unknown }).snapTarget).toBeNull();
    });

    it('continues to update drag position during pointermove', () => {
      const { result, unmount } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 130, clientY: 145, pointerId: 1 }));
      });

      expect(result.current.position).toEqual({ x: 130, y: 145 });
      unmount();
    });

    it('stops updating snap state and position after pointerup', () => {
      const onSnapCommit = vi.fn();
      const { result } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
          onSnapCommit,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 240, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 5, clientY: 240, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 400, clientY: 300, pointerId: 1 }));
      });

      expect(onSnapCommit).toHaveBeenCalledTimes(1);
      expect((result.current as { snapTarget: unknown }).snapTarget).toBeNull();
      expect(result.current.position).toEqual({ x: 5, y: 240 });
    });

    it('cleans up drag state on pointercancel', () => {
      const onRemoveEventListener = vi.spyOn(window, 'removeEventListener');
      const { result } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      act(() => {
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 240, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointercancel', { clientX: 5, clientY: 240, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 400, clientY: 300, pointerId: 1 }));
      });

      expect(currentTarget.releasePointerCapture).toHaveBeenCalledWith(1);
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
      expect((result.current as { snapTarget: unknown }).snapTarget).toBeNull();
      expect(result.current.position).toEqual({ x: 5, y: 240 });
    });

    it('cleans up drag state when the hook unmounts during dragging', () => {
      const onRemoveEventListener = vi.spyOn(window, 'removeEventListener');
      const { result, unmount } = renderHook(() =>
        useDraggable({
          initialX: 100,
          initialY: 100,
          bounds: { width: 200, height: 150 },
          snapEnabled: true,
          snapThreshold: 20,
          minWidth: 200,
          minHeight: 100,
        }),
      );

      const currentTarget = document.createElement('div');
      currentTarget.setPointerCapture = vi.fn();
      currentTarget.releasePointerCapture = vi.fn();

      act(() => {
        result.current.dragHandleProps.onPointerDown({
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          target: document.createElement('div'),
          currentTarget,
        } as unknown as React.PointerEvent);
      });

      unmount();

      expect(currentTarget.releasePointerCapture).toHaveBeenCalledWith(1);
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
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
