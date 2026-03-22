import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  type ForwardedRef,
  type RefAttributes,
  type ReactElement,
} from 'react';
import clsx from 'clsx';
import styles from './TableView.module.css';

export type TableColumn<T> = {
  key: keyof T;
  header: string;
  width?: number | string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

export type TableViewProps<T extends { id: string }> = {
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowDoubleClick?: (row: T) => void;
  interactive?: boolean;
  height?: number | string;
} & ComponentPropsWithoutRef<'div'>;

function TableViewInner<T extends { id: string }>(
  {
    columns,
    rows,
    selectedIds,
    onSelectionChange,
    onRowDoubleClick,
    interactive = true,
    height = 200,
    className,
    style,
    ...props
  }: TableViewProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  // Column widths in px (initialized from column.width or default 100)
  const [colWidths, setColWidths] = useState<number[]>(() =>
    columns.map((c) => (typeof c.width === 'number' ? c.width : 100)),
  );

  const currentSelectedIds = selectedIds ?? internalSelectedIds;
  const selectedSet = useMemo(() => new Set(currentSelectedIds), [currentSelectedIds]);
  const isControlled = selectedIds != null;

  const commitSelection = (ids: string[]) => {
    if (!isControlled) setInternalSelectedIds(ids);
    onSelectionChange?.(ids);
  };

  const handleRowClick = (row: T, event: MouseEvent<HTMLTableRowElement>) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    if (isMultiSelect) {
      const nextIds = selectedSet.has(row.id)
        ? currentSelectedIds.filter((id) => id !== row.id)
        : [...currentSelectedIds, row.id];
      commitSelection(nextIds);
      return;
    }
    commitSelection([row.id]);
  };

  // Resize drag state
  const dragState = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  const handleResizeMouseDown = useCallback(
    (colIndex: number, e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = { colIndex, startX: e.clientX, startWidth: colWidths[colIndex] };

      const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (!dragState.current) return;
        const delta = moveEvent.clientX - dragState.current.startX;
        const newWidth = Math.max(30, dragState.current.startWidth + delta);
        setColWidths((prev) => {
          const next = [...prev];
          next[dragState.current!.colIndex] = newWidth;
          return next;
        });
      };

      const onMouseUp = () => {
        dragState.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [colWidths],
  );

  return (
    <div
      ref={ref}
      className={clsx('sunken-panel', className)}
      style={{ height, overflow: 'auto', ...style }}
      {...props}
    >
      <table className={clsx({ interactive })} style={{ tableLayout: 'fixed', width: '100%' }}>
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th
                key={String(column.key)}
                style={{ width: colWidths[i], position: 'relative', overflow: 'hidden' }}
              >
                {column.header}
                <div
                  className={styles.resizeHandle}
                  onMouseDown={(e) => handleResizeMouseDown(i, e)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selectedSet.has(row.id);
            return (
              <tr
                key={row.id}
                className={clsx({ highlighted: isSelected })}
                onClick={(event) => handleRowClick(row, event)}
                onDoubleClick={() => onRowDoubleClick?.(row)}
              >
                {columns.map((column) => {
                  const value = row[column.key];
                  return (
                    <td key={String(column.key)} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {column.render ? column.render(value, row) : String(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const TableView = forwardRef(TableViewInner) as <T extends { id: string }>(
  props: TableViewProps<T> & RefAttributes<HTMLDivElement>,
) => ReactElement;

(TableView as typeof TableView & { displayName?: string }).displayName = 'TableView';
