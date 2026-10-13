# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **ウインドウの外枠と一覧で文字が選択されないようにした**。ドラッグするとツールバーや一覧のテキストが選択されて青く伸び、ウィンドウを動かそうとしても動かない (選択が伸びるだけ) 状態だった。実物の Win98 も外枠と一覧は文字を選択できない。
  - 対象: タイトルバー / メニューバー / ツールバー / ステータスバー / メニュー / アドレスバー / テーブル / ツリー
  - ただし外枠の中に置いた入力 (ツールバーに入れる TextBox など) と、`.window-body` の本文は今までどおり選択できる (アドレスバーは `<select>` なので元から文字を選択できない)

## [0.4.2] - 2026-10-13

### Fixed

- **ステータスバーの右端に 17px のガター**を追加し、フィールドが右端まで伸びないようにした (実測)
- **サイズ グリップ**を実測の形に修正: ステータスバーの右端に置く **横 12px × 縦 12px** の領域に、4px ピッチの 45° ドット (白 1px + 灰 2px + 面 1px) を **斜め線 3 本**ぶん敷く。広がりは階段状 (`x + y >= 11` の 45° の境界より右下だけ)、位相は実測の行ごとの本数 (1,1,1,1,2,2,2,2,3,3,3,3) に合わせる。以前は三角形クリップ + 幅 8px で線が 2 本しか入っていなかった

## [0.4.1] - 2026-10-13

### Fixed

- **ステータスバー**を実測の形に修正。帯は 22px (上辺が白 1px + 面 2px + フィールド 17px + 面 2px)、フィールドの凹みは「上/左が `#808080`、下/右が `#ffffff`」。98.css の既定はフィールド 20px / 明ベベル `#dfdfdf` だったので、色と高さを実測 (Win98 のウィンドウ右下の 1px 実測) に寄せた
- サイズ グリップのドットを **4x4 のビットマップ タイル**で定義し直した。実測の規則は `(x + y) % 4 == 0` が `#ffffff`、`1` と `2` が `#808080`、`3` が面の色で、4px ピッチの 45°。以前は 135deg のグラデーションで描いていたため、「1px」が軸方向の長さになって水平方向の太さがずれ、白が 2px に見えていた (白 1px + 灰 2px になっていなかった)

## [0.4.0] - 2026-10-13

### Added

- `useToolbarRows` に `measure` オプション。項目が区切り線を自分の前に持つ場合など、要素の幅に足して詰めたいときに測り方を差し替えられる (既定は `getBoundingClientRect().width`)

### Fixed

- ウィンドウ右下のサイズ グリップ (拡大縮小のつまみ) を実測の形に修正。45° の 3 本は「白 1px + `#808080` **2px**」の 4px ピッチで、以前は灰が 1px と半分の太さだった。12x12 で右端・下端から 3px の位置に置く
- サイズ グリップは**ステータスバーがあるウィンドウにだけ**描くようにした (実物のグリップはステータスバーの右端にあるため)。リサイズ自体は不可視のハンドルで今までどおりできる

## [0.3.0] - 2026-10-13

### Added

**デスクトップ面**

- `DesktopIcons` コンポーネント: デスクトップのアイコン層。クリックで選択、ダブルクリック / Enter で開く、ドラッグ移動と 75px グリッド吸着 (`onSelect` / `onOpen` / `onMove`)。`role="listbox"` + 各アイコン `role="option"` なので選択状態がスクリーン リーダーに伝わる。
- `StartMenu` コンポーネント: 左端の縦帯バナー付きスタート メニュー。サブメニュー (150ms ホバー ディレイ)、セパレータ、無効項目、Escape / 矢印キー操作に対応。`ignoreOutsidePressSelector` で、スタート ボタンのような「メニューの外にあるトグル要素」を外側クリック判定から除外できる。
- `FileExplorer` の右クリック メニュー: 項目メニュー (開く / 切り取り / コピー / 名前の変更 / 削除) と余白メニュー (新規作成 ▸ フォルダ / 貼り付け / すべて選択)。`document.body` のポップアップ層に描画するので、ウィンドウの `overflow` や他ウィンドウの下に隠れない。右クリックした項目が未選択なら選択してからメニューを出す (Win98 と同じ挙動)。
- `TableView.onRowContextMenu`: 行の右クリックでブラウザ既定メニューを抑制して受け取れる。
- `Menu` が任意の DOM props を転送するようになり、`style` で位置を指定できる (コンテキスト メニュー用途)。
- `Taskbar` のスタート ボタンに `data-taskbar-start` 属性を付与 (外側クリック除外の目印)。
- デモにデスクトップ アイコン 3 個 (マイ コンピュータ / マイ ドキュメント / ごみ箱) とスタート メニューを配線。

