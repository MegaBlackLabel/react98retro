import { useMemo, useState } from 'react';
import {
  TableView,
  type TableColumn,
  type TableSortState,
} from '../../components/table-view/TableView';
import { ICONS, getFileIcon } from '../../icons';
import type { FSNode, ViewMode } from './useFileSystem';
import styles from './FileExplorer.module.css';

type FileListProps = {
  items: FSNode[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onNavigate: (id: string) => void;
  viewMode?: ViewMode;
  /** 項目の右クリック (画面座標つき)。Win98 のコンテキスト メニュー配線用 */
  onItemContextMenu?: (item: FSNode, position: { x: number; y: number }) => void;
  /** 余白の右クリック (画面座標つき) */
  onBackgroundContextMenu?: (position: { x: number; y: number }) => void;
};

type FileRow = {
  id: string;
  name: string;
  size: string;
  type: string;
  modified: string;
  _node: FSNode;
};

function formatSize(node: FSNode): string {
  if (node.type === 'drive' || node.type === 'folder') return '';
  if (node.size === undefined) return '';
  const kb = Math.round(node.size / 1024);
  return String(kb) + ' KB';
}

function formatType(node: FSNode): string {
  if (node.type === 'folder') return 'ファイル フォルダ';
  if (node.type === 'drive') {
    if (node.id.startsWith('A:')) return '3.5 インチ FD';
    return 'ローカル ディスク';
  }
  const ext = node.name.split('.').pop()?.toUpperCase();
  if (!ext || !node.name.includes('.')) return 'ファイル';
  return ext + ' ファイル';
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(node: FSNode): string {
  if (node.type === 'drive') return '';
  if (!node.modified) return '';
  const d = node.modified;
  const yy = String(d.getFullYear()).slice(-2);
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return yy + '/' + mm + '/' + dd + ' ' + hh + ':' + min;
}

function getIcon(node: FSNode): string {
  if (node.id === 'my-computer') return ICONS.myComputer;
  if (node.type === 'drive') {
    if (node.id.startsWith('A:')) return ICONS.floppyDrive;
    return ICONS.hardDrive;
  }
  if (node.type === 'folder') return ICONS.folderClosed;
  return getFileIcon(node.name);
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'ja', { numeric: true, sensitivity: 'base' });
}

function compareOptionalNumbers(left?: number, right?: number): number {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  return left - right;
}

function groupRank(node: FSNode): number {
  if (node.type === 'drive') return 0;
  if (node.type === 'folder') return 1;
  return 2;
}

function compareRows(left: FileRow, right: FileRow, sort: TableSortState<FileRow>): number {
  const groupDifference = groupRank(left._node) - groupRank(right._node);
  if (groupDifference !== 0) return groupDifference;

  let difference: number;
  switch (sort.columnKey) {
    case 'name':
      difference = compareText(left.name, right.name);
      break;
    case 'size':
      difference = compareOptionalNumbers(left._node.size, right._node.size);
      break;
    case 'type':
      difference = compareText(left.type, right.type);
      break;
    case 'modified':
      difference = compareOptionalNumbers(
        left._node.modified?.getTime(),
        right._node.modified?.getTime(),
      );
      break;
    default:
      difference = 0;
      break;
  }

  if (difference !== 0) {
    return sort.direction === 'desc' ? -difference : difference;
  }

  return compareText(left.name, right.name);
}

const COLUMNS: readonly TableColumn<FileRow>[] = [
  {
    key: 'name',
    header: '名前',
    width: '40%',
    render: (_value, row) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <img
          src={getIcon(row._node)}
          width={16}
          height={16}
          alt=""
          style={{ imageRendering: 'pixelated', flexShrink: 0 }}
        />
        {row.name}
      </span>
    ),
  },
  {
    key: 'size',
    header: 'サイズ',
    width: '12%',
  },
  {
    key: 'type',
    header: 'ファイルの種類',
    width: '28%',
  },
  {
    key: 'modified',
    header: '更新日時',
    width: '20%',
  },
];

