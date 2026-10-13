import { useState } from 'react';
import { FileExplorer } from './features/file-explorer/FileExplorer';
import { DesktopIcons, StartMenu, Taskbar, Win98Provider } from './components';
import type { DesktopIconItem, StartMenuItem } from './components';
import { ICONS } from './icons';
import { useMobile } from './hooks/useMobile';

interface ExplorerConfig {
  id: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
}

const EXPLORERS: ExplorerConfig[] = [
  {
    id: 'explorer-1',
    initialX: 20,
    initialY: 20,
    initialWidth: 780,
    initialHeight: 500,
  },
  {
    id: 'explorer-2',
    initialX: 300,
    initialY: 100,
    initialWidth: 700,
    initialHeight: 450,
  },
];

/** デスクトップ アイコン (Win98 の既定は マイ コンピュータ / マイ ドキュメント / ごみ箱)。 */
const DESKTOP_ITEMS: DesktopIconItem[] = [
  { id: 'my-computer', label: 'マイ コンピュータ', icon: ICONS.myComputer, x: 8, y: 8 },
  { id: 'my-documents', label: 'マイ ドキュメント', icon: ICONS.myDocuments, x: 8, y: 83 },
  { id: 'recycle-bin', label: 'ごみ箱', icon: ICONS.recycleBinEmpty, x: 8, y: 158 },
];

function App() {
  const { isMobile } = useMobile();
  const [openExplorers, setOpenExplorers] = useState<Set<string>>(() => new Set(['explorer-1']));
  const [desktopItems, setDesktopItems] = useState<DesktopIconItem[]>(DESKTOP_ITEMS);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const openExplorer = () => {
    setOpenExplorers((prev) => {
      const closed = EXPLORERS.find((e) => !prev.has(e.id));
      if (!closed) return prev;
      const next = new Set(prev);
      next.add(closed.id);
      return next;
    });
  };

  const handleClose = (id: string) => {
    setOpenExplorers((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const startMenuItems: StartMenuItem[] = [
    {
      type: 'submenu',
      label: 'プログラム',
      items: [
        { type: 'item', label: 'エクスプローラ', icon: ICONS.folderWindows, onClick: openExplorer },
        { type: 'submenu', label: 'アクセサリ', items: [{ type: 'item', label: 'メモ帳', disabled: true }] },
      ],
    },
    {
      type: 'submenu',
      label: 'お気に入り',
      items: [{ type: 'item', label: 'チャンネル', disabled: true }],
    },
    {
      type: 'submenu',
      label: 'ドキュメント',
      items: [{ type: 'item', label: 'マイ ドキュメント', icon: ICONS.myDocuments, onClick: openExplorer }],
    },
    {
      type: 'submenu',
      label: '設定',
      items: [
        { type: 'item', label: 'コントロール パネル', disabled: true },
        { type: 'item', label: 'タスクバーとスタート メニュー', disabled: true },
      ],
    },
    {
      type: 'submenu',
      label: '検索',
      items: [{ type: 'item', label: 'ファイルやフォルダ', disabled: true }],
    },
    { type: 'item', label: 'ヘルプ', disabled: true },
    { type: 'item', label: 'ファイル名を指定して実行', disabled: true },
    { type: 'separator' },
    { type: 'item', label: 'ログオフ', disabled: true },
    { type: 'item', label: '終了', disabled: true },
  ];

  return (
    <Win98Provider
      autoMoveOnSnap
      mobile={isMobile}
      style={{ width: '100vw', height: '100dvh', background: '#008080', position: 'relative', overflow: 'hidden' }}
    >
      {/* デスクトップ アイコン層 (ウィンドウより背面) */}
      <DesktopIcons
        items={desktopItems}
        selectedId={selectedIconId}
        onSelect={setSelectedIconId}
        onOpen={openExplorer}
        onMove={(id, position) =>
          setDesktopItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...position } : item)))
        }
        style={{ position: 'absolute', inset: 0 }}
      />

      {EXPLORERS.map((explorer) =>
        openExplorers.has(explorer.id) ? (
          <FileExplorer
            key={explorer.id}
            initialX={explorer.initialX}
            initialY={explorer.initialY}
            initialWidth={Math.min(
              explorer.initialWidth,
              typeof window !== 'undefined' ? window.innerWidth - 40 : explorer.initialWidth
            )}
            initialHeight={Math.min(
              explorer.initialHeight,
              typeof window !== 'undefined' ? window.innerHeight - 40 : explorer.initialHeight
            )}
            onClose={() => handleClose(explorer.id)}
          />
        ) : null
      )}

      {/* スタート メニュー (タスクバーの上に開く) */}
      {startMenuOpen && (
        <StartMenu
          items={startMenuItems}
          onClose={() => setStartMenuOpen(false)}
          ignoreOutsidePressSelector="[data-taskbar-start]"
          style={{ position: 'fixed', left: 2, bottom: 30, zIndex: 100001 }}
        />
      )}

      {/* Win98 のタスクバー: 常に最前面、ウィンドウは作業領域 (上の 28px) まで最大化する */}
      <Taskbar
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100000 }}
        onStartClick={() => setStartMenuOpen((open) => !open)}
      />
    </Win98Provider>
  );
}

export default App