**ツールバー帯 (ドッキング ツールバー)**

- `ToolbarBand` コンポーネント: ツールバー帯。外周の溝 (上辺の外の暗 1px / 上辺の明 1px / 明と暗の間の銀 1px / 下辺の暗 2px) と、折り返した段の間の 銀 1px + 溝 2px + 銀 2px を持つ。
- `ToolbarRow` コンポーネント: 1 段の枠。計測が終わるまで CSS でも折り返し、子を `flex: 0 0 auto` で縮めない (縮むと幅を測れず段分けが決まらない)。
- `useToolbarRows` / `packToolbarRows`: 帯と項目の幅を測って段に詰める。`keepWithNext` (ラベルとコントロールを離さない) 対応、`ResizeObserver` が無い環境 (SSR など) では計測せず 1 段のまま動く。項目数が変わった描画では存在しない index を返さない。
- `Toolbar` の `variant="band"`: 内容を実物のツールバー ボタンと同じ 22px ちょうどに詰める。
- `Groove` コンポーネント: 2px の凹んだ区切り (横 = 帯と帯の間 / 縦 = 同じ帯の中の区切り)。既定で `aria-hidden` (装飾)。
- CSS 変数: `--win98-toolbar-separator-height` / `--win98-toolbar-content-height` / `--win98-toolbar-gap` / `--win98-groove-dark` / `--win98-groove-light`。

### Changed

- `@types/node` 26.6.4 → 26.6.5。

### Fixed

- ツールバーの区切り線の高さを 16px → 18px。16px は「ボタン 22px の上下 3px 内側」という導出値で、Win98 実物のヘルプ画像 (`TOOLBAR.PNG` 559×49) を 1px 単位で測ると、区切り線 6 本すべて y=5..22 の 18px (22px ボタンの上下 2px 内側) だった。
- スタート ボタンが「開くだけ」になっていた問題。メニュー表示中にボタンを押すと、外側クリック判定で閉じた直後の click が再度開いてしまっていた。
- `Toolbar` / `ToolbarBand` を `forwardRef` に。呼ぶ側の ref が内部 ref を上書きしてドロップダウンの外側クリック判定が効かなくなる問題と、React 18 で ref が届かない問題。
- 帯の区切り (`Groove`) が読み上げに混ざっていた問題 (既定で `aria-hidden`)。
- Firefox など `::-webkit-scrollbar` が効かないブラウザでネイティブ スクロールバーになるのを避け、`scrollbar-color` で Win98 の 3D スクロールバーに寄せた。

## [0.2.6] - 2026-10-13

### Added

- `Taskbar` component: 28px band with the 3D top edge, 54x22 start button (grows for the Japanese label), task buttons in window-open order, and a sunken tray with an `HH:MM` clock that updates every minute. Exporting it publicly lets apps mount `<Taskbar />` inside `Win98Provider` and it derives its items from the window manager.
- `useWindowManager.register(id, { title, icon })` keeps display info for the taskbar, and in-place updates preserve z-order, `activeWindowId`, and minimized/maximized state.
- `Window` supports the Win98 interactions: title-bar double-click toggles maximize, minimize collapses the window into the taskbar, and maximized windows fill the work area (`--win98-work-area-bottom`).
- `MenuBar` opens menus with `Alt` + accelerator letter (focusing the first item); `Alt` alone focuses the menu bar.
- `report/20260413/report.md`: a measured comparison against real Windows 98 SE screenshots (method, sources, and unimplemented items).

### Changed

- Japanese UI text now uses the Windows 98 Japanese UI font: `MS UI Gothic` (falling back to `MS PGothic` → `Pixelated MS Sans Serif` → `DotGothic16`). `MS UI Gothic` renders from its 12px bitmap with no antialiasing, so glyphs are crisp instead of blurred (measured antialiasing on menu text: 40% → 6.6%, taskbar labels 45.5% → 0%).
- UI font size is 12px (MS UI Gothic 9pt, the Japanese Windows 98 metric) instead of the English 11px.
- Dimensions aligned to measured Windows 98 SE values: toolbar band 26→24px (buttons 24x24→22x22, separator 18→16px), menu bar 22px / items 20px, status bar 20px, address combo 20→21px. Height-sensitive surfaces are pinned so font metrics cannot shift them.
- The start button uses 54px as a minimum width so the Japanese label never wraps.

### Fixed

- Start button label no longer wraps to two lines.
- Text inside windows no longer renders partially blurred (the English pixel font always antialiased in Chromium).
- Dynamic window titles (e.g. navigating folders) no longer re-register the window and reset its z-order/minimized/active state.

