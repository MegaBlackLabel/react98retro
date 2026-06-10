import { useRef, useState, useMemo, type CSSProperties, type ReactNode, useEffect, useId } from 'react';
import clsx from 'clsx';
import { TitleBar } from './TitleBar';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useWindowManagerContext } from './WindowManagerContext';
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
  snapEnabled?: boolean;
  snapThreshold?: number;
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
  id?: string;
}

function getResponsiveSize(
  width: number,
  height: number,
  initialX: number,
  initialY: number,
): { width: number; height: number; x: number; y: number } {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  // On narrow viewports, use almost full width with some padding
  const isNarrow = viewportWidth < 640;
  const responsiveWidth = isNarrow ? Math.min(width, viewportWidth - 16) : Math.min(width, viewportWidth - 32);
  const responsiveHeight = Math.min(height, viewportHeight - 32);

  // Clamp position to keep window in viewport
  const maxX = Math.max(0, viewportWidth - responsiveWidth);
  const maxY = Math.max(0, viewportHeight - responsiveHeight);

  return {
    width: responsiveWidth,
    height: responsiveHeight,
    x: Math.max(8, Math.min(initialX, maxX)),
    y: Math.max(8, Math.min(initialY, maxY)),
  };
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
  snapEnabled = true,
  snapThreshold = 20,
  style,
  className,
  zIndex,
  id,
}: WindowProps) {
  const context = useWindowManagerContext();
  const isManaged = context !== null;
  const generatedId = useId();
  const windowId = isManaged ? (id ?? generatedId) : undefined;

  const titleBarRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(minimizedProp ?? false);
  const [isMaximized, setIsMaximized] = useState(maximizedProp ?? false);
  const [activeZIndex, setActiveZIndex] = useState(zIndex ?? 1);
  const preSnapPosition = useRef<{ x: number; y: number } | null>(null);
  const preSnapSize = useRef<{ width: number; height: number } | null>(null);
  const [isSnapped, setIsSnapped] = useState(false);
  const register = context?.register;
  const unregister = context?.unregister;

  // Managed mode: register/unregister with window manager
  useEffect(() => {
    if (!isManaged || !windowId || !register || !unregister) return;
    register(windowId);
    return () => {
      unregister(windowId);
    };
  }, [isManaged, windowId, register, unregister]);

  // Managed mode: get z-index and active state from context
  const managedZIndex = isManaged && windowId && context ? (context.windows[windowId]?.zIndex ?? 1) : undefined;
  const managedIsActive = isManaged && windowId && context ? context.isActive(windowId) : undefined;

  // Use managed z-index when available, otherwise fall back to local state
  const effectiveZIndex = managedZIndex !== undefined ? managedZIndex : activeZIndex;
  const effectiveInactive = managedIsActive !== undefined ? !managedIsActive : inactive;

  // Calculate responsive initial size and position
  const responsiveInitial = useMemo(
    () => getResponsiveSize(width, height, initialX, initialY),
    [width, height, initialX, initialY],
  );

  const snapActive = !isMaximized && snapEnabled;

  // ドラッグ・リサイズで共有する単一ポジション state
  const [position, setPosition] = useState({ x: responsiveInitial.x, y: responsiveInitial.y });

  // useResizable must come BEFORE useDraggable so we can use the live size for drag bounds
  const { size, setSize, getResizeHandleProps } = useResizable({
    initialWidth: responsiveInitial.width,
    initialHeight: responsiveInitial.height,
    initialX: responsiveInitial.x,
    initialY: responsiveInitial.y,
    position,
    onPositionChange: setPosition,
    minWidth: 200,
    minHeight: 100,
    clampToViewport: true,
    reconcileOnResize: true, // Re-clamp window when viewport changes after mount
  });

  // useDraggable uses the LIVE size from useResizable for bounds, not the initial size
  const { dragHandleProps, snapTarget } = useDraggable({
    initialX: responsiveInitial.x,
    initialY: responsiveInitial.y,
    position,
    onPositionChange: setPosition,
    snapEnabled: snapActive,
    snapThreshold: snapActive ? snapThreshold : undefined,
    minWidth: snapActive ? 200 : undefined,
    minHeight: snapActive ? 100 : undefined,
    bounds: { width: size.width, height: size.height },
      onSnapCommit: snapActive
        ? (target) => {
            preSnapPosition.current = { x: position.x, y: position.y };
            preSnapSize.current = { width: size.width, height: size.height };
            setPosition({ x: target.x, y: target.y });
            setSize({ width: target.width, height: target.height });
            setIsSnapped(true);
          }
        : undefined,
    onDragStart: () => {
      // Only increment local z-index in unmanaged mode
      if (!isManaged) {
        setActiveZIndex((current) => current + 1);
      }

      if (!isSnapped || !preSnapPosition.current || !preSnapSize.current) {
        return;
      }

      setPosition(preSnapPosition.current);
      setSize(preSnapSize.current);
      setIsSnapped(false);
    },
  });

  const snapPreviewStyle =
    snapTarget && !isMinimized && !isMaximized
      ? {
          position: 'fixed' as const,
          top: snapTarget.y,
          left: snapTarget.x,
          width: snapTarget.width,
          height: snapTarget.height,
          zIndex: effectiveZIndex + 1,
        }
      : null;

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
        ...style,
      }
    : isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        ...style,
      }
    : {
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        ...style,
      };

  const handlePointerDown = () => {
    if (!isManaged || !windowId || !context) return;
    context.focus(windowId);
  };

  const windowRoot = (
    <div
      className={clsx('window', styles.window, className)}
      style={{ ...computedStyle, display: 'flex', flexDirection: 'column', zIndex: effectiveZIndex }}
      onPointerDown={handlePointerDown}
    >
      <TitleBar
        ref={titleBarRef}
        title={title}
        icon={icon}
        inactive={effectiveInactive}
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

  return (
    <>
      {windowRoot}
      {snapPreviewStyle && (
        <div
          aria-hidden="true"
          className={styles.snapPreview}
          style={snapPreviewStyle}
        />
      )}
    </>
  );
}
