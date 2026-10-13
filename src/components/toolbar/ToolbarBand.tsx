import { Fragment, forwardRef } from 'react';
import clsx from 'clsx';
import { Groove } from '../groove/Groove';
import styles from './Toolbar.module.css';

export type ToolbarBandProps = {
  /**
   * 段。配列の 1 要素が 1 段 (1 行) になり、段と段の間に溝が入る。
   * 折り返しの判断は呼ぶ側が持つ (実測値の段詰めと同じで、幅を測って詰め直さない)。
   */
  rows: React.ReactNode[];
} & React.ComponentPropsWithoutRef<'div'>;

/**
 * ツールバー帯 (Win98 のドッキング ツールバー) 。
 *
 * 帯自身が外周の溝 (上辺の外の暗 1px / 上辺の明 1px / 明と暗の間の銀 1px /
 * 下辺の暗 2px) を持ち、段と段の間には銀 1px + 溝 2px + 銀 2px を空ける。
 * 実測 (Win98 ヘルプのツールバー画像 `TOOLBAR.PNG`) では、折り返した段の境目が
 * 「銀 → `#808080` 1px → `#ffffff` 1px → 銀」の並びになっている。
 *
 * 段の中身は呼ぶ側が作る (ライブラリの `Toolbar` でも、グループ分けした独自の行でもよい)。
 */
export const ToolbarBand = forwardRef<HTMLDivElement, ToolbarBandProps>(function ToolbarBand(
  { rows, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={clsx(styles.bandContainer, className)} {...rest}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <Groove className={styles.bandRowGroove} />}
          {row}
        </Fragment>
      ))}
    </div>
  );
});

ToolbarBand.displayName = 'ToolbarBand';
