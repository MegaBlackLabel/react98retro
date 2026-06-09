import { describe, it, expect } from 'vitest';
import { getSnapTarget } from './snap';

describe('getSnapTarget', () => {
  const viewportWidth = 1024;
  const viewportHeight = 768;
  const threshold = 20;
  const minWidth = 200;
  const minHeight = 100;

  it('returns left snap target near the left edge', () => {
    expect(
      getSnapTarget({
        pointerX: 10,
        pointerY: 300,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 0, width: 512, height: 768, zone: 'left' });
  });

  it('returns right snap target near the right edge', () => {
    expect(
      getSnapTarget({
        pointerX: 1014,
        pointerY: 300,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 512, y: 0, width: 512, height: 768, zone: 'right' });
  });

  it('returns top snap target near the top edge', () => {
    expect(
      getSnapTarget({
        pointerX: 500,
        pointerY: 10,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 0, width: 1024, height: 384, zone: 'top' });
  });

  it('returns bottom snap target near the bottom edge', () => {
    expect(
      getSnapTarget({
        pointerX: 500,
        pointerY: 758,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 384, width: 1024, height: 384, zone: 'bottom' });
  });

  it('returns top-left snap target near the top-left corner', () => {
    expect(
      getSnapTarget({
        pointerX: 10,
        pointerY: 10,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 0, width: 512, height: 384, zone: 'top-left' });
  });

  it('returns top-right snap target near the top-right corner', () => {
    expect(
      getSnapTarget({
        pointerX: 1014,
        pointerY: 10,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 512, y: 0, width: 512, height: 384, zone: 'top-right' });
  });

  it('returns bottom-left snap target near the bottom-left corner', () => {
    expect(
      getSnapTarget({
        pointerX: 10,
        pointerY: 758,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 384, width: 512, height: 384, zone: 'bottom-left' });
  });

  it('returns bottom-right snap target near the bottom-right corner', () => {
    expect(
      getSnapTarget({
        pointerX: 1014,
        pointerY: 758,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 512, y: 384, width: 512, height: 384, zone: 'bottom-right' });
  });

  it('returns null for a center pointer', () => {
    expect(
      getSnapTarget({
        pointerX: 500,
        pointerY: 500,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toBeNull();
  });

  it('returns null when pointer is threshold plus one away from an edge', () => {
    expect(
      getSnapTarget({
        pointerX: threshold + 1,
        pointerY: 300,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toBeNull();
  });

  it('prefers the corner zone when pointer is within both thresholds', () => {
    expect(
      getSnapTarget({
        pointerX: 10,
        pointerY: 10,
        viewportWidth,
        viewportHeight,
        threshold,
        minWidth,
        minHeight,
      })?.zone,
    ).toBe('top-left');
  });

  it('returns null when the viewport is too small for the minimum dimensions', () => {
    expect(
      getSnapTarget({
        pointerX: 10,
        pointerY: 10,
        viewportWidth: 300,
        viewportHeight: 150,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toBeNull();
  });

  it('splits odd viewport sizes without leaving a 1px gap', () => {
    const oddViewportWidth = 1023;
    const oddViewportHeight = 767;

    expect(
      getSnapTarget({
        pointerX: 10,
        pointerY: 300,
        viewportWidth: oddViewportWidth,
        viewportHeight: oddViewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 0, width: 511, height: 767, zone: 'left' });

    expect(
      getSnapTarget({
        pointerX: oddViewportWidth - 10,
        pointerY: 300,
        viewportWidth: oddViewportWidth,
        viewportHeight: oddViewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 511, y: 0, width: 512, height: 767, zone: 'right' });

    expect(
      getSnapTarget({
        pointerX: 500,
        pointerY: 10,
        viewportWidth: oddViewportWidth,
        viewportHeight: oddViewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 0, width: 1023, height: 383, zone: 'top' });

    expect(
      getSnapTarget({
        pointerX: 500,
        pointerY: oddViewportHeight - 10,
        viewportWidth: oddViewportWidth,
        viewportHeight: oddViewportHeight,
        threshold,
        minWidth,
        minHeight,
      }),
    ).toEqual({ x: 0, y: 383, width: 1023, height: 384, zone: 'bottom' });
  });
});