## [0.2.5] - 2026-10-13

### Changed

- Text inside `.win98` now follows the Windows Standard scheme: body text is pure black `#000000` instead of the `#222` that 98.css applies to `body`. Highlight (`#000080` / `#ffffff`), grayed (`#808080`), and desktop icon label (`#ffffff`) colors are unchanged.
- Window surfaces (`title-bar`, `window-body`, `status-bar`) and the `MenuBar` popup layer are promoted to composited layers so pixel fonts are rasterized with grayscale antialiasing instead of Chromium's ClearType (LCD subpixel) antialiasing. The lever is applied per text surface because `will-change: transform` on `.win98` / `.window` would change the containing block of `position: fixed` descendants (window placement, modal backdrop).
- The demo's global CSS no longer sets `text-rendering: optimizeLegibility` and requests grayscale smoothing.

### Fixed

- Greenish/orange edges around all pixel-font text (menu bar, window body, popup menus) on Windows Chromium: 16.8% of glyph pixels were chromatic before, 0% after.

### Added

- README section "文字の配色と描画": the palette table, why ClearType tinting happens (and that `-webkit-font-smoothing` / `text-rendering` are ignored by Chromium), and how to apply the same treatment to custom text surfaces rendered outside `Window`.

## [0.2.4] - 2026-10-12

### Added

- `Window` `modal` prop: renders `role="dialog"` / `aria-modal="true"` / `aria-label={title}` (all overridable through props), draws a full-viewport backdrop that blocks interaction with the windows behind it, focuses itself on mount, and calls `onClose` on `Escape`.
- `MenuBar` top-level items expose `data-menu-id` (explicit `MenuBarMenu.id`, falling back to the label) so tests can target them without matching the split accelerator markup.
- `Tabs` `fill` prop (fills the parent height via flex) and `panelClassName` for styling the tab panel.
- `TableView` accepts `string | number` row ids and normalizes them internally, so numeric ids highlight and toggle correctly instead of silently failing.
- `Checkbox`, `OptionButton`, `TextBox`, and `TextArea` accept an omitted `label` (and `id`), rendering a bare input that can be named with `aria-label`.

### Changed

- The demo app now builds to `demo-dist` (GitHub Pages workflow updated) so `bun run build` no longer empties the library output in `dist`.
- README documents consumer-side setup: `resolve.dedupe: ['react', 'react-dom']`, tarball-based local installation, the fact that no `build.cssMinify` override is needed, and how to control stacking order with `zIndex` instead of wrapper CSS.

## [0.2.3] - 2026-06-13

### Added

- `Window` snap overlap avoidance: when a snapped foreground window overlaps a lower-z snapped background window, the background window shrinks by the overlap amount instead of being hidden.
- `calculateShrinkRect` collision helper to compute minimal shrink geometry for overlapping rectangles.
- `useWindowManager` shrink/resize request state with `requestResize`, `clearResizeRequest`, `restoreShrink`, and `setWindowSnapped`.
- `Window` integration that resolves overlap by z-order priority, restores pre-shrink geometry on unsnap or manual drag/resize, and falls back to existing move-away behavior when shrink is impossible.
- Storybook `SnapOverlapShrink` scenario and Playwright visual QA script to verify zero overlap area after snap.
- `pack:lib` script (build + `bun pm pack`) and `prepublishOnly` guard so the published tarball always matches `exports`.

### Changed

- `WindowManagerContext` now exposes `resizeRequests`, `preShrinkGeometries`, `requestResize`, `clearResizeRequest`, `restoreShrink`, and `setWindowSnapped`.
- `MenuBar` dropdowns now render into a popup layer on `document.body` (`position: fixed`, high `z-index`) instead of inside the menubar subtree, so they are no longer hidden behind other windows or clipped by ancestor overflow.
- `Window` forwards arbitrary DOM props (`data-testid`, `aria-*`, ...) to its root element; a consumer `onPointerDown` is composed with the internal focus handling.
- Package metadata: `exports` now points `./style.css` at the emitted `dist/style.css`, `types` comes first, and `./package.json` is exported.
- Dependencies updated to their latest releases (React 19.3, Vite 8.3, Vitest 5, Storybook 10.6, ESLint 10.12, `@testing-library/jest-dom` 7, jsdom 30, Playwright 1.64, ...).
- TypeScript now runs as two toolchains: `@typescript/native` (TS 7 compiler for `tsc -b`) plus the TS 6 API package that `typescript-eslint` and `vite-plugin-dts` consume.

### Fixed

