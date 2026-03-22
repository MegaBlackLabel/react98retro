import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './MenuBar.module.css';

export type MenuItemDef =
  | {
      type: 'item';
      label: string;
      shortcut?: string;
      onClick?: () => void;
      disabled?: boolean;
      checked?: boolean;
      icon?: string;
    }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; disabled?: boolean; items: MenuItemDef[] };

export type MenuBarMenu = {
  label: string;
  items: MenuItemDef[];
};

export type MenuBarProps = {
  menus: MenuBarMenu[];
  rightIcons?: string[];
} & React.ComponentPropsWithoutRef<'div'>;

function getNavigableIndices(items: MenuItemDef[]): number[] {
  return items.reduce<number[]>((acc, item, i) => {
    if (item.type !== 'separator') acc.push(i);
    return acc;
  }, []);
}

/** "ファイル(F)" → ファイル(<u>F</u>) のようにアクセスキーを下線表示 */
function renderLabel(label: string): ReactNode {
  const match = label.match(/^(.*)\(([A-Za-z])\)(.*)$/);
  if (!match) return label;
  const [, before, letter, after] = match;
  return (
    <>
      {before}(<u style={{ textDecorationStyle: 'solid' }}>{letter}</u>){after}
    </>
  );
}

export function MenuBar({ menus, rightIcons, className, ...rest }: MenuBarProps) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const submenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeAll = useCallback(() => {
    setOpenMenuIndex(null);
    setFocusedItemIndex(null);
    setOpenSubmenuIndex(null);
  }, []);

  const openMenu = useCallback((index: number) => {
    setOpenMenuIndex(index);
    setFocusedItemIndex(null);
    setOpenSubmenuIndex(null);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (openMenuIndex === null) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuIndex, closeAll]);

  const handleTopLevelClick = (index: number) => {
    if (openMenuIndex === index) {
      closeAll();
    } else {
      openMenu(index);
    }
  };

  const handleTopLevelMouseEnter = (index: number) => {
    if (openMenuIndex !== null && openMenuIndex !== index) {
      openMenu(index);
    }
  };

  const handleMenuItemClick = useCallback(
    (item: MenuItemDef, e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.type === 'item' && !item.disabled) {
        item.onClick?.();
        closeAll();
      }
    },
    [closeAll],
  );

  const handleSubmenuEnter = (index: number) => {
    if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
    submenuTimerRef.current = setTimeout(() => {
      setOpenSubmenuIndex(index);
    }, 150);
  };

  const handleSubmenuLeave = () => {
    if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (openMenuIndex === null) return;
    const menu = menus[openMenuIndex];
    const navigable = getNavigableIndices(menu.items);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (focusedItemIndex === null) {
          setFocusedItemIndex(navigable[0] ?? null);
        } else {
          const pos = navigable.indexOf(focusedItemIndex);
          setFocusedItemIndex(navigable[(pos + 1) % navigable.length] ?? null);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (focusedItemIndex === null) {
          setFocusedItemIndex(navigable[navigable.length - 1] ?? null);
        } else {
          const pos = navigable.indexOf(focusedItemIndex);
          setFocusedItemIndex(
            navigable[(pos - 1 + navigable.length) % navigable.length] ?? null,
          );
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (
          focusedItemIndex !== null &&
          menu.items[focusedItemIndex]?.type === 'submenu'
        ) {
          setOpenSubmenuIndex(focusedItemIndex);
        } else {
          openMenu((openMenuIndex + 1) % menus.length);
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if (openSubmenuIndex !== null) {
          setOpenSubmenuIndex(null);
        } else {
          openMenu((openMenuIndex - 1 + menus.length) % menus.length);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (focusedItemIndex !== null) {
          const item = menu.items[focusedItemIndex];
          if (item.type === 'item' && !item.disabled) {
            item.onClick?.();
            closeAll();
          } else if (item.type === 'submenu' && !item.disabled) {
            setOpenSubmenuIndex(focusedItemIndex);
          }
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeAll();
        break;
      }
    }
  };

  const renderMenuItems = (items: MenuItemDef[], isSubmenu = false) =>
    items.map((item, i) => {
      if (item.type === 'separator') {
        return <div key={i} className={styles.menuSeparator} role="separator" />;
      }

      if (item.type === 'submenu') {
        const focused = !isSubmenu && focusedItemIndex === i;
        return (
          <div
            key={i}
            className={clsx(styles.menuItem, {
              [styles.menuItemDisabled]: item.disabled,
              [styles.menuItemFocused]: focused,
            })}
            onMouseEnter={() => !isSubmenu && handleSubmenuEnter(i)}
            onMouseLeave={!isSubmenu ? handleSubmenuLeave : undefined}
            role="menuitem"
            aria-haspopup="true"
            aria-disabled={item.disabled}
          >
            {item.label}
            <span className={styles.menuItemArrow}>▶</span>
            {!isSubmenu && openSubmenuIndex === i && (
              <div className={styles.submenu} role="menu">
                {renderMenuItems(item.items, true)}
              </div>
            )}
          </div>
        );
      }

      // type === 'item'
      const focused = !isSubmenu && focusedItemIndex === i;
      return (
        <div
          key={i}
          className={clsx(styles.menuItem, {
            [styles.menuItemDisabled]: item.disabled,
            [styles.menuItemFocused]: focused,
          })}
          onClick={(e) => handleMenuItemClick(item, e)}
          role="menuitem"
          aria-disabled={item.disabled}
        >
          {item.checked && <span className={styles.menuItemCheck}>✓</span>}
          {item.label}
          {item.shortcut && (
            <span className={styles.menuItemArrow}>{item.shortcut}</span>
          )}
        </div>
      );
    });

  return (
    <div
      ref={containerRef}
      role="menubar"
      className={clsx(styles.menuBar, className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...rest}
    >
      <div className={styles.grip} aria-hidden="true" />
      {menus.map((menu, menuIndex) => (
        /* ... same as before ... */
        <div
          key={menuIndex}
          className={clsx(styles.menuBarItem, {
            [styles.menuBarItemActive]: openMenuIndex === menuIndex,
          })}
          onClick={() => handleTopLevelClick(menuIndex)}
          onMouseEnter={() => handleTopLevelMouseEnter(menuIndex)}
          role="menuitem"
          aria-haspopup="true"
          aria-expanded={openMenuIndex === menuIndex}
        >
          {renderLabel(menu.label)}
          {openMenuIndex === menuIndex && (
            <div className={styles.menu} role="menu">
              {renderMenuItems(menu.items)}
            </div>
          )}
        </div>
      ))}
      {rightIcons && rightIcons.length > 0 && (
        <>
          <div className={styles.rightAreaSeparator} aria-hidden="true" />
          <div className={styles.rightArea}>
            {rightIcons.map((icon, i) => (
              <img key={i} src={icon} className={styles.rightIcon} alt="" aria-hidden="true" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

MenuBar.displayName = 'MenuBar';
