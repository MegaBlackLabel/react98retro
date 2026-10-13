import { useCallback, useEffect, useRef, useState } from 'react';

export type PackToolbarRowsOptions = {
  /** 段の中の項目の間隔 (px)。CSS 変数 `--win98-toolbar-gap` と同じ値にする。既定 1 */
  gap?: number;
  /** 次の項目と離さない項目 (ラベルとコントロールなど)。index ごとの真偽 */
  keepWithNext?: readonly boolean[];
};

/**
 * 計測した幅を、段の幅に入る範囲で左から詰める。
 *
 * 実物のドッキング ツールバーと同じく 1 項目まるごと次の段へ回し、途中で切らない。
 * `keepWithNext` の項目は、次の項目が同じ段に入らないときは段の末尾に残さず次の段の先頭にする。
 */
export function packToolbarRows(
  widths: readonly number[],
  available: number,
  { gap = 1, keepWithNext = [] }: PackToolbarRowsOptions = {},
): number[][] {
  const rows: number[][] = [];
  let row: number[] = [];
  let used = 0;

  widths.forEach((width, index) => {
    const follower = widths[index + 1];
    const followerOverflows =
      keepWithNext[index] === true &&
      follower !== undefined &&
      used + gap + width + gap + follower > available;

    if (row.length > 0 && (used + gap + width > available || followerOverflows)) {
      rows.push(row);
      row = [index];
      used = width;
      return;
    }

    used = row.length === 0 ? width : used + gap + width;
    row.push(index);
  });

  if (row.length > 0) rows.push(row);
  return rows;
}

/** 段分けが変わったか (計測のたびに描き直さないため)。 */
function sameRows(
  a: readonly (readonly number[])[] | null,
  b: readonly (readonly number[])[] | null,
): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return (
    a.length === b.length &&
    a.every((row, i) => row.length === b[i].length && row.every((value, j) => value === b[i][j]))
  );
}

export type UseToolbarRowsOptions = {
  /** 段に並べる項目の数 */
  count: number;
  /** 段の中の項目の間隔 (px)。既定 1 (`--win98-toolbar-gap` と同じ) */
  gap?: number;
  /** 帯の左右の余白 (px)。使える幅から差し引く。既定 2 */
  paddingX?: number;
  /** 次の項目と離さない項目 (ラベルとコントロールなど)。index ごとの真偽 */
  keepWithNext?: readonly boolean[];
};

export type UseToolbarRowsResult = {
  /** 幅を測る帯の要素に付ける ref */
  stripRef: (element: HTMLElement | null) => void;
  /** 項目ごとの ref。`ref={(el) => { itemRefs.current[index] = el; }}` の形で付ける */
  itemRefs: React.RefObject<(HTMLElement | null)[]>;
  /** 段分け (項目 index の配列の配列)。計測できるまでは 1 段 */
  rows: number[][];
};

/**
 * ツールバーを段に折り返すための計測と詰め。
 *
 * 帯の幅と各項目の幅を測り、`packToolbarRows` で段に詰める。ウィンドウのリサイズ、
 * フォントの読み込み、項目の増減で詰め直す。`ResizeObserver` が無い環境
 * (SSR・古いブラウザ) では計測せず 1 段のまま返す。
 *
 * 使い方:
 * ```tsx
 * const { stripRef, itemRefs, rows } = useToolbarRows({ count: items.length, gap: 2 });
 * <ToolbarBand
 *   ref={stripRef}
 *   rows={rows.map((row) => (
 *     <Toolbar key={row[0]} variant="band" items={row.map((i) => items[i])} />
 *   ))}
 * />
 * ```
 */
export function useToolbarRows({
  count,
  gap = 1,
  paddingX = 2,
  keepWithNext,
}: UseToolbarRowsOptions): UseToolbarRowsResult {
  const stripRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [measured, setMeasured] = useState<number[][] | null>(null);

  const keepWithNextKey = keepWithNext?.join(',') ?? '';

  // 計測のたびに作り直さないよう、最新の指定は ref から読む (render 中には触らない)。
  const latestOptions = useRef({ gap, paddingX, keepWithNext });
  useEffect(() => {
    latestOptions.current = { gap, paddingX, keepWithNext };
  }, [gap, paddingX, keepWithNextKey, keepWithNext]);

  useEffect(() => {
    const update = () => {
      const strip = stripRef.current;
      if (!strip) return;

      const { gap: currentGap, paddingX: currentPaddingX, keepWithNext: currentKeepWithNext } =
        latestOptions.current;
      const available = strip.getBoundingClientRect().width - currentPaddingX * 2;
      const widths = itemRefs.current
        .slice(0, count)
        .map((item) => item?.getBoundingClientRect().width ?? 0);
      const packed =
        available > 0 && widths.length > 0 && widths.every((width) => width > 0)
          ? packToolbarRows(widths, available, {
              gap: currentGap,
              keepWithNext: currentKeepWithNext,
            })
          : null;

      setMeasured((current) => (sameRows(current, packed) ? current : packed));
    };

    update();
    if (typeof ResizeObserver === 'undefined') return undefined;

    // 幅が変わったら詰め直す (ウィンドウのリサイズ、フォントの読み込み、項目の増減)。
    const observer = new ResizeObserver(update);
    const strip = stripRef.current;
    if (strip) observer.observe(strip);
    for (const item of itemRefs.current.slice(0, count)) {
      if (item) observer.observe(item);
    }
    return () => observer.disconnect();
  }, [count, gap, paddingX, keepWithNextKey]);

  const setStrip = useCallback((element: HTMLElement | null) => {
    stripRef.current = element;
  }, []);

  // 段分けがまだ分からないときは 1 段で描く (CSS 側も折り返しできるようにしてある)。
  const rows = measured ?? [Array.from({ length: count }, (_, index) => index)];

  return { stripRef: setStrip, itemRefs, rows };
}
