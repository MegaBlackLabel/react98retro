import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveToolbarDropIndex, useToolbarReorder } from './useToolbarReorder';

/** 幅 20 の項目が 2px 間隔で並んでいる想定。 */
const RECTS = [
  { left: 0, right: 20, top: 0, bottom: 22 },
  { left: 22, right: 42, top: 0, bottom: 22 },
  { left: 44, right: 64, top: 0, bottom: 22 },
];

describe('resolveToolbarDropIndex', () => {
  it('keeps the index when the pointer stays over the dragged item', () => {
    expect(resolveToolbarDropIndex({ x: 10, y: 0 }, RECTS, 0)).toBe(0);
    expect(resolveToolbarDropIndex({ x: 32, y: 0 }, RECTS, 1)).toBe(1);
  });

  it('moves right when the pointer passes the next item center', () => {
    // 0 番をドラッグ中。他 (center 32, 54) のうち 35 より左は 1 個
    expect(resolveToolbarDropIndex({ x: 35, y: 0 }, RECTS, 0)).toBe(1);
    expect(resolveToolbarDropIndex({ x: 58, y: 0 }, RECTS, 0)).toBe(2);
  });

  it('moves left when the pointer passes the previous item center', () => {
    // 2 番をドラッグ中。他 (center 10, 32) のうち 8 より左は 0 個
    expect(resolveToolbarDropIndex({ x: 8, y: 0 }, RECTS, 2)).toBe(0);
    expect(resolveToolbarDropIndex({ x: 28, y: 0 }, RECTS, 2)).toBe(1);
  });

  it('ignores the dragged item itself', () => {
    // 1 番をドラッグ中に自分の上にいても動かない
    expect(resolveToolbarDropIndex({ x: 32, y: 0 }, RECTS, 1)).toBe(1);
    // 0 番をドラッグ中、1 番の中心を越えても 1 番の位置まで
    expect(resolveToolbarDropIndex({ x: 33, y: 0 }, RECTS, 0)).toBe(1);
  });


  it('uses the visual position of every item in the row', () => {
    // 58 は全部の中心より右 -> 末尾へ
    expect(resolveToolbarDropIndex({ x: 58, y: 0 }, RECTS, 0)).toBe(2);
    // 8 はどの中心よりも左 -> 先頭のまま
    expect(resolveToolbarDropIndex({ x: 8, y: 0 }, RECTS, 0)).toBe(0);
    // 33 は 1 番の中心 (32) の右、2 番の中心 (54) の左 -> 1 番の次
    expect(resolveToolbarDropIndex({ x: 33, y: 0 }, RECTS, 0)).toBe(1);
  });


  it('can move to another row when allowCrossRow is set', () => {
    // 1 段目に 0,1,2 (top 0)、2 段目に 3,4 (top 24)
    const twoRows = [
      { left: 0, right: 20, top: 0, bottom: 22 },
      { left: 22, right: 42, top: 0, bottom: 22 },
      { left: 44, right: 64, top: 0, bottom: 22 },
      { left: 0, right: 20, top: 24, bottom: 46 },
      { left: 22, right: 42, top: 24, bottom: 46 },
    ];
    // 返す index は「from を取り除いた後の配列」での位置
    // (呼ぶ側は next.splice(to, 0, next.splice(from, 1)[0]) で並べ替える)
    // 2 段目の真ん中 (y=35) へドロップ -> 2 段目の 2 番目のスロット
    expect(
      resolveToolbarDropIndex({ x: 30, y: 35 }, twoRows, 0, { allowCrossRow: true }),
    ).toBe(3);
    // 2 段目の左端 = 2 段目の先頭 (3 の直前) -> 取り除いた後では index 2
    expect(
      resolveToolbarDropIndex({ x: 2, y: 35 }, twoRows, 0, { allowCrossRow: true }),
    ).toBe(2);
  });

  it('stays in its own row when allowCrossRow is not set', () => {
    const twoRows = [
      { left: 0, right: 20, top: 0, bottom: 22 },
      { left: 22, right: 42, top: 0, bottom: 22 },
      { left: 44, right: 64, top: 0, bottom: 22 },
      { left: 0, right: 20, top: 24, bottom: 46 },
      { left: 22, right: 42, top: 24, bottom: 46 },
    ];
    // 既定 (allowCrossRow なし) では 1 段目の中に収まる
    expect(resolveToolbarDropIndex({ x: 999, y: 35 }, twoRows, 0)).toBe(2);
  });

  it('pushes a non-movable item when another item is inserted before it', () => {
    // 動かせない項目は「掴めない」だけで、挿入で位置はずれる (rebar と同じ)
    const twoRows = [
      { left: 0, right: 20, top: 0, bottom: 22 },
      { left: 22, right: 42, top: 0, bottom: 22 },
      { left: 0, right: 20, top: 24, bottom: 46 },
    ];
    // 2 段目の (動かせない) 項目の手前へ -> 取り除いた後では index 1
    expect(resolveToolbarDropIndex({ x: 5, y: 35 }, twoRows, 0, { allowCrossRow: true })).toBe(1);
  });

  it('clamps to the ends', () => {
    expect(resolveToolbarDropIndex({ x: -50, y: 0 }, RECTS, 1)).toBe(0);
    expect(resolveToolbarDropIndex({ x: 999, y: 0 }, RECTS, 1)).toBe(2);
  });
});

