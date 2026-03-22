import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
