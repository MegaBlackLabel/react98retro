import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
