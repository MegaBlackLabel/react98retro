import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactElement } from 'react';
import clsx from 'clsx';
import { Icon } from '../../icons';
import type { IconName } from '../../icons';
import styles from './StartMenu.module.css';

export type StartMenuItem =
  | { type: 'item'; label: string; icon?: string; disabled?: boolean; onClick?: () => void }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; icon?: string; items: StartMenuItem[] };

export type StartMenuProps = {
  items: StartMenuItem[];
  onClose?: () => void;
  /** 左端の縦帯に出す文字 (既定 'Windows 98') */
  bannerText?: string;
  /** パネル幅 (既定 200) */
  width?: number;
  /**
   * 外側クリック判定から除外する要素のセレクタ。
   * スタート ボタンのように「メニューの外にあるが開閉トグルを持つ」要素を指定する。
   * 指定しないと、ボタンの mousedown で閉じた直後の click が再度開いてしまう。
   */
  ignoreOutsidePressSelector?: string;
} & ComponentPropsWithoutRef<'div'>;

/** サブメニューを開くまでのディレイ(ms) */
const SUBMENU_DELAY = 150;

/** サブメニュー開閉ディレイ用タイマーID */
type TimerId = ReturnType<typeof setTimeout>;

type RowProps = {
  item: StartMenuItem;
  /** キーボードで選択中 */
  active?: boolean;
  /** キーボード操作でサブメニューを強制表示 */
  forceOpen?: boolean;
  onClose?: () => void;
  /** ホバーで選択中にしたとき */
  onHover?: () => void;
};

function StartMenuRow({
  item,
  active = false,
  forceOpen = false,
  onClose,
  onHover,
}: RowProps): ReactElement {
  const [hoverOpen, setHoverOpen] = useState(false);
  const timerRef = useRef<TimerId | null>(null);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current ?? undefined);
    },
    [],
  );

  if (item.type === 'separator') {
    return <div className={styles.separator} role="separator" />;
  }

  const isSubmenu = item.type === 'submenu';
  const isDisabled = item.type === 'item' && !!item.disabled;
  const isOpen = isSubmenu && (forceOpen || hoverOpen);

  const handleClick = () => {
    if (isDisabled) return;
    if (isSubmenu) {
      setHoverOpen(true);
      return;
    }
    item.onClick?.();
    onClose?.();
  };

  const handleMouseEnter = () => {
    onHover?.();
    clearTimeout(timerRef.current ?? undefined);
    if (isSubmenu) {
      timerRef.current = setTimeout(() => setHoverOpen(true), SUBMENU_DELAY);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isSubmenu) setHoverOpen(false);
  };

  const cancelClose = () => {
    clearTimeout(timerRef.current ?? undefined);
  };

  return (
    <div
      className={clsx(styles.item, {
        [styles.itemDisabled]: isDisabled,
        [styles.itemActive]: active || isOpen,
      })}
      role="menuitem"
      aria-disabled={isDisabled || undefined}
      aria-haspopup={isSubmenu ? 'menu' : undefined}
      aria-expanded={isSubmenu ? isOpen : undefined}
      data-active={active ? 'true' : undefined}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={styles.icon}>
        {item.icon ? <Icon name={item.icon as IconName} size={16} /> : null}
      </span>
      <span className={styles.label}>{item.label}</span>
      {isSubmenu && <span className={styles.arrow}>▶</span>}
      {isSubmenu && isOpen && (
        <div
          className={styles.submenu}
          role="menu"
          onMouseEnter={cancelClose}
          onMouseLeave={handleMouseLeave}
        >
          {item.items.map((child, i) => (
            <StartMenuRow key={i} item={child} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StartMenu({
  items,
  onClose,
  bannerText = 'Windows 98',
  width = 200,
  ignoreOutsidePressSelector,
  className,
  style,
  ...rest
}: StartMenuProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

  // マウント時にフォーカスを当てる
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  // 外側クリックで閉じる (ignoreOutsidePressSelector に一致する要素は除外)
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (ignoreOutsidePressSelector && target?.closest(ignoreOutsidePressSelector)) return;
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose, ignoreOutsidePressSelector]);

  // 区切りを除いた移動可能な項目
  const navigable = items
    .map((item, index) => (item.type === 'separator' ? -1 : index))
    .filter((index) => index >= 0);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;

    if (key === 'Escape') {
      event.preventDefault();
      onClose?.();
      return;
    }

    if (navigable.length === 0) return;

    const currentPos = activeIndex === null ? -1 : navigable.indexOf(activeIndex);
    const currentItem = activeIndex !== null ? items[activeIndex] : undefined;

    switch (key) {
      case 'ArrowDown': {
        event.preventDefault();
        setActiveIndex(navigable[(currentPos + 1) % navigable.length]);
        setOpenSubmenuIndex(null);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setActiveIndex(navigable[(currentPos - 1 + navigable.length) % navigable.length]);
        setOpenSubmenuIndex(null);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (currentItem?.type === 'submenu') setOpenSubmenuIndex(activeIndex);
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        setOpenSubmenuIndex(null);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!currentItem || currentItem.type === 'separator') break;
        if (currentItem.type === 'submenu') {
          setOpenSubmenuIndex(activeIndex);
          break;
        }
        if (currentItem.disabled) break;
        currentItem.onClick?.();
        onClose?.();
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="スタート メニュー"
      tabIndex={0}
      className={clsx(styles.root, className)}
      style={{ width, ...style }}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className={styles.banner} aria-hidden="true">
        {bannerText}
      </div>
      <div className={styles.list}>
        {items.map((item, index) => (
          <StartMenuRow
            key={index}
            item={item}
            active={activeIndex === index}
            forceOpen={openSubmenuIndex === index}
            onClose={onClose}
            onHover={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

StartMenu.displayName = 'StartMenu';
