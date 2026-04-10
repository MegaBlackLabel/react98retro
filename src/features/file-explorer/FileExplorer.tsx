import { useCallback, useMemo, useRef, useState } from 'react';
import { Window } from '../../components/window/Window';
import { MenuBar } from '../../components/menu-bar/MenuBar';
import type { MenuBarMenu } from '../../components/menu-bar/MenuBar';
import { Toolbar } from '../../components/toolbar/Toolbar';
import type { ToolbarItemDef } from '../../components/toolbar/Toolbar';
import { AddressBar } from '../../components/address-bar/AddressBar';
import { StatusBar, StatusBarField } from '../../components/window/StatusBar';
import { FileTree } from './FileTree';
import { FileList } from './FileList';
import { useFileSystem, DEFAULT_FS, type ViewMode } from './useFileSystem';
import { ICONS } from '../../icons';
import styles from './FileExplorer.module.css';

export type FileExplorerProps = {
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  onClose?: () => void;
};

function buildMenus({
  hasSelection,
  hasClipboard,
  canRename,
  viewMode,
  onNewFolder,
  onDelete,
  onRename,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onSelectAll,
  onViewModeChange,
}: {
  hasSelection: boolean;
  hasClipboard: boolean;
  canRename: boolean;
  viewMode: ViewMode;
  onNewFolder: () => void;
  onDelete: () => void;
  onRename: () => void;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onViewModeChange: (mode: ViewMode) => void;
}): MenuBarMenu[] {
  return [
    {
      label: 'ファイル(F)',
      items: [
        {
          type: 'submenu',
          label: '新規作成',
          items: [{ type: 'item', label: 'フォルダ', onClick: onNewFolder }],
        },
        { type: 'separator' },
        { type: 'item', label: '削除', onClick: onDelete, disabled: !hasSelection },
        { type: 'item', label: '名前の変更', onClick: onRename, disabled: !canRename },
        { type: 'separator' },
        { type: 'item', label: '閉じる', onClick: onClose },
      ],
    },
    {
      label: '編集(E)',
      items: [
        { type: 'item', label: '切り取り', onClick: onCut, disabled: !hasSelection },
        { type: 'item', label: 'コピー', onClick: onCopy, disabled: !hasSelection },
        { type: 'item', label: '貼り付け', onClick: onPaste, disabled: !hasClipboard },
        { type: 'separator' },
        { type: 'item', label: 'すべて選択', onClick: onSelectAll },
      ],
    },
    {
      label: '表示(V)',
      items: [
        { type: 'item', label: 'ツールバー' },
        { type: 'item', label: 'ステータスバー' },
        { type: 'separator' },
        { type: 'item', label: '大きいアイコン', checked: viewMode === 'largeIcons', onClick: () => onViewModeChange('largeIcons') },
        { type: 'item', label: '小さいアイコン', checked: viewMode === 'smallIcons', onClick: () => onViewModeChange('smallIcons') },
        { type: 'item', label: '一覧', checked: viewMode === 'list', onClick: () => onViewModeChange('list') },
        { type: 'item', label: '詳細', checked: viewMode === 'details', onClick: () => onViewModeChange('details') },
        { type: 'separator' },
        { type: 'item', label: '最新の情報に更新' },
      ],
    },
    {
      label: 'お気に入り(A)',
      items: [{ type: 'item', label: 'お気に入りに追加...' }],
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
      items: [{ type: 'item', label: 'ヘルプ トピック' }, { type: 'separator' }, { type: 'item', label: 'バージョン情報' }],
    },
  ];
}

