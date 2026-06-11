import { describe, expect, it, vi } from 'vitest';
import { calculateEscapePosition, findCollisions, isColliding, type Rect } from './collision';

describe('isColliding', () => {
  it('returns false when rectangles do not overlap', () => {
    const first: Rect = { x: 0, y: 0, width: 100, height: 100 };
    const second: Rect = { x: 120, y: 0, width: 100, height: 100 };

    expect(isColliding(first, second)).toBe(false);
  });

  it('returns true when rectangles overlap', () => {
    const first: Rect = { x: 0, y: 0, width: 100, height: 100 };
    const second: Rect = { x: 50, y: 50, width: 100, height: 100 };

    expect(isColliding(first, second)).toBe(true);
  });

  it('returns false when rectangles only touch edges', () => {
    const first: Rect = { x: 0, y: 0, width: 100, height: 100 };
    const second: Rect = { x: 100, y: 0, width: 100, height: 100 };

    expect(isColliding(first, second)).toBe(false);
  });

  it('returns false when either rectangle has zero size', () => {
    const zeroWidth: Rect = { x: 10, y: 10, width: 0, height: 100 };
    const overlappingArea: Rect = { x: 0, y: 0, width: 100, height: 100 };

    expect(isColliding(zeroWidth, overlappingArea)).toBe(false);
  });

  it('returns true when overlapping rectangles use negative coordinates', () => {
    const first: Rect = { x: -40, y: -20, width: 100, height: 100 };
    const second: Rect = { x: 20, y: 20, width: 100, height: 100 };

    expect(isColliding(first, second)).toBe(true);
  });
});

describe('calculateEscapePosition', () => {
  it('moves the other window to the right side of the snapped window with an 8px gap', () => {
    const snapWindow: Rect = { x: 0, y: 0, width: 400, height: 300 };
    const otherWindow: Rect = { x: 300, y: 100, width: 300, height: 200 };

    expect(calculateEscapePosition(snapWindow, otherWindow)).toEqual({ x: 408, y: 100 });
  });

  it('moves the other window below when moving right would leave the viewport', () => {
    vi.stubGlobal('innerWidth', 700);
    vi.stubGlobal('innerHeight', 768);

    const snapWindow: Rect = { x: 350, y: 0, width: 300, height: 300 };
    const otherWindow: Rect = { x: 400, y: 100, width: 200, height: 160 };

    expect(calculateEscapePosition(snapWindow, otherWindow)).toEqual({ x: 400, y: 308 });

    vi.unstubAllGlobals();
  });

  it('moves the other window left when right and below would leave the viewport', () => {
    vi.stubGlobal('innerWidth', 700);
    vi.stubGlobal('innerHeight', 500);

    const snapWindow: Rect = { x: 350, y: 260, width: 300, height: 220 };
    const otherWindow: Rect = { x: 400, y: 300, width: 200, height: 160 };

    expect(calculateEscapePosition(snapWindow, otherWindow)).toEqual({ x: 142, y: 300 });

    vi.unstubAllGlobals();
  });

  it('moves the other window up when right, below, and left would leave the viewport', () => {
    vi.stubGlobal('innerWidth', 500);
    vi.stubGlobal('innerHeight', 500);

    const snapWindow: Rect = { x: 40, y: 260, width: 440, height: 220 };
    const otherWindow: Rect = { x: 80, y: 300, width: 200, height: 160 };

    expect(calculateEscapePosition(snapWindow, otherWindow)).toEqual({ x: 80, y: 92 });

    vi.unstubAllGlobals();
  });

  it('keeps the escape position inside the viewport when every side is constrained', () => {
    vi.stubGlobal('innerWidth', 300);
    vi.stubGlobal('innerHeight', 220);

    const snapWindow: Rect = { x: 0, y: 0, width: 300, height: 220 };
    const otherWindow: Rect = { x: -40, y: -20, width: 260, height: 180 };

    expect(calculateEscapePosition(snapWindow, otherWindow)).toEqual({ x: 0, y: 0 });

    vi.unstubAllGlobals();
  });
});

describe('findCollisions', () => {
  it('finds all colliding windows and returns their escape positions', () => {
    const snapped: Rect = { x: 0, y: 0, width: 400, height: 300 };
    const geometries: Record<string, Rect> = {
      documents: { x: 300, y: 100, width: 300, height: 200 },
      pictures: { x: 20, y: 250, width: 160, height: 100 },
      music: { x: 500, y: 350, width: 120, height: 120 },
    };

    expect(findCollisions(snapped, geometries)).toEqual([
      { id: 'documents', escapePosition: { x: 408, y: 100 } },
      { id: 'pictures', escapePosition: { x: 408, y: 250 } },
    ]);
  });
});
