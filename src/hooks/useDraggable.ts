import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSnapTarget, type SnapTarget } from './snap';

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
  snapTarget: SnapTarget | null;
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
  snapEnabled?: boolean;
  snapThreshold?: number;
  minWidth?: number;
  minHeight?: number;
  onSnapCommit?: (target: SnapTarget) => void;
  onDragStart?: () => void;
  /** ウィンドウサイズを指定してビューポート内に収める */
  bounds?: DraggableBounds;
}): UseDraggableResult {
  const bounds = options?.bounds;
  const snapOptionsRef = useRef({
    snapEnabled: options?.snapEnabled,
    snapThreshold: options?.snapThreshold ?? 20,
    minWidth: options?.minWidth ?? 200,
    minHeight: options?.minHeight ?? 100,
    onSnapCommit: options?.onSnapCommit,
    onDragStart: options?.onDragStart,
  });
  snapOptionsRef.current = {
    snapEnabled: options?.snapEnabled,
    snapThreshold: options?.snapThreshold ?? 20,
    minWidth: options?.minWidth ?? 200,
    minHeight: options?.minHeight ?? 100,
    onSnapCommit: options?.onSnapCommit,
    onDragStart: options?.onDragStart,
  };

  // Calculate clamped initial position
  const initialPosition = useMemo(() => {
    const rawPos = {
      x: options?.initialX ?? 50,
      y: options?.initialY ?? 50,
    };
    return clampPosition(rawPos, bounds);
  }, [options?.initialX, options?.initialY, bounds]);

  const [internalPosition, setInternalPosition] = useState<DraggablePosition>(initialPosition);
  const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null);

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
    listeners: {
      move: (e: PointerEvent) => void;
      up: (e: PointerEvent) => void;
      cancel: (e: PointerEvent) => void;
    };
  } | null>(null);

  // 最新の position を ref で保持（stale closure 防止）
  const positionRef = useRef(position);
  positionRef.current = position;

  const snapTargetRef = useRef<SnapTarget | null>(null);
  snapTargetRef.current = snapTarget;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current || e.pointerId !== dragState.current.pointerId) return;
      const dx = e.clientX - dragState.current.startMouseX;
      const dy = e.clientY - dragState.current.startMouseY;
      setPosition({
        x: dragState.current.startX + dx,
        y: dragState.current.startY + dy,
      });

      if (snapOptionsRef.current.snapEnabled === false) {
        if (snapTargetRef.current !== null) {
          snapTargetRef.current = null;
          setSnapTarget(null);
        }
        return;
      }

      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
      const nextSnapTarget = getSnapTarget({
        pointerX: e.clientX,
        pointerY: e.clientY,
        viewportWidth,
        viewportHeight,
        threshold: snapOptionsRef.current.snapThreshold,
        minWidth: snapOptionsRef.current.minWidth,
        minHeight: snapOptionsRef.current.minHeight,
      });

      if (nextSnapTarget?.zone !== snapTargetRef.current?.zone) {
        snapTargetRef.current = nextSnapTarget;
        setSnapTarget(nextSnapTarget);
      } else {
        snapTargetRef.current = nextSnapTarget;
      }
    },
    [setPosition],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current || e.pointerId !== dragState.current.pointerId) return;
      const currentSnapTarget = snapTargetRef.current;
      if (currentSnapTarget && snapOptionsRef.current.snapEnabled !== false) {
        snapOptionsRef.current.onSnapCommit?.(currentSnapTarget);
      }
      cleanupDrag(e.pointerId);
    },
    [],
  );

  const cleanupDrag = useCallback(
    (pointerId: number) => {
      const currentDragState = dragState.current;
      if (!currentDragState || currentDragState.pointerId !== pointerId) return;
      currentDragState.target.releasePointerCapture(pointerId);
      window.removeEventListener('pointermove', currentDragState.listeners.move);
      window.removeEventListener('pointerup', currentDragState.listeners.up);
      window.removeEventListener('pointercancel', currentDragState.listeners.cancel);
      dragState.current = null;
      snapTargetRef.current = null;
      setSnapTarget(null);
    },
    [],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent) => {
      cleanupDrag(e.pointerId);
    },
    [cleanupDrag],
  );

  useEffect(
    () => () => {
      if (!dragState.current) return;
      cleanupDrag(dragState.current.pointerId);
    },
    [cleanupDrag],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // ボタンをクリックした場合はドラッグを開始しない
      if ((e.target as Element).closest('button')) return;
      flushSync(() => {
        snapOptionsRef.current.onDragStart?.();
      });
      e.currentTarget.setPointerCapture(e.pointerId);
      // positionRef.current を使うことでリサイズ後の実際の位置から正しくドラッグ開始できる
      dragState.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: positionRef.current.x,
        startY: positionRef.current.y,
        pointerId: e.pointerId,
        target: e.currentTarget,
        listeners: {
          move: onPointerMove,
          up: onPointerUp,
          cancel: onPointerCancel,
        },
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    },
    [onPointerMove, onPointerUp, onPointerCancel],
  );

  return {
    position,
    setPosition,
    snapTarget,
    dragHandleProps: { onPointerDown },
  };
}
