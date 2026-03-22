import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Menu } from '../menu/Menu';
import type { MenuItem } from '../menu/Menu';
import styles from './SplitButton.module.css';

export type { MenuItem };

export type SplitButtonProps = {
  /** アイコン画像のURL */
  icon: string;
  /** アクセシビリティ用ラベル */
  label?: string;
  /** ツールチップ */
  tooltip?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** ドロップダウンメニューアイテム */
  items: MenuItem[];
  className?: string;
};

export function SplitButton({
  icon,
  label,
  tooltip,
  disabled,
  items,
  className,
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // 外クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const ariaLabel = tooltip ?? label;

  return (
    <div ref={groupRef} className={clsx(styles.splitButtonGroup, className)}>
      {/* アイコン部分：表示のみ、クリック不可 */}
      <span
        className={styles.button}
        aria-hidden="true"
        style={{ pointerEvents: 'none' }}
      >
        <img src={icon} width={16} height={16} alt="" />
      </span>

      {/* ▼ボタン：ドロップダウン開閉 */}
      <button
        className={clsx(styles.button, styles.caretButton, {
          [styles.buttonPressed]: isOpen,
        })}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel ? `${ariaLabel} メニューを開く` : 'メニューを開く'}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={ariaLabel}
      >
        <span className={styles.caret}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.menuWrapper}>
          <Menu items={items} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}

SplitButton.displayName = 'SplitButton';
