import { useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Menu.module.css';

export type MenuItem =
  | {
      type?: 'item';
      label: string;
      onClick?: () => void;
      disabled?: boolean;
      checked?: boolean;
      children?: MenuItem[];
    }
  | { type: 'separator' };

export type MenuProps = {
  items: MenuItem[];
  onClose?: () => void;
  className?: string;
};

function MenuItemRow({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose?: () => void;
}) {
  const [subOpen, setSubOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (item.type === 'separator') {
    return <div className={styles.separator} role="separator" />;
  }

  const hasChildren = item.children && item.children.length > 0;
  const isDisabled = item.disabled;

  const handleClick = () => {
    if (isDisabled || hasChildren) return;
    item.onClick?.();
    onClose?.();
  };

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hasChildren) setSubOpen(true);
  };

  const handleMouseLeave = () => {
    if (hasChildren) {
      timerRef.current = setTimeout(() => setSubOpen(false), 150);
    }
  };

  const handleSubMenuMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div
      className={clsx(styles.item, {
        [styles.itemDisabled]: isDisabled,
        [styles.itemActive]: subOpen,
      })}
      role="menuitem"
      aria-disabled={isDisabled}
      aria-haspopup={hasChildren ? 'menu' : undefined}
      aria-expanded={hasChildren ? subOpen : undefined}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.checked !== undefined && (
        <span className={styles.check}>{item.checked ? '✓' : ''}</span>
      )}
      <span className={styles.label}>{item.label}</span>
      {hasChildren && <span className={styles.arrow}>▶</span>}
      {hasChildren && subOpen && (
        <div
          className={styles.submenu}
          role="menu"
          onMouseEnter={handleSubMenuMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {item.children!.map((child, i) => (
            <MenuItemRow key={i} item={child} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Menu({ items, onClose, className }: MenuProps) {
  return (
    <div className={clsx(styles.panel, className)} role="menu">
      {items.map((item, i) => (
        <MenuItemRow key={i} item={item} onClose={onClose} />
      ))}
    </div>
  );
}

Menu.displayName = 'Menu';
