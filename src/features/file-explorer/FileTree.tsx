import { TreeView } from '../../components/tree-view/TreeView';
import type { TreeViewItem } from '../../components/tree-view/TreeView';
import { ICONS } from '../../icons';
import type { FSNode } from './useFileSystem';

type FileTreeProps = {
  fs: FSNode[];
  currentPath: string;
  onNavigate: (id: string) => void;
};

function makeLabel(node: FSNode, onNavigate: (id: string) => void) {
  const icon =
    node.id === 'my-computer'
      ? ICONS.myComputer
      : node.type === 'drive'
        ? ICONS.hardDrive
        : ICONS.folderClosed;

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default', userSelect: 'none' }}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(node.id);
      }}
    >
      <img src={icon} width={16} height={16} alt="" style={{ imageRendering: 'pixelated' }} />
      {node.name}
    </span>
  );
}

function toTreeViewItems(
  nodes: FSNode[],
  onNavigate: (id: string) => void,
): TreeViewItem[] {
  return nodes
    .filter((n) => n.type !== 'file')
    .map((node) => ({
      id: node.id,
      label: makeLabel(node, onNavigate),
      defaultOpen: node.id === 'my-computer',
      children:
        node.children && node.children.some((c) => c.type !== 'file')
          ? toTreeViewItems(node.children, onNavigate)
          : undefined,
    }));
}

export function FileTree({ fs, currentPath, onNavigate }: FileTreeProps) {
  const items = toTreeViewItems(fs, onNavigate);

  return (
    <TreeView
      items={items}
      selectedId={currentPath}
      style={{ height: '100%', margin: 0 }}
    />
  );
}