function buildToolbar(
  canGoBack: boolean,
  canGoForward: boolean,
  canGoUp: boolean,
  hasSelection: boolean,
  hasClipboard: boolean,
  viewMode: ViewMode,
  onBack: () => void,
  onForward: () => void,
  onUp: () => void,
  onCut: () => void,
  onCopy: () => void,
  onPaste: () => void,
  onDelete: () => void,
  onViewModeChange: (mode: ViewMode) => void,
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
    { type: 'button', id: 'cut', icon: ICONS.cut, label: '切り取り', tooltip: '切り取り', disabled: !hasSelection, onClick: onCut },
    { type: 'button', id: 'copy', icon: ICONS.copy, label: 'コピー', tooltip: 'コピー', disabled: !hasSelection, onClick: onCopy },
    { type: 'button', id: 'paste', icon: ICONS.paste, label: '貼り付け', tooltip: '貼り付け', disabled: !hasClipboard, onClick: onPaste },
    { type: 'separator' },
    { type: 'button', id: 'delete', icon: ICONS.delete, label: '削除', tooltip: '削除', disabled: !hasSelection, onClick: onDelete },
    { type: 'button', id: 'properties', icon: ICONS.properties, label: 'プロパティ', tooltip: 'プロパティ', disabled: true },
    { type: 'separator' },
    { 
      type: 'splitButton', 
      id: 'views', 
      icon: ICONS.shellWindow, 
      label: '表示', 
      tooltip: '表示', 
      items: [
        { label: '大きいアイコン', checked: viewMode === 'largeIcons', onClick: () => onViewModeChange('largeIcons') },
        { label: '小さいアイコン', checked: viewMode === 'smallIcons', onClick: () => onViewModeChange('smallIcons') },
        { label: '一覧', checked: viewMode === 'list', onClick: () => onViewModeChange('list') },
        { label: '詳細', checked: viewMode === 'details', onClick: () => onViewModeChange('details') },
      ] 
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
  const [viewMode, setViewMode] = useState<ViewMode>('details');

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
    createFolder,
    deleteNodes,
    renameNode,
    copyToClipboard,
    cutToClipboard,
    paste,
    hasClipboard,
  } = useFileSystem(DEFAULT_FS);

  const displayPath = getDisplayPath();
  const title =
    currentNode?.name ?? 'マイコンピュータ';

  const selectedTotalBytes = selectedIds.reduce((sum, id) => {
    const node = currentChildren.find((c) => c.id === id);
    return sum + (node?.size ?? 0);
  }, 0);

  const canRename = selectedIds.length === 1;

  const handleNewFolder = useCallback(() => {
    const newId = createFolder(currentPath, '新しいフォルダー');
    if (newId) {
      setSelectedIds([newId]);
    }
  }, [createFolder, currentPath]);

  const handleDelete = useCallback(() => {
    if (!selectedIds.length) return;
    deleteNodes(selectedIds);
  }, [deleteNodes, selectedIds]);

  const handleRename = useCallback(() => {
    if (selectedIds.length !== 1) return;
    const targetId = selectedIds[0];
    if (!targetId) return;
    const nextName = window.prompt('名前の変更', currentChildren.find((item) => item.id === targetId)?.name ?? '');
    if (!nextName || !nextName.trim()) return;
    renameNode(targetId, nextName.trim());
  }, [currentChildren, renameNode, selectedIds]);

  const handleCut = useCallback(() => {
    if (!selectedIds.length) return;
    cutToClipboard(selectedIds);
  }, [cutToClipboard, selectedIds]);

  const handleCopy = useCallback(() => {
    if (!selectedIds.length) return;
    copyToClipboard(selectedIds);
  }, [copyToClipboard, selectedIds]);

  const handlePaste = useCallback(() => {
    paste(currentPath);
  }, [currentPath, paste]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(currentChildren.map((item) => item.id));
  }, [currentChildren]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const menus = useMemo(() => buildMenus({
    hasSelection: selectedIds.length > 0,
    hasClipboard,
    canRename,
    viewMode,
    onNewFolder: handleNewFolder,
    onDelete: handleDelete,
    onRename: handleRename,
    onClose: onClose ?? (() => {}),
    onCut: handleCut,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onViewModeChange: handleViewModeChange,
  }), [canRename, currentChildren, handleCopy, handleCut, handleDelete, handleNewFolder, handlePaste, handleRename, handleSelectAll, hasClipboard, onClose, selectedIds.length, viewMode, handleViewModeChange]);

  const toolbarItems = useMemo(() => buildToolbar(
    canGoBack,
    canGoForward,
    canGoUp,
    selectedIds.length > 0,
    hasClipboard,
    viewMode,
    goBack,
    goForward,
    goUp,
    handleCut,
    handleCopy,
    handlePaste,
    handleDelete,
    handleViewModeChange,
  ), [canGoBack, canGoForward, canGoUp, handleCopy, handleCut, handleDelete, handlePaste, hasClipboard, goBack, goForward, goUp, selectedIds.length, viewMode, handleViewModeChange]);

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
        <MenuBar menus={menus} rightIcons={[ICONS.windowsSlanted]} />
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
              viewMode={viewMode}
            />
          </div>
        </div>
      </div>
    </Window>
  );
}
