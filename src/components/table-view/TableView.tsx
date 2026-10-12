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

export type TableSortDirection = 'asc' | 'desc';

export type TableSortState<T> = {
  columnKey: keyof T | null;
  direction: TableSortDirection;
};

export type TableColumn<T> = {
  key: keyof T;
  header: string;
  width?: number | string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

export type TableRowId = string | number;

export type TableViewProps<T extends { id: TableRowId }> = {
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  /** 数値 id も受け付け、内部では文字列に正規化する */
  selectedIds?: readonly TableRowId[];
  onSelectionChange?: (ids: string[]) => void;
  onRowDoubleClick?: (row: T) => void;
  sort?: TableSortState<T>;
  onSortChange?: (sort: TableSortState<T>) => void;
  interactive?: boolean;
  height?: number | string;
} & ComponentPropsWithoutRef<'div'>;

function TableViewInner<T extends { id: TableRowId }>(
  {
    columns,
    rows,
    selectedIds,
    onSelectionChange,
    onRowDoubleClick,
    sort,
    onSortChange,
    interactive = true,
    height = 200,
    className,
    style,
    ...props
  }: TableViewProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  const [colWidths, setColWidths] = useState<Array<number | string>>(() =>
    columns.map((c) => c.width ?? 100),
  );

  const currentSelectedIds = selectedIds ?? internalSelectedIds;
  const selectedSet = useMemo(
    () => new Set(currentSelectedIds.map((id) => String(id))),
    [currentSelectedIds],
  );
  const isControlled = selectedIds != null;
  const hasSortUi = onSortChange != null;

  const commitSelection = (ids: readonly TableRowId[]) => {
    const normalized = ids.map((id) => String(id));
    if (!isControlled) setInternalSelectedIds(normalized);
    onSelectionChange?.(normalized);
  };

  const handleRowClick = (row: T, event: MouseEvent<HTMLTableRowElement>) => {
    const rowId = String(row.id);
    const isMultiSelect = event.ctrlKey || event.metaKey;
    if (isMultiSelect) {
      const nextIds = selectedSet.has(rowId)
        ? currentSelectedIds.filter((id) => String(id) !== rowId)
        : [...currentSelectedIds, rowId];
      commitSelection(nextIds);
      return;
    }
    commitSelection([rowId]);
  };

  const dragState = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  const handleResizeMouseDown = useCallback(
    (colIndex: number, e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = {
        colIndex,
        startX: e.clientX,
        startWidth: typeof colWidths[colIndex] === 'number' ? colWidths[colIndex] : 100,
      };

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

  const handleHeaderClick = useCallback(
    (columnKey: keyof T) => {
      if (!onSortChange) return;
      const nextDirection =
        sort?.columnKey === columnKey && sort.direction === 'asc' ? 'desc' : 'asc';
      onSortChange({ columnKey, direction: nextDirection });
    },
    [onSortChange, sort],
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
            {columns.map((column, i) => {
              const isActiveSort = sort?.columnKey === column.key;
              const sortLabel = isActiveSort
                ? column.header + ' sorted ' + (sort.direction === 'asc' ? 'ascending' : 'descending')
                : column.header;

              return (
                <th
                  key={String(column.key)}
                  aria-sort={
                    isActiveSort ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={styles.headerCell}
                  style={{ width: colWidths[i], position: 'relative', overflow: 'hidden' }}
                >
                  {hasSortUi ? (
                    <button
                      type="button"
                      className={styles.headerButton}
                      aria-label={sortLabel}
                      onClick={() => handleHeaderClick(column.key)}
                    >
                      <span className={styles.headerText}>{column.header}</span>
                    </button>
                  ) : (
                    column.header
                  )}
                  <div
                    className={styles.resizeHandle}
                    onMouseDown={(e) => handleResizeMouseDown(i, e)}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selectedSet.has(String(row.id));
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

export const TableView = forwardRef(TableViewInner) as <T extends { id: TableRowId }>(
  props: TableViewProps<T> & RefAttributes<HTMLDivElement>,
) => ReactElement;

(TableView as typeof TableView & { displayName?: string }).displayName = 'TableView';