/** getBoundingClientRect だけ持つ偽の要素。 */
function element(left: number, right: number, top = 0): HTMLElement {
  return {
    getBoundingClientRect: () => ({ left, right, width: right - left, top, bottom: top + 20, height: 20 }),
  } as unknown as HTMLElement;
}

describe('useToolbarReorder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reorders while dragging so the layout matches the drop', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useToolbarReorder({ count: 3, onReorder }));

    act(() => {
      [0, 1, 2].forEach((i) => {
        result.current.itemRefs.current[i] = element(RECTS[i].left, RECTS[i].right);
      });
    });

    act(() => {
      result.current.getHandleProps(0).onPointerDown({
        pointerId: 1,
        clientX: 10,
        currentTarget: { setPointerCapture: vi.fn() },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent);
    });
    expect(result.current.draggingIndex).toBe(0);

    // 1 番の中心 (32) を越えた時点で実際に並びが変わる (実物の rebar と同じ)
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 35, pointerId: 1 }));
    });
    expect(onReorder).toHaveBeenCalledWith(0, 1);
    // 掴んでいる項目は移動後の index を指す (呼ぶ側がその位置を装飾できる)
    expect(result.current.draggingIndex).toBe(1);
  });

  it('does not reorder again on pointerup after the live move', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useToolbarReorder({ count: 3, onReorder }));

    act(() => {
      [0, 1, 2].forEach((i) => {
        result.current.itemRefs.current[i] = element(RECTS[i].left, RECTS[i].right);
      });
    });
    act(() => {
      result.current.getHandleProps(0).onPointerDown({
        pointerId: 1,
        clientX: 10,
        currentTarget: { setPointerCapture: vi.fn() },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent);
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 35, pointerId: 1 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 35, pointerId: 1 }));
    });

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(result.current.draggingIndex).toBeNull();
  });

  it('does not call onReorder when the position does not change', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useToolbarReorder({ count: 3, onReorder }));

    act(() => {
      [0, 1, 2].forEach((i) => {
        result.current.itemRefs.current[i] = element(RECTS[i].left, RECTS[i].right);
      });
    });
    act(() => {
      result.current.getHandleProps(1).onPointerDown({
        pointerId: 1,
        clientX: 32,
        currentTarget: { setPointerCapture: vi.fn() },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent);
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 32, pointerId: 1 }));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('cancels the drag on pointercancel', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useToolbarReorder({ count: 3, onReorder }));

    act(() => {
      [0, 1, 2].forEach((i) => {
        result.current.itemRefs.current[i] = element(RECTS[i].left, RECTS[i].right);
      });
    });
    act(() => {
      result.current.getHandleProps(0).onPointerDown({
        pointerId: 1,
        clientX: 10,
        currentTarget: { setPointerCapture: vi.fn() },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent);
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
    });

    expect(result.current.draggingIndex).toBeNull();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('moves an item to another row while dragging when allowCrossRow is set', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useToolbarReorder({ count: 3, onReorder, allowCrossRow: true }),
    );

    act(() => {
      result.current.itemRefs.current[0] = element(0, 20, 0);
      result.current.itemRefs.current[1] = element(22, 42, 0);
      result.current.itemRefs.current[2] = element(0, 20, 24);
    });
    act(() => {
      result.current.getHandleProps(0).onPointerDown({
        pointerId: 1,
        clientX: 10,
        clientY: 11,
        currentTarget: { setPointerCapture: vi.fn() },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent);
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 5, clientY: 35, pointerId: 1 }));
    });

    // 2 段目の先頭 = 取り除いた後では index 1
    expect(onReorder).toHaveBeenCalledWith(0, 1);
    expect(result.current.draggingIndex).toBe(1);
  });

  it('reports canReorder from the movable flags', () => {
    const { result } = renderHook(() => useToolbarReorder({ count: 3, movable: [true, false, true] }));

    expect(result.current.canReorder(0)).toBe(true);
    expect(result.current.canReorder(1)).toBe(false);
    expect(result.current.canReorder(2)).toBe(true);
  });

  it('never drops onto a non-movable slot', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useToolbarReorder({ count: 3, onReorder, movable: [true, false, true] }),
    );

    act(() => {
      [0, 1, 2].forEach((i) => {
        result.current.itemRefs.current[i] = element(RECTS[i].left, RECTS[i].right);
      });
    });
    act(() => {
      result.current.getHandleProps(0).onPointerDown({
        pointerId: 1,
        clientX: 10,
        currentTarget: { setPointerCapture: vi.fn() },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent);
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 58, pointerId: 1 }));
    });

    expect(onReorder).toHaveBeenCalledWith(0, 2);
  });
});
