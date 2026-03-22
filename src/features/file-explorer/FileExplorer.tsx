import { useCallback, useRef, useState } from 'react';
import { Window } from '../../components/window/Window';
import { MenuBar } from '../../components/menu-bar/MenuBar';
import type { MenuBarMenu } from '../../components/menu-bar/MenuBar';
import { Toolbar } from '../../components/toolbar/Toolbar';
import type { ToolbarItemDef } from '../../components/toolbar/Toolbar';
import { AddressBar } from '../../components/address-bar/AddressBar';
import { StatusBar, StatusBarField } from '../../components/window/StatusBar';
import { FileTree } from './FileTree';
import { FileList } from './FileList';
import { useFileSystem, DEFAULT_FS } from './useFileSystem';
import { ICONS } from '../../icons';
import styles from './FileExplorer.module.css';

export type FileExplorerProps = {
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  onClose?: () => void;
};

const MENUS: MenuBarMenu[] = [
  {
    label: 'ファイル(F)',
    items: [
      {
        type: 'submenu',
        label: '新規作成',
        items: [
          { type: 'item', label: 'フォルダ' },
          { type: 'item', label: 'ショートカット' },
        ],
      },
      { type: 'separator' },
      { type: 'item', label: '開く' },
      { type: 'item', label: '印刷' },
      { type: 'separator' },
      { type: 'item', label: '削除' },
      { type: 'item', label: '名前の変更' },
      { type: 'item', label: 'プロパティ' },
      { type: 'separator' },
      { type: 'item', label: '閉じる' },
    ],
  },
  {
    label: '編集(E)',
    items: [
      { type: 'item', label: '切り取り' },
      { type: 'item', label: 'コピー' },
      { type: 'item', label: '貼り付け' },
      { type: 'separator' },
      { type: 'item', label: 'すべて選択' },
      { type: 'item', label: '選択の反転' },
    ],
  },
  {
    label: '表示(V)',
    items: [
      { type: 'item', label: 'ツールバー' },
      { type: 'item', label: 'ステータスバー' },
      { type: 'separator' },
      { type: 'item', label: '大きいアイコン' },
      { type: 'item', label: '小さいアイコン' },
      { type: 'item', label: '一覧' },
      { type: 'item', label: '詳細', checked: true },
      { type: 'separator' },
      { type: 'item', label: '最新の情報に更新' },
    ],
  },
  {
    label: 'お気に入り(A)',
    items: [
      { type: 'item', label: 'お気に入りに追加...' },
    ],
  },
  {
    label: 'ツール(T)',
    items: [
      { type: 'item', label: 'ネットワーク ドライブの割り当て...' },
      { type: 'item', label: 'ネットワーク ドライブの切断...' },
      { type: 'separator' },
      { type: 'item', label: 'フォルダ オプション...' },
    ],
  },
  {
    label: 'ヘルプ(H)',
    items: [
      { type: 'item', label: 'ヘルプ トピック' },
      { type: 'separator' },
      { type: 'item', label: 'バージョン情報' },
    ],
  },
];

