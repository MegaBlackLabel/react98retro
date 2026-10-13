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
  const observed: Element[] = [];
  class FakeResizeObserver {
    constructor(callback: () => void) {
      callbacks.push(callback);
    }
    observe(element: Element) {
      observed.push(element);
    }
    unobserve() {}
    disconnect() {
      observed.length = 0;
    }
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  return { trigger: () => callbacks.forEach((callback) => callback()), observed };
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

  it('reserves no horizontal padding by default', () => {
    const { trigger } = stubResizeObserver();
    const { result } = renderHook(() => useToolbarRows({ count: 2, gap: 1 }));

    act(() => {
      result.current.stripRef(element(197));
      result.current.itemRefs.current[0] = element(98);
      result.current.itemRefs.current[1] = element(98);
    });
    act(() => {
      trigger();
    });

    // 98 + 1 + 98 = 197 がちょうど入る
    expect(result.current.rows).toEqual([[0, 1]]);
  });

  it('reserves the given horizontal padding', () => {
    const { trigger } = stubResizeObserver();
    const { result } = renderHook(() => useToolbarRows({ count: 2, gap: 1, paddingX: 2 }));

    act(() => {
      result.current.stripRef(element(197));
      result.current.itemRefs.current[0] = element(98);
      result.current.itemRefs.current[1] = element(98);
    });
    act(() => {
      trigger();
    });

    // 使える幅は 197 - 4 = 193
    expect(result.current.rows).toEqual([[0], [1]]);
  });

  it('never hands out indexes of items that no longer exist', () => {
    const { trigger } = stubResizeObserver();
    const seen: Array<{ count: number; rows: number[][] }> = [];
    const { result, rerender } = renderHook(
      ({ count }) => {
        const api = useToolbarRows({ count, gap: 2 });
        seen.push({ count, rows: api.rows });
        return api;
      },
      { initialProps: { count: 3 } },
    );

    act(() => {
      result.current.stripRef(element(94));
      result.current.itemRefs.current[0] = element(40);
      result.current.itemRefs.current[1] = element(40);
      result.current.itemRefs.current[2] = element(40);
    });
    act(() => {
      trigger();
    });
    expect(result.current.rows).toEqual([[0, 1], [2]]);

    // 項目が減った描画 (計測が追いつく前) にも、存在しない index を渡さない
    act(() => {
      rerender({ count: 2 });
    });

    expect(seen.every(({ count, rows }) => rows.flat().every((index) => index < count))).toBe(true);
  });

  it('returns no rows when there are no items', () => {
    const { result } = renderHook(() => useToolbarRows({ count: 0 }));

    expect(result.current.rows).toEqual([]);
  });

  it('observes the current items again after a repack', () => {
    const { trigger, observed } = stubResizeObserver();
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
    expect(result.current.rows).toEqual([[0, 1], [2]]);

    // 詰め直しで項目の DOM ノードが入れ替わる
    const fresh = [element(40), element(40), element(40)];
    act(() => {
      result.current.stripRef(element(300));
      fresh.forEach((item, index) => {
        result.current.itemRefs.current[index] = item;
      });
      trigger();
    });

    expect(result.current.rows).toEqual([[0, 1, 2]]);
    expect(observed).toContain(fresh[0]);
    expect(observed).toContain(fresh[2]);
  });
});
