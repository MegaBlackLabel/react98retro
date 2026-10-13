import clsx from 'clsx';
import styles from './Groove.module.css';

export type GrooveOrientation = 'horizontal' | 'vertical';

export type GrooveProps = {
  /**
   * 溝の向き。既定は横 (帯と帯の間に入れる)。
   * 縦は、ツールバーの中やメニューバーの右端のような「同じ帯の中の区切り」に使う。
   */
  orientation?: GrooveOrientation;
} & React.ComponentPropsWithoutRef<'div'>;

/**
 * Windows 98 の凹んだ溝 (2px の区切り線)。
 *
 * 明暗は「暗が上 (左) / 明が下 (右)」で、実測 (Win98 ヘルプのツールバー画像
 * `TOOLBAR.PNG` の帯の境目 = 銀 → `#808080` 1px → `#ffffff` 1px) と同じ向き。
 * 逆向きにすると凸った「浮いた線」に見えるので、向きは固定で持つ。
 *
 * 高さ (太さ) は 2px 固定。周りの銀の余白は置く側が持つ (段と段の間なら
 * 上 1px / 下 2px の銀を空ける)。
 */
export function Groove({ orientation = 'horizontal', className, ...rest }: GrooveProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      // 帯の区切りは装飾なので、既定では読み上げに出さない。
      // 意味のある区切りとして出したいときは aria-hidden={undefined} を渡す。
      aria-hidden="true"
      className={clsx(orientation === 'vertical' ? styles.vertical : styles.horizontal, className)}
      {...rest}
    />
  );
}
