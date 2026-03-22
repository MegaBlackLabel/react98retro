import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { TitleBar } from './TitleBar';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import type { ResizeDirection } from '../../hooks/useResizable';
import styles from './Window.module.css';

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export interface WindowProps {
  title: string;
  icon?: string;
  children?: ReactNode;
  statusBar?: ReactNode;
  width?: number;
  height?: number;
  initialX?: number;
  initialY?: number;
  inactive?: boolean;
  minimized?: boolean;
  maximized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
}

export function Window({
  title,
  icon,
  children,
  statusBar,
  width = 400,
  height = 300,
  initialX = 50,
  initialY = 50,
  inactive,
  minimized: minimizedProp,
  maximized: maximizedProp,
  onMinimize,
  onMaximize,
  onRestore,
  onClose,
  style,
  className,
  zIndex,
}: WindowProps) {
  const titleBarRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(minimizedProp ?? false);
  const [isMaximized, setIsMaximized] = useState(maximizedProp ?? false);

  // ドラッグ・リサイズで共有する単一ポジション state
  const [position, setPosition] = useState({ x: initialX, y: initialY });

  const { dragHandleProps } = useDraggable({
    initialX,
    initialY,
    position,
    onPositionChange: setPosition,
  });

  const { size, getResizeHandleProps } = useResizable({
    initialWidth: width,
    initialHeight: height,
    initialX,
    initialY,
    position,
    onPositionChange: setPosition,
  });

  const handleMinimize = () => {
    setIsMinimized((prev) => !prev);
    onMinimize?.();
  };

  const handleMaximize = () => {
    setIsMaximized(true);
    onMaximize?.();
  };

  const handleRestore = () => {
    setIsMaximized(false);
    onRestore?.();
  };

  const computedStyle: CSSProperties = isMinimized
    ? {
        position: 'fixed',
        bottom: 4,
        left: 4,
        width: 220,
        height: 'auto',
        zIndex,
        ...style,
      }
    : isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex,
        ...style,
      }
    : {
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex,
        ...style,
      };

  return (
    <div
      className={clsx('window', styles.window, className)}
      style={{ ...computedStyle, display: 'flex', flexDirection: 'column' }}
    >
      <TitleBar
        ref={titleBarRef}
        title={title}
        icon={icon}
        inactive={inactive}
        isMaximized={isMaximized}
        isMinimized={isMinimized}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onRestore={handleRestore}
        onClose={onClose}
        {...(isMinimized ? {} : dragHandleProps)}
      />
      {!isMinimized && (
        <>
          <div
            className="window-body"
            style={{ flex: 1, overflow: 'hidden', margin: 0, padding: '2px', display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </div>
          {statusBar}
          {!isMaximized && (() => {
            const { style: seStyle, onPointerDown } = getResizeHandleProps('se');
            return (
              <div
                className={styles.sizeGrip}
                style={seStyle}
                onPointerDown={onPointerDown}
              />
            );
          })()}
        </>
      )}
      {!isMaximized && !isMinimized &&
        RESIZE_DIRECTIONS.map((dir) => {
          const { style: handleStyle, onPointerDown } = getResizeHandleProps(dir);
          return (
            <div
              key={dir}
              className={clsx(styles.resizeHandle, styles[dir])}
              style={handleStyle}
              onPointerDown={onPointerDown}
            />
          );
        })}
    </div>
  );
}
