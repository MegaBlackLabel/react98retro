import { useCallback, useRef, useState } from 'react';
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
}): UseResizableResult {
  const minWidth = options?.minWidth ?? 200;
  const minHeight = options?.minHeight ?? 100;

  const [size, setSize] = useState({
    width: options?.initialWidth ?? 400,
    height: options?.initialHeight ?? 300,
  });
  const [internalPosition, setInternalPosition] = useState({
    x: options?.initialX ?? 50,
    y: options?.initialY ?? 50,
  });

  // 外部 state が渡されていればそちらを使う
  const position = options?.position ?? internalPosition;
  const setPosition = options?.onPositionChange ?? setInternalPosition;

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

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    },
    [minWidth, minHeight, setPosition],
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
