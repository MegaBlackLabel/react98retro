import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the hooks to verify they're called with correct arguments
const mockUseResizable = vi.fn();
const mockUseDraggable = vi.fn();

vi.mock('../../hooks/useResizable', () => ({
  useResizable: (...args: unknown[]) => mockUseResizable(...args),
}));

vi.mock('../../hooks/useDraggable', () => ({
  useDraggable: (...args: unknown[]) => mockUseDraggable(...args),
}));

import { Window } from './Window';

describe('Window hook wiring', () => {
  beforeEach(() => {
    mockUseResizable.mockReturnValue({
      size: { width: 400, height: 300 },
      position: { x: 50, y: 50 },
      getResizeHandleProps: vi.fn(() => ({ style: {}, onPointerDown: vi.fn() })),
    });
    mockUseDraggable.mockReturnValue({
      position: { x: 50, y: 50 },
      setPosition: vi.fn(),
      dragHandleProps: { onPointerDown: vi.fn() },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls useResizable before useDraggable so live size is available for drag bounds', () => {
    render(<Window title="Test" width={400} height={300} initialX={50} initialY={50} />);

    // Verify useResizable was called with correct options
    const resizableCall = mockUseResizable.mock.calls[0][0];
    expect(resizableCall).toMatchObject({
      minWidth: 200,
      minHeight: 100,
      clampToViewport: true,
      reconcileOnResize: true,
    });
  });

  it('passes live size from useResizable to useDraggable bounds', () => {
    // Set up useResizable to return a specific size
    mockUseResizable.mockReturnValue({
      size: { width: 500, height: 400 },
      position: { x: 100, y: 100 },
      getResizeHandleProps: vi.fn(() => ({ style: {}, onPointerDown: vi.fn() })),
    });

    render(<Window title="Test" width={400} height={300} initialX={50} initialY={50} />);

    // Verify useDraggable was called with bounds using the LIVE size from useResizable
    const draggableCall = mockUseDraggable.mock.calls[0][0];
    expect(draggableCall.bounds).toEqual({ width: 500, height: 400 });
  });

  it('updates drag bounds when size changes after resize', () => {
    // First render with initial size
    mockUseResizable.mockReturnValue({
      size: { width: 400, height: 300 },
      position: { x: 50, y: 50 },
      getResizeHandleProps: vi.fn(() => ({ style: {}, onPointerDown: vi.fn() })),
    });

    const { rerender } = render(<Window title="Test" width={400} height={300} />);

    // Verify initial bounds
    expect(mockUseDraggable.mock.calls[0][0].bounds).toEqual({ width: 400, height: 300 });

    // Simulate resize by updating useResizable return value
    mockUseResizable.mockReturnValue({
      size: { width: 600, height: 450 },
      position: { x: 50, y: 50 },
      getResizeHandleProps: vi.fn(() => ({ style: {}, onPointerDown: vi.fn() })),
    });

    // Re-render to pick up new size
    rerender(<Window title="Test" width={400} height={300} />);

    // Verify updated bounds reflect the new size
    const lastDraggableCall = mockUseDraggable.mock.calls[mockUseDraggable.mock.calls.length - 1][0];
    expect(lastDraggableCall.bounds).toEqual({ width: 600, height: 450 });
  });
});
