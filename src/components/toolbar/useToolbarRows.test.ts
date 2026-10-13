import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { packToolbarRows, useToolbarRows } from './useToolbarRows';

/** getBoundingClientRect だけ持つ偽の要素。 */
function element(width: number): HTMLElement {
  return { getBoundingClientRect: () => ({ width }) } as unknown as HTMLElement;
}

/** ResizeObserver を差し替えて、監視のコールバックを手で叩けるようにする。 */
function stubResizeObserver() {
  const callbacks: Array<() => void> = [];
  class FakeResizeObserver {
    constructor(callback: () => void) {
      callbacks.push(callback);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  return { trigger: () => callbacks.forEach((callback) => callback()) };
}

describe('packToolbarRows', () => {
  it('keeps items on one row while they fit', () => {
    expect(packToolbarRows([10, 10, 10], 100, { gap: 2 })).toEqual([[0, 1, 2]]);
  });

  it('moves a whole item to the next row instead of splitting it', () => {
    expect(packToolbarRows([40, 40, 40], 90, { gap: 2 })).toEqual([[0, 1], [2]]);
  });

  it('counts the gap between items only', () => {
    expect(packToolbarRows([40, 48], 90, { gap: 2 })).toEqual([[0, 1]]);
    expect(packToolbarRows([40, 49], 90, { gap: 2 })).toEqual([[0], [1]]);
  });

  it('uses 1px between items by default', () => {
    expect(packToolbarRows([40, 50], 90)).toEqual([[0], [1]]);
    expect(packToolbarRows([40, 49], 90)).toEqual([[0, 1]]);
  });

  it('does not leave a keepWithNext item at the end of a row', () => {
    // 40 + 2 + 40 = 82 は入るが、続く 40 が入らないので 0 は段の末尾に残さない
    expect(packToolbarRows([40, 40, 10], 85, { gap: 2, keepWithNext: [true, false, false] })).toEqual([
      [0, 1],
      [2],
    ]);
  });

  it('keeps the pair together when the follower fits', () => {
    expect(packToolbarRows([40, 40, 10], 100, { gap: 2, keepWithNext: [true, false, false] })).toEqual([
      [0, 1, 2],
    ]);
  });
});

describe('useToolbarRows', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns one row before anything is measured', () => {
    const { result } = renderHook(() => useToolbarRows({ count: 3 }));

    expect(result.current.rows).toEqual([[0, 1, 2]]);
  });

  it('packs rows from the measured widths', () => {
    const { trigger } = stubResizeObserver();
    const { result } = renderHook(() => useToolbarRows({ count: 3, gap: 2 }));

    act(() => {
      result.current.stripRef(element(94));
      result.current.itemRefs.current[0] = element(40);
      result.current.itemRefs.current[1] = element(40);
      result.current.itemRefs.current[2] = element(40);
    });
    act(() => {
      trigger();
    });

    // 使える幅 = 94 - 左右 2px × 2 = 90
    expect(result.current.rows).toEqual([[0, 1], [2]]);
  });

  it('keeps the previous rows when the measurement does not change', () => {
    const { trigger } = stubResizeObserver();
    const { result } = renderHook(() => useToolbarRows({ count: 2, gap: 2 }));

    act(() => {
      result.current.stripRef(element(90));
      result.current.itemRefs.current[0] = element(40);
      result.current.itemRefs.current[1] = element(40);
    });
    act(() => {
      trigger();
    });
    const first = result.current.rows;

    act(() => {
      trigger();
    });

    expect(result.current.rows).toBe(first);
  });

  it('stays on one row when the width cannot be measured', () => {
    const { trigger } = stubResizeObserver();
    const { result } = renderHook(() => useToolbarRows({ count: 2 }));

    act(() => {
      result.current.stripRef(element(0));
      result.current.itemRefs.current[0] = element(0);
      result.current.itemRefs.current[1] = element(0);
    });
    act(() => {
      trigger();
    });

    expect(result.current.rows).toEqual([[0, 1]]);
  });
});
