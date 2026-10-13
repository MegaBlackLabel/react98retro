import { useRef, useState, type ReactElement } from 'react';
import clsx from 'clsx';
import styles from './DesktopIcons.module.css';

export type DesktopIconItem = {
  id: string;
  label: string;
  /** アイコン画像 URL (32x32 を表示) */
  icon: string;
  x: number;
  y: number;
};

export type DesktopIconsProps = {
  items: readonly DesktopIconItem[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onOpen?: (id: string) => void;
  /** ドラッグ終了時 (グリッド吸着後の座標) */
  onMove?: (id: string, position: { x: number; y: number }) => void;
  /** アイコン 1 個のセルサイズ (既定 75) */
  gridSize?: number;
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'>;

/** これ以上動いたらドラッグ開始とみなすピクセル数 */
const DRAG_THRESHOLD = 8;
const DEFAULT_GRID_SIZE = 75;

type DragInfo = {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

export function DesktopIcons({
  items,
  selectedId = null,
  onSelect,
  onOpen,
  onMove,
  gridSize = DEFAULT_GRID_SIZE,
  className,
  onClick,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...rest
}: DesktopIconsProps): ReactElement {
  const [dragState, setDragState] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  // ドラッグ直後の click/dblclick を無効化する (次の pointerdown で解除)
  const suppressClickRef = useRef(false);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    item: DesktopIconItem,
  ) => {
    if (event.button !== 0) return;
    suppressClickRef.current = false;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom など setPointerCapture 未対応環境では無視する
    }
    dragRef.current = {
      id: item.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: item.x,
      originY: item.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setDragState({
      id: drag.id,
      x: Math.max(0, drag.originX + dx),
      y: Math.max(0, drag.originY + dy),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) {
      setDragState(null);
      return;
    }
    // グリッド (gridSize 刻み) に吸着し、負の座標は 0 に丸める
    const x = Math.max(0, Math.round((drag.originX + (event.clientX - drag.startClientX)) / gridSize) * gridSize);
    const y = Math.max(0, Math.round((drag.originY + (event.clientY - drag.startClientY)) / gridSize) * gridSize);
    setDragState(null);
    suppressClickRef.current = true;
    onMove?.(drag.id, { x, y });
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event);
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragState(null);
  };

  return (
    <div
      role="listbox"
      aria-label="デスクトップ"
      className={clsx(styles.root, className)}
      onClick={(event) => {
        onClick?.(event);
        // 空き領域 (root 自身) をクリックしたときだけ選択解除する
        if (event.target === event.currentTarget) onSelect?.(null);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      {...rest}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const dragging = dragState?.id === item.id;
        const position = dragging && dragState ? dragState : item;
        return (
          <div
            key={item.id}
            role="option"
            tabIndex={0}
            aria-selected={isSelected}
            data-selected={isSelected ? 'true' : undefined}
            className={clsx(styles.icon, dragging && styles.dragging)}
            style={{ left: position.x, top: position.y, width: gridSize }}
            onPointerDown={(event) => handlePointerDown(event, item)}
            onClick={() => {
              if (suppressClickRef.current) return;
              onSelect?.(item.id);
            }}
            onDoubleClick={() => {
              if (suppressClickRef.current) return;
              onOpen?.(item.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onOpen?.(item.id);
              } else if (event.key === ' ') {
                event.preventDefault();
                onSelect?.(item.id);
              }
            }}
          >
            <img
              className={styles.image}
              src={item.icon}
              width={32}
              height={32}
              alt=""
              draggable={false}
            />
            <span className={styles.label}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

DesktopIcons.displayName = 'DesktopIcons';
