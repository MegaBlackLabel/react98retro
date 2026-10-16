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

/** ドロップ先 (結果の配列での位置と、入る段)。 */
export type ToolbarDropTarget = {
  /**
   * 「fromIndex を取り除いた後の配列」での挿入位置。呼ぶ側は
   * `const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]);` で並べ替える。
   */
  to: number;
  /** 入る段 (上から 0, 1, 2...)。段を明示的に持つ使い方で、その段へ移すのに使う。 */
  row: number;
};

/** 段の並び (rects の top の重複を除いたもの) の中で、その top が何番目か。 */
function rowIndexOf(top: number, rects: readonly ToolbarItemRect[]): number {
  const tops: number[] = [];
  rects.forEach((rect) => {
    if (!tops.includes(rect.top)) tops.push(rect.top);
  });
  tops.sort((a, b) => a - b);
  return Math.max(0, tops.indexOf(top));
}

/**
 * ポインタ位置からドロップ先 (挿入位置と、入る段) を出す。
 *
 * 段をまたぐかどうかは `allowCrossRow` で決める:
 * - 既定 (フェーズ 1): 掴んだ項目と同じ段が対象
 * - `allowCrossRow: true` (フェーズ 2): ポインタの y が入っている段が対象
 *
 * 挿入位置は「対象の段で、中心がポインタより右にある最初の項目の手前」。段の
 * **全項目**で見るので、動かせない項目 (`movable[index] === false`) も挿入で押し出される
 * (掴めないだけで、位置は動く。実物の rebar の `RBBS_NOGRIPPER` と同じ)。
 * `movable` は掴めるかどうか (`useToolbarReorder` の `canReorder`) にだけ効く。
 *
 * 段は呼ぶ側が決める (幅での自動折り返しはしない)。`row` は「いま描かれている段」の
 * 上からの番号なので、段を明示的に持つ使い方では、その段へ移すのにそのまま使える。
 */
export function resolveToolbarDropTarget(
  pointer: ToolbarReorderPointer,
  rects: readonly ToolbarItemRect[],
  fromIndex: number,
  { allowCrossRow = false }: ToolbarDropIndexOptions = {},
): ToolbarDropTarget {
  const dragged = rects[fromIndex];
  if (!dragged) return { to: fromIndex, row: 0 };

  const targetTop = allowCrossRow ? rowTopAt(pointer.y, rects, dragged.top) : dragged.top;
  const row = rowIndexOf(targetTop, rects);

  // 対象の段の項目 (動かせない項目も含める)。動かせない項目は「掴めない」だけで、
  // ほかの項目の挿入で押し出される (実物の rebar も RBBS_NOGRIPPER のバンドはずれる)。
  const rowItems: number[] = [];
  rects.forEach((rect, index) => {
    if (rect.top === targetTop) rowItems.push(index);
  });
  if (rowItems.length === 0) return { to: fromIndex, row };

  // 挿入位置 = 「中心がポインタより右にある最初の項目」の手前 (無ければ段の末尾の次)
  const beforeIndex = rowItems.findIndex(
    (index) => (rects[index].left + rects[index].right) / 2 >= pointer.x,
  );
  const insertBefore =
    beforeIndex === -1 ? rowItems[rowItems.length - 1] + 1 : rowItems[beforeIndex];

  // 返す index は「fromIndex を取り除いた後の配列」での位置。
  let to = 0;
  for (let index = 0; index < insertBefore; index += 1) {
    if (index !== fromIndex) to += 1;
  }
  return { to, row };
}

/** 挿入位置だけが欲しいとき (結果の配列での index)。 */
export function resolveToolbarDropIndex(
  pointer: ToolbarReorderPointer,
  rects: readonly ToolbarItemRect[],
  fromIndex: number,
  options: ToolbarDropIndexOptions = {},
): number {
  return resolveToolbarDropTarget(pointer, rects, fromIndex, options).to;
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
   *
   * `row` は入る段 (上から 0, 1, 2...)。段を明示的に持つ使い方で、その段へ移すのに使う
   * (幅での自動折り返しをやめて段を自分で決めると、段をまたぐ移動がその場で確定する)。
   */
  onReorder?: (from: number, to: number, row: number) => void;
};