function buildToolbar(
  canGoBack: boolean,
  canGoForward: boolean,
  canGoUp: boolean,
  onBack: () => void,
  onForward: () => void,
  onUp: () => void,
): ToolbarItemDef[] {
  return [
    {
      type: 'button',
      id: 'back',
      icon: ICONS.back,
      label: '戻る',
      tooltip: '戻る',
      disabled: !canGoBack,
      onClick: onBack,
    },
    {
      type: 'button',
      id: 'forward',
      icon: ICONS.forward,
      label: '進む',
      tooltip: '進む',
      disabled: !canGoForward,
      onClick: onForward,
    },
    {
      type: 'button',
      id: 'up',
      icon: ICONS.up,
      label: '上へ',
      tooltip: '上へ',
      disabled: !canGoUp,
      onClick: onUp,
    },
    { type: 'separator' },
    {
      type: 'button',
      id: 'cut',
      icon: ICONS.cut,
      label: '切り取り',
      tooltip: '切り取り',
    },
    {
      type: 'button',
      id: 'copy',
      icon: ICONS.copy,
      label: 'コピー',
      tooltip: 'コピー',
    },
    {
      type: 'button',
      id: 'paste',
      icon: ICONS.paste,
      label: '貼り付け',
      tooltip: '貼り付け',
    },
    { type: 'separator' },
    {
      type: 'button',
      id: 'delete',
      icon: ICONS.delete,
      label: '削除',
      tooltip: '削除',
    },
    {
      type: 'button',
      id: 'properties',
      icon: ICONS.properties,
      label: 'プロパティ',
      tooltip: 'プロパティ',
    },
    { type: 'separator' },
    {
      type: 'splitButton',
      id: 'views',
      icon: ICONS.shellWindow,
      label: '表示',
      tooltip: '表示',
      items: [
        { label: 'サンプル1', onClick: () => {} },
        { label: 'サンプル2', onClick: () => {} },
        { label: 'サンプル3', onClick: () => {} },
      ],
    },
  ];
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} バイト`;
}

export function FileExplorer({
  initialWidth = 640,
  initialHeight = 480,
  initialX = 50,
  initialY = 50,
  onClose,
}: FileExplorerProps) {
  const [leftWidth, setLeftWidth] = useState(200);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: leftWidth };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current) return;
      const delta = moveEvent.clientX - dragState.current.startX;
      setLeftWidth(Math.max(60, dragState.current.startWidth + delta));
    };

    const onMouseUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [leftWidth]);

  const {
    fs,
    currentPath,
    currentChildren,
    selectedIds,
    setSelectedIds,
    navigate,
    goBack,
    goForward,
    goUp,
    canGoBack,
    canGoForward,
    canGoUp,
    getDisplayPath,
    currentNode,
  } = useFileSystem(DEFAULT_FS);

  const displayPath = getDisplayPath();
  const title =
    currentNode?.name ?? 'マイコンピュータ';

  const selectedTotalBytes = selectedIds.reduce((sum, id) => {
    const node = currentChildren.find((c) => c.id === id);
    return sum + (node?.size ?? 0);
  }, 0);

  const toolbarItems = buildToolbar(
    canGoBack,
    canGoForward,
    canGoUp,
    goBack,
    goForward,
    goUp,
  );

  const statusBar = (
    <StatusBar>
      <StatusBarField>{currentChildren.length} 個のオブジェクト</StatusBarField>
      {selectedIds.length > 0 && (
        <StatusBarField>{formatBytes(selectedTotalBytes)}</StatusBarField>
      )}
      <StatusBarField>空き領域 15.0 GB</StatusBarField>
    </StatusBar>
  );

  return (
    <Window
      title={title}
      icon={ICONS.myComputer}
      width={initialWidth}
      height={initialHeight}
      initialX={initialX}
      initialY={initialY}
      onClose={onClose}
      statusBar={statusBar}
    >
      <div className={styles.explorerBody}>
        <MenuBar menus={MENUS} rightIcons={[ICONS.windowsSlanted]} />
        <div className={styles.groove} />
        <Toolbar items={toolbarItems} />
        <div className={styles.groove} />
        <AddressBar
          value={displayPath}
          onNavigate={navigate}
          label="アドレス(D):"
        />
        <div className={styles.groove} />
        <div className={styles.mainContent}>
          <div className={styles.leftPane} style={{ width: leftWidth }}>
            <FileTree
              fs={fs}
              currentPath={currentPath}
              onNavigate={navigate}
            />
          </div>
          <div
            className={styles.splitter}
            onMouseDown={handleSplitterMouseDown}
          />
          <div className={styles.rightPane}>
            <FileList
              items={currentChildren}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onNavigate={navigate}
            />
          </div>
        </div>
      </div>
    </Window>
  );
}
