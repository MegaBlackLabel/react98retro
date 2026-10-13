import clsx from 'clsx';
import styles from './Toolbar.module.css';

export type ToolbarRowProps = {
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<'div'>;

/**
 * ツールバー 1 段。中身 (グループ) を並べるだけの枠で、折り返しの判断は
 * `useToolbarRows` が持つ。
 *
 * 段は `flex-wrap: wrap` で、計測が終わるまでは CSS 側でも折り返す。子は縮めない
 * (`flex: 0 0 auto`)。縮むと幅を測れず、段分けが決まらないため。
 */
export function ToolbarRow({ children, className, ...rest }: ToolbarRowProps) {
  return (
    <div className={clsx(styles.bandRow, className)} {...rest}>
      {children}
    </div>
  );
}
