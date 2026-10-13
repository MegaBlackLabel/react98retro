import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './Taskbar.module.css';
import { Icon } from '../../icons';
import { useWindowManagerContext } from '../window/WindowManagerContext';

export type TaskbarItem = {
  id: string;
  title: string;
  icon?: string;
  /** 最前面ウィンドウ */
  active?: boolean;
  /** 最小化中 (タスクバーには残る) */
  minimized?: boolean;
};

export type TaskbarProps = {
  /** 左から並ぶタスクボタン。押下で onItemClick(id) */
  items?: readonly TaskbarItem[];
  onItemClick?: (id: string) => void;
  onStartClick?: () => void;
  /** トレイの時計表示。省略時は現在時刻を HH:MM (24時間) で出し、1 分ごとに更新 */
  clock?: string;
  showTray?: boolean;
} & React.ComponentPropsWithoutRef<'div'>;

// 24 時間表記 HH:MM に整形する
function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function Taskbar({
  items,
  onItemClick,
  onStartClick,
  clock,
  showTray = true,
  className,
  ...rest
}: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState(() => formatClock(new Date()));
  const manager = useWindowManagerContext();

  useEffect(() => {
    // clock を明示指定された場合は自前更新しない
    if (clock !== undefined) return;
    const timer = setInterval(() => setCurrentTime(formatClock(new Date())), 60_000);
    return () => clearInterval(timer);
  }, [clock]);

  // items を渡さない場合はウィンドウマネージャから導出する
  // (Win98 と同じく、開いた順 = register された順に左から並ぶ)
  const derivedItems: TaskbarItem[] = manager
    ? Object.values(manager.windows).map((state) => ({
        id: state.id,
        title: state.title ?? state.id,
        icon: state.icon,
        active: manager.isActive(state.id),
        minimized: state.minimized,
      }))
    : [];
  const resolvedItems = items ?? derivedItems;

  // onItemClick が無い場合は Win98 のトグル動作 (最小化中→復元、最前面→最小化、他→前面化)
  const handleItemClick = (id: string) => {
    if (onItemClick) {
      onItemClick(id);
      return;
    }
    if (!manager) return;
    const state = manager.windows[id];
    if (!state) return;
    if (state.minimized) {
      manager.restore(id);
      manager.focus(id);
      return;
    }
    if (manager.isActive(id)) {
      manager.minimize(id);
      return;
    }
    manager.focus(id);
  };

  const clockText = clock ?? currentTime;

  return (
    <div role="toolbar" aria-label="タスクバー" className={clsx(styles.taskbar, className)} {...rest}>
      <button
        type="button"
        className={styles.start}
        aria-label="スタート"
        data-taskbar-start=""
        onClick={onStartClick}
      >
        <Icon name="windowsLogo" size={16} />
        <span>スタート</span>
      </button>
      {resolvedItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={clsx(styles.taskButton, { [styles.taskButtonActive]: item.active })}
          aria-pressed={item.active}
          title={item.title}
          onClick={() => handleItemClick(item.id)}
        >
          {item.icon && <img src={item.icon} width={16} height={16} alt="" />}
          <span className={styles.taskButtonLabel}>{item.title}</span>
        </button>
      ))}
      {showTray !== false && (
        <div className={styles.tray} aria-label="タスクトレイ">
          <span className={styles.clock}>{clockText}</span>
        </div>
      )}
    </div>
  );
}
