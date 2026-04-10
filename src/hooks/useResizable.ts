import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const cursorMap: Record<ResizeDirection, string> = {
  n: 'n-resize',
  s: 's-resize',
  e: 'e-resize',
  w: 'w-resize',
  ne: 'ne-resize',
  sw: 'sw-resize',
  nw: 'nw-resize',
  se: 'se-resize',
};

export interface UseResizableResult {
  size: { width: number; height: number };
  position: { x: number; y: number };
  getResizeHandleProps: (direction: ResizeDirection) => {
    style: CSSProperties;
    onPointerDown: (e: React.PointerEvent) => void;
  };
}

function clampToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  // Clamp size to viewport
  const clampedWidth = Math.min(width, viewportWidth);
  const clampedHeight = Math.min(height, viewportHeight);

  // Clamp position so window stays within viewport
  const maxX = Math.max(0, viewportWidth - clampedWidth);
  const maxY = Math.max(0, viewportHeight - clampedHeight);

  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
    width: clampedWidth,
    height: clampedHeight,
  };
}

export function useResizable(options?: {
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  minWidth?: number;
  minHeight?: number;
  /** 外部から位置を渡す場合 (Window.tsx の単一 position state を共有) */
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  /** ビューポート内に収める */
  clampToViewport?: boolean;
  /** ビューポートリサイズ時に位置とサイズを再調整する（clampToViewport と共に使用） */
  reconcileOnResize?: boolean;
}): UseResizableResult {
  const minWidth = options?.minWidth ?? 200;
  const minHeight = options?.minHeight ?? 100;
  const clampToViewportEnabled = options?.clampToViewport ?? false;
  const reconcileOnResize = options?.reconcileOnResize ?? false;

  // Calculate initial size and position, clamped to viewport if enabled
  const initialValues = useMemo(() => {
    const rawWidth = options?.initialWidth ?? 400;
    const rawHeight = options?.initialHeight ?? 300;
    const rawX = options?.initialX ?? 50;
    const rawY = options?.initialY ?? 50;

    if (clampToViewportEnabled) {
      return clampToViewport(rawX, rawY, rawWidth, rawHeight);
    }

    return { x: rawX, y: rawY, width: rawWidth, height: rawHeight };
  }, [
    options?.initialWidth,
    options?.initialHeight,
    options?.initialX,
    options?.initialY,
    clampToViewportEnabled,
  ]);

  const [size, setSize] = useState({
    width: initialValues.width,
    height: initialValues.height,
  });
  const [internalPosition, setInternalPosition] = useState({
    x: initialValues.x,
    y: initialValues.y,
  });

  // 外部 state が渡されていればそちらを使う
  const position = options?.position ?? internalPosition;
  const setPosition = options?.onPositionChange ?? setInternalPosition;

  // Post-mount viewport resize handling - only when BOTH flags are enabled
  useEffect(() => {
    if (!reconcileOnResize || !clampToViewportEnabled) return;

    const handleResize = () => {
      const clamped = clampToViewport(position.x, position.y, size.width, size.height);
      
      // Only update if something actually changed
      if (
        clamped.x !== position.x ||
        clamped.y !== position.y ||
        clamped.width !== size.width ||
        clamped.height !== size.height
      ) {
        setSize({ width: clamped.width, height: clamped.height });
        setPosition({ x: clamped.x, y: clamped.y });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reconcileOnResize, clampToViewportEnabled, position, size, setPosition]);

  const resizeState = useRef<{
    direction: ResizeDirection;
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
    pointerId: number;
    target: Element;
  } | null>(null);

  // 最新の position と size を ref で保持（stale closure 防止）
  const positionRef = useRef(position);
  positionRef.current = position;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!resizeState.current || e.pointerId !== resizeState.current.pointerId) return;
      const { direction, startMouseX, startMouseY, startWidth, startHeight, startX, startY } =
        resizeState.current;

      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startX;
      let newY = startY;

      if (direction.includes('e')) newWidth = Math.max(minWidth, startWidth + dx);
      if (direction.includes('s')) newHeight = Math.max(minHeight, startHeight + dy);
      if (direction.includes('w')) {
        newWidth = Math.max(minWidth, startWidth - dx);
        newX = startX + startWidth - newWidth;
      }
      if (direction.includes('n')) {
        newHeight = Math.max(minHeight, startHeight - dy);
        newY = startY + startHeight - newHeight;
      }

      // Clamp to viewport if enabled
      if (clampToViewportEnabled) {
        const clamped = clampToViewport(newX, newY, newWidth, newHeight);
        setSize({ width: clamped.width, height: clamped.height });
        setPosition({ x: clamped.x, y: clamped.y });
      } else {
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    },
    [minWidth, minHeight, setPosition, clampToViewportEnabled],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!resizeState.current || e.pointerId !== resizeState.current.pointerId) return;
      resizeState.current.target.releasePointerCapture(e.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeState.current = null;
    },
    [onPointerMove],
  );

  const getResizeHandleProps = useCallback(
    (direction: ResizeDirection) => ({
      style: { cursor: cursorMap[direction] } as CSSProperties,
      onPointerDown: (e: React.PointerEvent) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        // positionRef / sizeRef を使うことで常に最新の値をキャプチャ
        resizeState.current = {
          direction,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startWidth: sizeRef.current.width,
          startHeight: sizeRef.current.height,
          startX: positionRef.current.x,
          startY: positionRef.current.y,
          pointerId: e.pointerId,
          target: e.currentTarget,
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      },
    }),
    [onPointerMove, onPointerUp],
  );

  return { size, position, getResizeHandleProps };
}
