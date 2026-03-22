import { TableView } from '../../components/table-view/TableView';
import type { TableColumn } from '../../components/table-view/TableView';
import { ICONS, getFileIcon } from '../../icons';
import type { FSNode } from './useFileSystem';

type FileListProps = {
  items: FSNode[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onNavigate: (id: string) => void;
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
  return `${kb} KB`;
}

function formatType(node: FSNode): string {
  if (node.type === 'folder') return 'ファイル フォルダ';
  if (node.type === 'drive') {
    if (node.id.startsWith('A:')) return '3.5 インチ FD';
    return 'ローカル ディスク';
  }
  const ext = node.name.split('.').pop()?.toUpperCase();
  if (!ext || !node.name.includes('.')) return 'ファイル';
  return `${ext} ファイル`;
}

function formatDate(node: FSNode): string {
  if (node.type === 'drive') return '';
  if (!node.modified) return '';
  const d = node.modified;
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd} ${hh}:${min}`;
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

export function FileList({ items, selectedIds, onSelectionChange, onNavigate }: FileListProps) {
  const rows: FileRow[] = items.map((node) => ({
    id: node.id,
    name: node.name,
    size: formatSize(node),
    type: formatType(node),
    modified: formatDate(node),
    _node: node,
  }));

  return (
    <TableView
      columns={COLUMNS}
      rows={rows}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      onRowDoubleClick={(row) => {
        if (row._node.type === 'folder' || row._node.type === 'drive') {
          onNavigate(row.id);
        }
      }}
      height="100%"
      style={{ height: '100%', background: '#ffffff' }}
    />
  );
}
