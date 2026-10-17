import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './TitleBar.module.css';

export interface TitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: string;
  inactive?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onClose?: () => void;
  onHelp?: () => void;
  /** 最小化ボタンを表示する (既定 true) */
  minimizable?: boolean;
  /** 最大化/復元ボタンを表示する (既定 true) */
  maximizable?: boolean;
  /** 閉じるボタンを表示する (既定 true) */
  closable?: boolean;
  /** 最小化ボタンを非活性にする */
  minimizeDisabled?: boolean;
  /** 最大化ボタンを非活性にする (最小化中は自動で非活性になる) */
  maximizeDisabled?: boolean;
  /** 閉じるボタンを非活性にする */
  closeDisabled?: boolean;
  /** 最大化中の復元ボタンを非活性にする (最小化からの復元は対象外) */
  restoreDisabled?: boolean;
  /** ヘルプボタンを非活性にする */
  helpDisabled?: boolean;
  isMaximized?: boolean;
  isMinimized?: boolean;
}

export const TitleBar = forwardRef<HTMLDivElement, TitleBarProps>(function TitleBar(
  {
    title,
    icon,
    inactive,
    onMinimize,
    onMaximize,
    onRestore,
    onClose,
    onHelp,
    minimizable = true,
    maximizable = true,
    closable = true,
    minimizeDisabled,
    maximizeDisabled,
    closeDisabled,
    restoreDisabled,
    helpDisabled,
    isMaximized,
    isMinimized,
    className,
    ...rest
  },
  ref,
) {
  return (
    <div ref={ref} className={clsx('title-bar', styles.titleBar, { inactive }, className)} {...rest}>
      <div className={styles.titleBarLeft}>
        {icon && (
          <img src={icon} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
        )}
        <div className="title-bar-text">{title}</div>
      </div>
      <div className="title-bar-controls">
        {/* 非表示 (minimizable/maximizable) はスロットごと描かない。Restore も同じ枠なので一緒に消える */}
        {minimizable &&
          (isMinimized ? (
            <button aria-label="Restore" onClick={onMinimize} />
          ) : (
            <button aria-label="Minimize" onClick={onMinimize} disabled={minimizeDisabled} />
          ))}
        {maximizable &&
          (isMaximized ? (
            <button aria-label="Restore" onClick={onRestore} disabled={restoreDisabled} />
          ) : (
            <button
              aria-label="Maximize"
              onClick={onMaximize}
              disabled={maximizeDisabled || isMinimized}
            />
          ))}
        {onHelp !== undefined && (
          <button aria-label="Help" onClick={onHelp} disabled={helpDisabled} />
        )}
        {closable && <button aria-label="Close" onClick={onClose} disabled={closeDisabled} />}
      </div>
    </div>
  );
});
