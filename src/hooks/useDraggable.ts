import { useCallback, useMemo, useRef, useState } from 'react';

export interface DraggablePosition {
  x: number;
  y: number;
}

export interface DraggableBounds {
  width: number;
  height: number;
}

export interface UseDraggableResult {
  position: DraggablePosition;
  setPosition: (pos: DraggablePosition) => void;
  dragHandleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
}

function clampPosition(
  pos: DraggablePosition,
  bounds: DraggableBounds | undefined,
): DraggablePosition {
  if (!bounds) return pos;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  const maxX = Math.max(0, viewportWidth - bounds.width);
  const maxY = Math.max(0, viewportHeight - bounds.height);

  return {
    x: Math.max(0, Math.min(pos.x, maxX)),
    y: Math.max(0, Math.min(pos.y, maxY)),
  };
}

export function useDraggable(options?: {
  initialX?: number;
  initialY?: number;
  /** 外部から位置を渡す場合 (Window.tsx の単一 position state を共有) */
  position?: DraggablePosition;
  onPositionChange?: (pos: DraggablePosition) => void;
  /** ウィンドウサイズを指定してビューポート内に収める */
  bounds?: DraggableBounds;
}): UseDraggableResult {
  const bounds = options?.bounds;

  // Calculate clamped initial position
  const initialPosition = useMemo(() => {
    const rawPos = {
      x: options?.initialX ?? 50,
      y: options?.initialY ?? 50,
    };
    return clampPosition(rawPos, bounds);
  }, [options?.initialX, options?.initialY, bounds]);

  const [internalPosition, setInternalPosition] = useState<DraggablePosition>(initialPosition);

  // 外部 state が渡されていればそちらを使う
  const externalPosition = options?.position;
  const externalSetPosition = options?.onPositionChange;

  // Apply clamping to external position if provided
  const position = useMemo(() => {
    if (externalPosition) {
      return clampPosition(externalPosition, bounds);
    }
    return internalPosition;
  }, [externalPosition, internalPosition, bounds]);

  const setPosition = useCallback(
    (pos: DraggablePosition) => {
      const clampedPos = clampPosition(pos, bounds);
      if (externalSetPosition) {
        externalSetPosition(clampedPos);
      } else {
        setInternalPosition(clampedPos);
      }
    },
    [externalSetPosition, bounds],
  );

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

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current || e.pointerId !== dragState.current.pointerId) return;
      const dx = e.clientX - dragState.current.startMouseX;
      const dy = e.clientY - dragState.current.startMouseY;
      setPosition({
        x: dragState.current.startX + dx,
        y: dragState.current.startY + dy,
      });
    },
    [setPosition],
  );

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
