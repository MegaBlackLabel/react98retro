import { useCallback, useRef, useState } from 'react';

export interface DraggablePosition {
  x: number;
  y: number;
}

export interface UseDraggableResult {
  position: DraggablePosition;
  setPosition: (pos: DraggablePosition) => void;
  dragHandleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
}

export function useDraggable(options?: {
  initialX?: number;
  initialY?: number;
}): UseDraggableResult {
  const [position, setPosition] = useState<DraggablePosition>({
    x: options?.initialX ?? 50,
    y: options?.initialY ?? 50,
  });

  const dragState = useRef<{
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    pointerId: number;
    target: Element;
  } | null>(null);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current || e.pointerId !== dragState.current.pointerId) return;
    const dx = e.clientX - dragState.current.startMouseX;
    const dy = e.clientY - dragState.current.startMouseY;
    setPosition({
      x: dragState.current.startX + dx,
      y: dragState.current.startY + dy,
    });
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current || e.pointerId !== dragState.current.pointerId) return;
      dragState.current.target.releasePointerCapture(e.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dragState.current = null;
    },
    [onPointerMove],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // ボタンをクリックした場合はドラッグを開始しない
      if ((e.target as Element).closest('button')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: position.x,
        startY: position.y,
        pointerId: e.pointerId,
        target: e.currentTarget,
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [position, onPointerMove, onPointerUp],
  );

  return {
    position,
    setPosition,
    dragHandleProps: { onPointerDown },
  };
}
