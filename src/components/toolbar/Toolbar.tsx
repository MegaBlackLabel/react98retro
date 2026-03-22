import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Toolbar.module.css';
import { Menu } from '../menu/Menu';
import { SplitButton } from '../split-button/SplitButton';
import type { MenuItem } from '../menu/Menu';

export type { MenuItem };

export type ToolbarItemDef =
  | {
      type: 'button';
      id: string;
      icon?: string;
      label?: string;
      tooltip?: string;
      onClick?: () => void;
      disabled?: boolean;
      pressed?: boolean;
    }
  | { type: 'separator' }
  | {
      type: 'dropdown';
      id: string;
      icon?: string;
      label?: string;
      tooltip?: string;
      items: MenuItem[];
      disabled?: boolean;
    }
  | {
      type: 'splitButton';
      id: string;
      icon: string;
      label?: string;
      tooltip?: string;
      disabled?: boolean;
      items: MenuItem[];
    };

export type ToolbarProps = {
  items: ToolbarItemDef[];
} & React.ComponentPropsWithoutRef<'div'>;

export function Toolbar({ items, className, ...rest }: ToolbarProps) {
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTooltipTimer = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
  };

  const handleMouseEnter = (id: string, tooltip: string | undefined) => {
    clearTooltipTimer();
    if (tooltip) {
      tooltipTimerRef.current = setTimeout(() => setTooltipId(id), 500);
    }
  };

  const handleMouseLeave = () => {
    clearTooltipTimer();
    setTooltipId(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdownId) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdownId]);

  return (
    <div ref={containerRef} className={clsx(styles.toolbar, className)} {...rest}>
      <div className={styles.grip} aria-hidden="true" />
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <div key={i} className={styles.separator} role="separator" />;
        }

        if (item.type === 'button') {
          return (
            <button
              key={item.id}
              className={clsx(styles.toolbarButton, {
                [styles.toolbarButtonPressed]: item.pressed,
              })}
              disabled={item.disabled}
              onClick={item.onClick}
              onMouseEnter={() => handleMouseEnter(item.id, item.tooltip ?? item.label)}
              onMouseLeave={handleMouseLeave}
              aria-label={item.tooltip ?? item.label}
              aria-pressed={item.pressed}
              title={item.tooltip ?? item.label}
            >
              {item.icon && <img src={item.icon} width={16} height={16} alt="" />}
              {tooltipId === item.id && (item.tooltip ?? item.label) && (
                <span className={styles.tooltip} role="tooltip">
                  {item.tooltip ?? item.label}
                </span>
              )}
            </button>
          );
        }

        if (item.type === 'dropdown') {
          const isOpen = openDropdownId === item.id;
          const iconOnly = !item.icon;
          return (
            <div key={item.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                className={clsx(styles.toolbarButton, {
                  [styles.toolbarButtonPressed]: isOpen,
                  [styles.toolbarButtonCaret]: iconOnly,
                })}
                disabled={item.disabled}
                onClick={() => setOpenDropdownId(isOpen ? null : item.id)}
                onMouseEnter={() => handleMouseEnter(item.id, item.tooltip ?? item.label)}
                onMouseLeave={handleMouseLeave}
                aria-label={item.tooltip ?? item.label}
                aria-haspopup="true"
                aria-expanded={isOpen}
                title={item.tooltip ?? item.label}
              >
                {item.icon && <img src={item.icon} width={16} height={16} alt="" />}
                <span className={styles.dropdownCaret}>▼</span>
                {tooltipId === item.id && (item.tooltip ?? item.label) && (
                  <span className={styles.tooltip} role="tooltip">
                    {item.tooltip ?? item.label}
                  </span>
                )}
              </button>
              {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999 }}>
                  <Menu
                    items={item.items}
                    onClose={() => setOpenDropdownId(null)}
                  />
                </div>
              )}
            </div>
          );
        }

        if (item.type === 'splitButton') {
          return (
            <SplitButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              tooltip={item.tooltip}
              disabled={item.disabled}
              items={item.items}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

Toolbar.displayName = 'Toolbar';
