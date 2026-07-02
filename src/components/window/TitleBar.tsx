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
  maximizeDisabled?: boolean;
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
    maximizeDisabled,
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
        {isMinimized ? (
          <button aria-label="Restore" onClick={onMinimize} />
        ) : (
          <button aria-label="Minimize" onClick={onMinimize} />
        )}
        {isMaximized ? (
          <button aria-label="Restore" onClick={onRestore} />
        ) : (
          <button
            aria-label="Maximize"
            onClick={onMaximize}
            disabled={maximizeDisabled || isMinimized}
          />
        )}
        {onHelp !== undefined && <button aria-label="Help" onClick={onHelp} />}
        <button aria-label="Close" onClick={onClose} />
      </div>
    </div>
  );
});
