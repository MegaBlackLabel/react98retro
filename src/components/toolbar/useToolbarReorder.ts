import { useCallback, useEffect, useRef, useState } from 'react';

/** 挿入位置を出すための最小限の矩形 (getBoundingClientRect の一部)。 */
export type ToolbarItemRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** ドロップ位置を決めるためのポインタ座標。 */
export type ToolbarReorderPointer = { x: number; y: number };

export type ToolbarDropIndexOptions = {
  /**
   * 別の段への移動を許すか。既定 false (同じ段の中だけ)。
   * true のときは、ポインタの y が入っている段が対象になる。
   */
  allowCrossRow?: boolean;
};

/** ポインタの y に対応する段 (top) を選ぶ。どの段にも入っていなければ一番近い段。 */
function rowTopAt(
  pointerY: number,
  rects: readonly ToolbarItemRect[],
  fallbackTop: number,
): number {
  const hit = rects.find((rect) => pointerY >= rect.top && pointerY <= rect.bottom);
  if (hit) return hit.top;

  const tops: number[] = [];
  rects.forEach((rect) => {
    if (!tops.includes(rect.top)) tops.push(rect.top);
  });
  return tops.reduce(
    (best, top) => (Math.abs(top - pointerY) < Math.abs(best - pointerY) ? top : best),
    fallbackTop,
  );
}

/**
 * ポインタ位置から、ドラッグ中の項目の挿入位置 (結果の配列での index) を出す。
 *
 * 段 (行) をまたぐかどうかは `allowCrossRow` で決める:
 * - 既定 (フェーズ 1): 掴んだ項目と同じ段にある、動かせる項目だけを数える
 * - `allowCrossRow: true` (フェーズ 2): ポインタの y が入っている段を対象にする
 *
 * 数え方は「対象の段の、自分以外で中心がポインタより左にある項目の数」= 挿入スロット。
 * 動かせない項目 (`movable[index] === false`) は掴めないし、挿入先にもならない。
 */
export function resolveToolbarDropIndex(
  pointer: ToolbarReorderPointer,
  rects: readonly ToolbarItemRect[],
  fromIndex: number,
  { allowCrossRow = false }: ToolbarDropIndexOptions = {},
): number {
  const dragged = rects[fromIndex];
  if (!dragged) return fromIndex;

  const targetTop = allowCrossRow ? rowTopAt(pointer.y, rects, dragged.top) : dragged.top;

  // 対象の段の項目 (動かせない項目も含める)。動かせない項目は「掴めない」だけで、
  // ほかの項目の挿入で押し出される (実物の rebar も RBBS_NOGRIPPER のバンドはずれる)。
  const rowItems: number[] = [];
  rects.forEach((rect, index) => {
    if (rect.top === targetTop) rowItems.push(index);
  });
  if (rowItems.length === 0) return fromIndex;

  // 挿入位置 = 「中心がポインタより右にある最初の項目」の手前 (無ければ段の末尾の次)
  const beforeIndex = rowItems.findIndex(
    (index) => (rects[index].left + rects[index].right) / 2 >= pointer.x,
  );
  const insertBefore =
    beforeIndex === -1 ? rowItems[rowItems.length - 1] + 1 : rowItems[beforeIndex];

  // 返す index は「fromIndex を取り除いた後の配列」での位置。
  // 呼ぶ側は `const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]);` で並べ替える。
  let to = 0;
  for (let index = 0; index < insertBefore; index += 1) {
    if (index !== fromIndex) to += 1;
  }
  return to;
}

export type UseToolbarReorderOptions = {
  /** 並べ替えの対象になる項目の数 */
  count: number;
  /**
   * 動かせる項目かどうか (index ごと)。`false` の項目は掴めず、並べ替えの
   * 挿入先にもならない (実物の rebar の `RBBS_NOGRIPPER` と同じ考え方)。
   */
  movable?: readonly boolean[];
  /**
   * 別の段への移動を許すか (フェーズ 2)。既定 false (同じ段の中だけ)。
   */
  allowCrossRow?: boolean;
  /**
   * 既に持っている項目の ref を使い回す (`useToolbarRows` の `itemRefs` を
   * そのまま渡せる)。省略すると自前で持つ。
   */
  itemRefs?: React.RefObject<(HTMLElement | null)[]>;
  /**
   * ドロップで順序が変わったときに呼ばれる。`to` は「from を取り除いた後の配列」に
   * 挿し込む位置なので、呼ぶ側は
   * `const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]);`
   * の形で並べ替えられる。
   */
  onReorder?: (from: number, to: number) => void;
};

