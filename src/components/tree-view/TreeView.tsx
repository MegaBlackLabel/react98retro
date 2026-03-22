import {
  forwardRef,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import styles from './TreeView.module.css';

export type TreeViewItem = {
  id: string;
  label: ReactNode;
  icon?: string;
  children?: TreeViewItem[];
  defaultOpen?: boolean;
};

export type TreeViewProps = {
  items: TreeViewItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
} & ComponentPropsWithoutRef<'ul'>;

const renderTreeItem = (
  item: TreeViewItem,
  selectedId: string | undefined,
  onSelect: ((id: string) => void) | undefined,
) => {
  const isSelected = selectedId === item.id;
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    ...(isSelected ? { background: '#000080', color: 'white' } : {}),
  };

  if (item.children?.length) {
    return (
      <li key={item.id}>
        <details open={item.defaultOpen}>
          <summary style={rowStyle}>{item.label}</summary>
          <ul>{item.children.map((child) => renderTreeItem(child, selectedId, onSelect))}</ul>
        </details>
      </li>
    );
  }

  return (
    <li
      key={item.id}
      onClick={() => {
        onSelect?.(item.id);
      }}
    >
      <span style={rowStyle}>
        {item.icon ? (
          <img
            src={item.icon}
            width={16}
            height={16}
            alt=""
            aria-hidden="true"
            style={{ marginRight: 4, flexShrink: 0 }}
          />
        ) : null}
        {item.label}
      </span>
    </li>
  );
};

export const TreeView = forwardRef<HTMLUListElement, TreeViewProps>(
  ({ items, selectedId, onSelect, className, ...props }, ref) => (
    <ul ref={ref} className={clsx('tree-view', styles.treeView, className)} {...props}>
      {items.map((item) => renderTreeItem(item, selectedId, onSelect))}
    </ul>
  ),
);

TreeView.displayName = 'TreeView';
