import { flushSync } from 'react-dom';
import { useRef, useState, useMemo, type CSSProperties, type ReactNode, useEffect, useId } from 'react';
import clsx from 'clsx';
import { TitleBar } from './TitleBar';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { calculateEscapePosition, calculateShrinkRect, isColliding, type Rect } from '../../hooks/collision';
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
  autoMoveOnSnap?: boolean;
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
  windowId?: string;
}

function getResponsiveSize(
  width: number,
  height: number,
  initialX: number,
  initialY: number,
): { width: number; height: number; x: number; y: number } {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  // On narrow viewports (< 640px), use tighter margins for mobile
  const isNarrow = viewportWidth < 640;
  const margin = isNarrow ? 8 : 32;
  const responsiveWidth = Math.min(width, viewportWidth - margin);
  const responsiveHeight = Math.min(height, viewportHeight - margin);

  // Clamp position to keep window in viewport
  const maxX = Math.max(0, viewportWidth - responsiveWidth);
  const maxY = Math.max(0, viewportHeight - responsiveHeight);

  return {
    width: responsiveWidth,
    height: responsiveHeight,
    x: Math.max(isNarrow ? 4 : 8, Math.min(initialX, maxX)),
    y: Math.max(isNarrow ? 4 : 8, Math.min(initialY, maxY)),
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
  snapEnabled: snapEnabledProp,
  snapThreshold = 20,
  autoMoveOnSnap: autoMoveOnSnapProp,
  style,
  className,
  zIndex,
  windowId,
}: WindowProps) {
  const context = useWindowManagerContext();
  const isManaged = context !== null;
  const isMobile = context?.isMobile ?? false;
  const autoMoveOnSnap = autoMoveOnSnapProp ?? context?.autoMoveOnSnap ?? false;
  const generatedId = useId();
  const effectiveWindowId = isManaged ? (windowId ?? generatedId) : undefined;

  // snapEnabled default: true on desktop, false on mobile (opt-in via prop)
  const snapEnabled = snapEnabledProp ?? !isMobile;

  const titleBarRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(minimizedProp ?? false);
  const [isMaximized, setIsMaximized] = useState(maximizedProp ?? false);
  const [activeZIndex, setActiveZIndex] = useState(zIndex ?? 1);
  const preSnapPosition = useRef<{ x: number; y: number } | null>(null);
  const preSnapSize = useRef<{ width: number; height: number } | null>(null);
  const [isSnapped, setIsSnapped] = useState(false);
  const register = context?.register;
  const unregister = context?.unregister;
  const updateGeometry = context?.updateGeometry;
  const moveRequests = context?.moveRequests;
  const clearMoveRequest = context?.clearMoveRequest;
  const resizeRequests = context?.resizeRequests;
  const clearResizeRequest = context?.clearResizeRequest;
  const getAllGeometries = context?.getAllGeometries;
  const requestMove = context?.requestMove;
  const requestResize = context?.requestResize;
  const setWindowSnapped = context?.setWindowSnapped;
  const restoreShrink = context?.restoreShrink;
  const preShrinkGeometries = context?.preShrinkGeometries;

  // Managed mode: register/unregister with window manager
  useEffect(() => {
    if (!isManaged || !effectiveWindowId || !register || !unregister) return;
    register(effectiveWindowId);
    return () => {
      unregister(effectiveWindowId);
    };
  }, [isManaged, effectiveWindowId, register, unregister]);

  // Managed mode: get z-index and active state from context
  const managedZIndex = isManaged && effectiveWindowId && context ? (context.windows[effectiveWindowId]?.zIndex ?? 1) : undefined;
  const managedIsActive = isManaged && effectiveWindowId && context ? context.isActive(effectiveWindowId) : undefined;

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

  useEffect(() => {
    if (!isManaged || !effectiveWindowId || !updateGeometry) return;

    if (isMaximized) {
      updateGeometry(effectiveWindowId, {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    } else {
      updateGeometry(effectiveWindowId, {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      });
    }
  }, [isManaged, effectiveWindowId, updateGeometry, position.x, position.y, size.width, size.height, isMaximized]);

  useEffect(() => {
    if (!isManaged || !effectiveWindowId || !moveRequests || !clearMoveRequest) return;

    const moveRequest = moveRequests[effectiveWindowId];
    if (!moveRequest) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const clampedX = Math.max(0, Math.min(moveRequest.x, viewportWidth - size.width));
    const clampedY = Math.max(0, Math.min(moveRequest.y, viewportHeight - size.height));

    const frame = window.requestAnimationFrame(() => {
      setPosition({ x: clampedX, y: clampedY });
      clearMoveRequest(effectiveWindowId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isManaged, effectiveWindowId, moveRequests, clearMoveRequest, size.width, size.height]);

  useEffect(() => {
    if (!isManaged || !effectiveWindowId || !resizeRequests || !clearResizeRequest) return;

    const resizeRequest = resizeRequests[effectiveWindowId];
    if (!resizeRequest) return;

    const frame = window.requestAnimationFrame(() => {
      setPosition({ x: resizeRequest.x, y: resizeRequest.y });
      setSize({ width: resizeRequest.width, height: resizeRequest.height });
      clearResizeRequest(effectiveWindowId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isManaged, effectiveWindowId, resizeRequests, clearResizeRequest, setSize]);

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
            if (effectiveWindowId && setWindowSnapped) {
              setWindowSnapped(effectiveWindowId, true);
            }

            if (autoMoveOnSnap && isManaged && effectiveWindowId && getAllGeometries && requestMove) {
              const foregroundRect: Rect = {
                x: target.x,
                y: target.y,
                width: target.width,
                height: target.height,
              };
              const foregroundZIndex = context?.windows[effectiveWindowId]?.zIndex ?? effectiveZIndex;

              const backgroundEntries = Object.entries(getAllGeometries())
                .map(([id, backgroundRect]) => ({
                  id,
                  backgroundRect,
                  zIndex: context?.windows[id]?.zIndex ?? 0,
                }))
                .sort((a, b) => b.zIndex - a.zIndex);

              backgroundEntries.forEach(({ id, backgroundRect }) => {
                if (id === effectiveWindowId || !isColliding(foregroundRect, backgroundRect)) return;

                const backgroundZIndex = context?.windows[id]?.zIndex ?? 0;
                if (backgroundZIndex >= foregroundZIndex) return;

                const resolvedBackgroundRect = preShrinkGeometries?.[id] ?? backgroundRect;
                const shrinkRect = context?.windows[id]?.isSnapped
                  ? calculateShrinkRect(foregroundRect, resolvedBackgroundRect, { minWidth: 200, minHeight: 100 })
                  : null;

                if (shrinkRect && requestResize) {
                  const currentGeometry = getAllGeometries()[id];
                  const isNoOp = currentGeometry
                    && currentGeometry.x === shrinkRect.x
                    && currentGeometry.y === shrinkRect.y
                    && currentGeometry.width === shrinkRect.width
                    && currentGeometry.height === shrinkRect.height;

                  if (!isNoOp) {
                    requestResize(id, shrinkRect);
                  }
                  return;
                }

                requestMove(id, calculateEscapePosition(foregroundRect, backgroundRect));
              });
            }
          }
        : undefined,
    onDragStart: () => {
      // Only increment local z-index in unmanaged mode
      if (!isManaged) {
        setActiveZIndex((current) => current + 1);
      }

      if (!isSnapped || !preSnapPosition.current || !preSnapSize.current) {
        if (effectiveWindowId && restoreShrink && preShrinkGeometries?.[effectiveWindowId]) {
          restoreShrink(effectiveWindowId);
        }

        return;
      }

      setPosition(preSnapPosition.current);
      setSize(preSnapSize.current);
      setIsSnapped(false);
      if (effectiveWindowId && setWindowSnapped) {
        setWindowSnapped(effectiveWindowId, false);
      }
      if (restoreShrink && preShrinkGeometries) {
        Object.keys(preShrinkGeometries).forEach((id) => {
          restoreShrink(id);
        });
      }
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
        height: '100dvh',
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
    if (!isManaged || !effectiveWindowId || !context) return;
    context.focus(effectiveWindowId);
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
            const handlePointerDown = (event: React.PointerEvent) => {
              if (effectiveWindowId && restoreShrink && preShrinkGeometries?.[effectiveWindowId]) {
                flushSync(() => {
                  restoreShrink(effectiveWindowId);
                });
              }

              onPointerDown(event);
            };

            return (
              <div
                className={styles.sizeGrip}
                style={seStyle}
                onPointerDown={handlePointerDown}
              />
            );
          })()}
        </>
      )}
      {!isMaximized && !isMinimized &&
        RESIZE_DIRECTIONS.map((dir) => {
          const { style: handleStyle, onPointerDown } = getResizeHandleProps(dir);
          const handlePointerDown = (event: React.PointerEvent) => {
            if (effectiveWindowId && restoreShrink && preShrinkGeometries?.[effectiveWindowId]) {
              flushSync(() => {
                restoreShrink(effectiveWindowId);
              });
            }

            onPointerDown(event);
          };
          return (
            <div
              key={dir}
              className={clsx(styles.resizeHandle, styles[dir])}
              style={handleStyle}
              onPointerDown={handlePointerDown}
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