export type UseToolbarReorderResult = {
  /** 項目ごとの ref。`ref={(el) => { itemRefs.current[index] = el; }}` の形で付ける */
  itemRefs: React.RefObject<(HTMLElement | null)[]>;
  /**
   * ドラッグ中の項目の index (ドラッグしていなければ null)。並べ替えのたびに
   * 「移動後の index」へ更新されるので、そのまま装飾 (薄くする等) に使える。
   */
  draggingIndex: number | null;
  /** 掴むところ (グリップ) に付ける props */
  getHandleProps: (index: number) => {
    onPointerDown: (event: React.PointerEvent) => void;
    'data-reorder-handle': string;
  };
  /** その index が動かせるか (movable を省略したときは常に true) */
  canReorder: (index: number) => boolean;
};

/**
 * ツールバーの項目をグリップでドラッグして並べ替える。
 *
 * ドラッグ中に `onReorder` を呼んで**実際に並びを組み替える** (実物の rebar と同じ)。
 * 段は `useToolbarRows` が幅で詰め直すので、「どの段のどこに入るか」は組み替えて
 * みるまで確定しない。先に組み替えれば、ドラッグ中に見えている配置がそのまま結果に
 * なる (予告用の線を別に描く必要がない)。
 *
 * 順序そのものは呼ぶ側が持ち続ける (controlled)。
 * `onReorder(from, to)` の `to` は「`from` を取り除いた後の配列」での位置なので、
 * 呼ぶ側は `const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]);`
 * の形で適用する。
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
  // ドラッグ中の項目が「いま何番目か」。並べ替えるたびに移動後の index へ更新する
  const currentIndex = useRef<number | null>(null);

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
    // itemRefs は呼ぶ側が持つ ref (useRef の戻り) なので、依存に入れても作り直されない
  }, [itemRefs]);

  useEffect(() => {
    if (draggingIndex === null) return undefined;

    const targetAt = (
      event: PointerEvent,
    ): { target: ToolbarDropTarget; currentRow: number } | null => {
      const from = currentIndex.current;
      if (from === null) return null;
      const rects = readRects();
      const target = resolveToolbarDropTarget(
        { x: event.clientX, y: event.clientY },
        rects,
        from,
        { allowCrossRow: latest.current.allowCrossRow },
      );
      const currentRow = rowIndexOf(rects[from]?.top ?? target.row, rects);
      return { target, currentRow };
    };

    /**
     * 並べ替える必要があるか。位置が変わるか、**段が変わる**とき。
     * 段を明示的に持つ使い方では、位置が同じまま段だけ変わる移動 (隣の段の末尾へ等) が
     * あるので、位置だけで判定するとその移動が落ちる。
     */
    const needsReorder = (
      resolved: { target: ToolbarDropTarget; currentRow: number },
      from: number,
    ) => resolved.target.to !== from || resolved.target.row !== resolved.currentRow;

    // ドラッグ中に実際へ並べ替える (実物の rebar と同じ)。段は幅で詰め直されるので、
    // 「どの段のどこに入るか」は結果を見るまで分からない。先に組み替えてしまえば、
    // 見えている配置がそのまま結果になる (予告と結果がずれない)。
    const applyReorder = (from: number, to: number, row: number) => {
      latest.current.onReorder?.(from, to, row);
      // 呼ぶ側は `next.splice(to, 0, next.splice(from, 1)[0])` で並べ替えるので、
      // 移動後の項目の index は `to`。
      currentIndex.current = to;
      setDraggingIndex(to);
    };

    const handleMove = (event: PointerEvent) => {
      const resolved = targetAt(event);
      const from = currentIndex.current;
      if (resolved === null || from === null) return;
      if (needsReorder(resolved, from)) {
        applyReorder(from, resolved.target.to, resolved.target.row);
      }
    };
    const handleUp = (event: PointerEvent) => {
      const resolved = targetAt(event);
      const from = currentIndex.current;
      if (resolved !== null && from !== null && needsReorder(resolved, from)) {
        applyReorder(from, resolved.target.to, resolved.target.row);
      }
      currentIndex.current = null;
      setDraggingIndex(null);
    };
    const handleCancel = () => {
      currentIndex.current = null;
      setDraggingIndex(null);
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
      currentIndex.current = index;
      setDraggingIndex(index);
    },
  }), []);

  const canReorder = useCallback(
    (index: number) => latest.current.movable?.[index] !== false,
    [],
  );

  return { itemRefs, draggingIndex, getHandleProps, canReorder };
}
