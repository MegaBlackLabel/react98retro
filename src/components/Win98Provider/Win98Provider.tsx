import type { ReactNode, CSSProperties } from 'react';
import '98.css';

export interface Win98ProviderProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * Win98Provider — 98.css のスタイルを .win98 クラス配下にスコープするラッパー。
 * このコンポーネントで囲んだ要素にのみ Win98 スタイルが適用されます。
 */
export function Win98Provider({ children, style, className }: Win98ProviderProps) {
  return (
    <div className={['win98', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}