- Background snapped windows no longer remain hidden behind overlapping foreground snapped windows when `autoMoveOnSnap` is enabled.
- `import '@megablacklabel/react98retro/style.css'` failed to resolve because the export pointed at `dist/style.css` while the build emitted `dist/react98retro.css`.
- Consumers' `vite build` failed with `SyntaxError: [lightningcss minify] Invalid media query` because the bundled 98.css uses `@media (not(hover))`; the shipped CSS is now normalized to `@media not (hover)`.
- Snap preview could stay on screen after the pointer left the snap zone: the rAF throttle flag was never cleared when `requestAnimationFrame` runs synchronously.
- `Tabs` keyboard navigation no longer relies on a dead `nextIdx` initialization (`no-useless-assignment`), and `FileExplorer` callbacks declare their `setSelectedIds` dependency.


## [0.2.2] - 2026-06-12

### Added

- Unit tests for previously uncovered components and modules: `FieldRow`, `Win98Provider`, `Menu`, `SplitButton`, `FileTree`, `Icon`, icon mappings, and public barrel exports.
- Additional `FileExplorer` tests for status-bar object count, selected file size, and address-bar path.
- Expanded `components/index.test.ts` to assert exports of `FieldRow`, `Win98Provider`, `Window`, `Button`, `Menu`, and `SplitButton`.

### Changed

- Simplified `AddressBar` to use the controlled `value` prop directly instead of internal mirrored state.
- Refined drag, resize, and window-manager hooks to update refs inside `useEffect`, avoiding stale closures during pointer events.
- Updated the publish workflow to run only unit tests, removing the Playwright dependency from package releases.
- Bumped package version to 0.2.2.

### Fixed

- `Window` now schedules programmatic move requests with `requestAnimationFrame` before updating position and clearing the request.
- `useResizable` reliably removes the active pointer listeners on resize end.
- `FileList` sorting comparison now initializes the difference explicitly for each column case.
- `useFileSystem` derives the current node and display path directly from the latest filesystem state, keeping the address bar in sync after mutations.

## [0.2.1] - 2026-06-11

### Added

- Auto-move inactive windows on snap to prevent windows from being hidden
- `autoMoveOnSnap` prop on `Win98Provider` to enable/disable auto-move behavior (default: false)
- Per-window `autoMoveOnSnap` prop override on `Window` component
- Geometry tracking in `useWindowManager` via `updateGeometry`/`getAllGeometries`
- Move request system for programmatic window movement via `requestMove`/`clearMoveRequest`
- Collision detection utilities (`isColliding`, `calculateEscapePosition`, `findCollisions`)
- Window components automatically report position/size changes to the window manager
- Window components respond to move requests from the window manager
- Storybook preview configured with `autoMoveOnSnap: true` for component testing

### Changed

- `UseWindowManagerResult` interface now includes `geometries` and `moveRequests` state
- `Win98Provider` accepts optional `autoMoveOnSnap` prop
- Demo `App.tsx` enables `autoMoveOnSnap` for multi-window demonstration

### Fixed

- Inactive windows no longer get completely hidden behind snapped windows

## [0.2.0] - 2026-06-10

### Added

- Window focus management with automatic z-index coordination
- `WindowManagerContext` for multi-window state management
- Dynamic `register`/`unregister` in `useWindowManager` hook
- Auto-focus on first window registration
- Inactive window styling (gray title bar for Windows 98 look)
- Click-to-focus behavior on any window area
- `useWindowManager` exported from public API (`src/index.ts`)
- Multiple FileExplorer demo in `App.tsx`
- `bunfig.toml` with `minimumReleaseAge = 259200` (3 days)

### Changed

- Updated 22+ dependencies to latest versions
- `Win98Provider` now provides `WindowManagerContext`
- `Window.tsx` auto-detects context and participates in focus management

### Fixed

- Active window always stays on top when new windows register
- Single window inside Win98Provider now starts active (backward compat)

## [0.1.0] - 2026-04-10

### Added

- Scoped 98.css styles with Win98Provider to prevent global CSS conflicts
- GitHub Packages publishing support
- Mutable file system actions in the explorer (cut, copy, paste, delete, rename)
- Sortable table headers in file list views
- Explorer list sorting and view modes (details, icons, list)
- Menu and toolbar wiring for explorer actions
- Mobile and narrow viewport support for the file explorer window

### Fixed

- Drag and resize viewport clamping for better window boundary handling
- Window drag behavior after resize operations
- Toolbar separator styling to match menu groove style
- AddressBar grip margin alignment with MenuBar
- Menu bar usability in narrow layouts
- DotGothic16 font rendering on macOS