function IconView({
  items,
  selectedIds,
  onSelectionChange,
  onNavigate,
  iconSize,
  onItemContextMenu,
  onBackgroundContextMenu,
}: {
  items: FSNode[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onNavigate: (id: string) => void;
  iconSize: 32 | 16;
  onItemContextMenu?: (item: FSNode, position: { x: number; y: number }) => void;
  onBackgroundContextMenu?: (position: { x: number; y: number }) => void;
}) {
  const handleClick = (id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([id]);
    }
  };

  const handleDoubleClick = (node: FSNode) => {
    if (node.type === 'folder' || node.type === 'drive') {
      onNavigate(node.id);
    }
  };

  return (
    <div
      className={iconSize === 32 ? styles.largeIconsGrid : styles.smallIconsGrid}
      role="list"
      aria-label="ファイル一覧"
      onContextMenu={(e) => {
        // 項目側で処理済み (defaultPrevented) なら何もしない
        if (!onBackgroundContextMenu || e.defaultPrevented) return;
        e.preventDefault();
        onBackgroundContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {items.map((node) => {
        const isSelected = selectedIds.includes(node.id);
        return (
          <div
            key={node.id}
            className={`${styles.iconItem} ${isSelected ? styles.iconItemSelected : ''}`}
            role="listitem"
            onClick={(e) => handleClick(node.id, e)}
            onDoubleClick={() => handleDoubleClick(node)}
            onContextMenu={(e) => {
              if (!onItemContextMenu) return;
              e.preventDefault();
              onItemContextMenu(node, { x: e.clientX, y: e.clientY });
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDoubleClick(node);
              }
            }}
          >
            <img
              src={getIcon(node)}
              width={iconSize}
              height={iconSize}
              alt=""
              style={{ imageRendering: 'pixelated' }}
            />
            <span className={styles.iconLabel}>{node.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function ListView({
  items,
  selectedIds,
  onSelectionChange,
  onNavigate,
  onItemContextMenu,
  onBackgroundContextMenu,
}: {
  items: FSNode[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onNavigate: (id: string) => void;
  onItemContextMenu?: (item: FSNode, position: { x: number; y: number }) => void;
  onBackgroundContextMenu?: (position: { x: number; y: number }) => void;
}) {
  const handleClick = (id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([id]);
    }
  };

  const handleDoubleClick = (node: FSNode) => {
    if (node.type === 'folder' || node.type === 'drive') {
      onNavigate(node.id);
    }
  };

  return (
    <div
      className={styles.listView}
      role="list"
      aria-label="ファイル一覧"
      onContextMenu={(e) => {
        if (!onBackgroundContextMenu || e.defaultPrevented) return;
        e.preventDefault();
        onBackgroundContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {items.map((node) => {
        const isSelected = selectedIds.includes(node.id);
        return (
          <div
            key={node.id}
            className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`}
            role="listitem"
            onClick={(e) => handleClick(node.id, e)}
            onDoubleClick={() => handleDoubleClick(node)}
            onContextMenu={(e) => {
              if (!onItemContextMenu) return;
              e.preventDefault();
              onItemContextMenu(node, { x: e.clientX, y: e.clientY });
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDoubleClick(node);
              }
            }}
          >
            <img
              src={getIcon(node)}
              width={16}
              height={16}
              alt=""
              style={{ imageRendering: 'pixelated', flexShrink: 0 }}
            />
            <span className={styles.listLabel}>{node.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FileList({
  items,
  selectedIds,
  onSelectionChange,
  onNavigate,
  viewMode = 'details',
  onItemContextMenu,
  onBackgroundContextMenu,
}: FileListProps) {
  const [sort, setSort] = useState<TableSortState<FileRow>>({
    columnKey: null,
    direction: 'asc',
  });

  const rows = useMemo<FileRow[]>(
    () =>
      items.map((node) => ({
        id: node.id,
        name: node.name,
        size: formatSize(node),
        type: formatType(node),
        modified: formatDate(node),
        _node: node,
      })),
    [items],
  );

  const visibleRows = useMemo(() => {
    if (sort.columnKey == null) return rows;
    return [...rows].sort((left, right) => compareRows(left, right, sort));
  }, [rows, sort]);

  const visibleItems = useMemo(() => visibleRows.map((row) => row._node), [visibleRows]);

  // Render based on view mode
  if (viewMode === 'largeIcons') {
    return (
      <IconView
        items={visibleItems}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onNavigate={onNavigate}
        onItemContextMenu={onItemContextMenu}
        onBackgroundContextMenu={onBackgroundContextMenu}
        iconSize={32}
      />
    );
  }

  if (viewMode === 'smallIcons') {
    return (
      <IconView
        items={visibleItems}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onNavigate={onNavigate}
        onItemContextMenu={onItemContextMenu}
        onBackgroundContextMenu={onBackgroundContextMenu}
        iconSize={16}
      />
    );
  }

  if (viewMode === 'list') {
    return (
      <ListView
        items={visibleItems}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onNavigate={onNavigate}
        onItemContextMenu={onItemContextMenu}
        onBackgroundContextMenu={onBackgroundContextMenu}
      />
    );
  }

  // Default: details view with table
  return (
    <TableView
      columns={COLUMNS}
      rows={visibleRows}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      onRowDoubleClick={(row) => {
        if (row._node.type === 'folder' || row._node.type === 'drive') {
          onNavigate(row.id);
        }
      }}
      onRowContextMenu={
        onItemContextMenu
          ? (row, event) => onItemContextMenu(row._node, { x: event.clientX, y: event.clientY })
          : undefined
      }
      onContextMenu={(e) => {
        // 行側で処理済みなら余白クリックではない
        if (!onBackgroundContextMenu || e.defaultPrevented) return;
        e.preventDefault();
        onBackgroundContextMenu({ x: e.clientX, y: e.clientY });
      }}
      sort={sort}
      onSortChange={setSort}
      height="100%"
      style={{ height: '100%', background: '#ffffff' }}
    />
  );
}