export type UseToolbarReorderResult = {
  /** 項目ごとの ref。`ref={(el) => { itemRefs.current[index] = el; }}` の形で付ける */
  itemRefs: React.RefObject<(HTMLElement | null)[]>;
  /** ドラッグ中の項目の index (ドラッグしていなければ null) */
  draggingIndex: number | null;
  /** 現在の挿入位置 (ドラッグしていなければ null) */
  dropIndex: number | null;
  /** 掴むところ (グリップ) に付ける props */
  getHandleProps: (index: number) => {
    onPointerDown: (event: React.PointerEvent) => void;
    'data-reorder-handle': string;
  };
  /** その index が動かせるか (movable を省略したときは常に true) */
  canReorder: (index: number) => boolean;
};

/**
 * ツールバーの項目をグリップでドラッグして並べ替える (フェーズ 1: 同じ段の中)。
 *
 * ポインタの X から挿入位置を出すだけで、順序そのものは呼ぶ側が持ち続ける
 * (controlled)。段分けは `useToolbarRows` が測って詰め直すので、並べ替えたら
 * そのまま追従する。
 */
export function useToolbarReorder({
  count,
  onReorder,
  movable,
  allowCrossRow = false,
  itemRefs: externalRefs,
}: UseToolbarReorderOptions): UseToolbarReorderResult {
  const ownRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = externalRefs ?? ownRefs;
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // 最新の指定は ref から読む (render 中には触らない)
  const movableKey = movable?.map((flag) => (flag ? '1' : '0')).join('') ?? '';
  const latest = useRef({ count, onReorder, movable, allowCrossRow });
  useEffect(() => {
    latest.current = { count, onReorder, movable, allowCrossRow };
    // movable は毎レンダー作り直されることが多いので、依存はキーで見る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, onReorder, movableKey, allowCrossRow]);

  const readRects = useCallback((): ToolbarItemRect[] => {
    const items = itemRefs.current.slice(0, latest.current.count);
    return items.map((item) => {
      if (!item) return { left: 0, right: 0, top: 0, bottom: 0 };
      const rect = item.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
  }, []);

  useEffect(() => {
    if (draggingIndex === null) return undefined;

    const handleMove = (event: PointerEvent) => {
      setDropIndex(
        resolveToolbarDropIndex(
          { x: event.clientX, y: event.clientY },
          readRects(),
          draggingIndex,
          { allowCrossRow: latest.current.allowCrossRow },
        ),
      );
    };
    const handleUp = (event: PointerEvent) => {
      const target = resolveToolbarDropIndex(
        { x: event.clientX, y: event.clientY },
        readRects(),
        draggingIndex,
        { allowCrossRow: latest.current.allowCrossRow },
      );
      setDraggingIndex(null);
      setDropIndex(null);
      if (target !== draggingIndex) latest.current.onReorder?.(draggingIndex, target);
    };
    const handleCancel = () => {
      setDraggingIndex(null);
      setDropIndex(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
    };
  }, [draggingIndex, readRects]);

  const getHandleProps = useCallback((index: number) => ({
    'data-reorder-handle': '',
    onPointerDown: (event: React.PointerEvent) => {
      // ウィンドウ移動や選択に伝播させない
      event.stopPropagation();
      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      setDraggingIndex(index);
      setDropIndex(index);
    },
  }), []);

  const canReorder = useCallback(
    (index: number) => latest.current.movable?.[index] !== false,
    [],
  );

  return { itemRefs, draggingIndex, dropIndex, getHandleProps, canReorder };
}
