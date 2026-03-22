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
  /** 外部から位置を渡す場合 (Window.tsx の単一 position state を共有) */
  position?: DraggablePosition;
  onPositionChange?: (pos: DraggablePosition) => void;
}): UseDraggableResult {
  const [internalPosition, setInternalPosition] = useState<DraggablePosition>({
    x: options?.initialX ?? 50,
    y: options?.initialY ?? 50,
  });

  // 外部 state が渡されていればそちらを使う
  const position = options?.position ?? internalPosition;
  const setPosition = options?.onPositionChange ?? setInternalPosition;

  const dragState = useRef<{
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    pointerId: number;
    target: Element;
  } | null>(null);

  // 最新の position を ref で保持（stale closure 防止）
  const positionRef = useRef(position);
  positionRef.current = position;

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current || e.pointerId !== dragState.current.pointerId) return;
    const dx = e.clientX - dragState.current.startMouseX;
    const dy = e.clientY - dragState.current.startMouseY;
    setPosition({
      x: dragState.current.startX + dx,
      y: dragState.current.startY + dy,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // positionRef.current を使うことでリサイズ後の実際の位置から正しくドラッグ開始できる
      dragState.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: positionRef.current.x,
        startY: positionRef.current.y,
        pointerId: e.pointerId,
        target: e.currentTarget,
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [onPointerMove, onPointerUp],
  );

  return {
    position,
    setPosition,
    dragHandleProps: { onPointerDown },
  };
}
