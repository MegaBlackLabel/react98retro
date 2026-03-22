# Copilot Instructions

## Project Overview

Windows 98 File Explorer の完全なブラウザ再現。98.css をベースに React コンポーネントライブラリを構築し、ドラッグ・リサイズ可能なウィンドウ上でファイルエクスプローラーを動作させることがゴール。

## Runtime & Tooling

**すべてのランタイムは mise 経由で実行すること。システムの `bun`, `node`, `npm` を直接呼ばない。**

```bash
# 正しい呼び方
mise exec bun -- <args>
mise exec node -- <args>

# プロジェクトスクリプトは mise run を使う
mise run dev
mise run build
mise run test
mise run storybook
```

バージョンは `.mise.toml` に定義されており、勝手に変更しない。

## Tech Stack

| Tool | Version |
|------|---------|
| Bun | latest (パッケージマネージャー & ランタイム) |
| Vite | 8.x |
| React | 19.x |
| TypeScript | latest |
| 98.css | latest (UIスタイルの基盤) |
| Storybook | latest |
| Vitest | latest |
| @testing-library/react | latest |

## Commands

> **Note**: `mise exec bun` has a known issue on Windows. Use the direct bun path or `bun run` instead.

```bash
# 開発サーバー起動
bun run dev

# ビルド
bun run build

# テスト（全件）
bun run test

# テスト（単体ファイル指定）
bunx vitest run src/components/button/Button.test.tsx

# テスト（watchモード）
bun run test:watch

# カバレッジ
bun run test:coverage

# Storybook起動
bun run storybook

# 型チェック
bunx tsc --noEmit

# lint
bun run lint
```

## Implementation Phases

実装は以下の6フェーズで進める。依存関係の順に実施すること。

### Phase 1: プロジェクトセットアップ ✅ 完了
- Vite 8 + React 19 + TypeScript プロジェクト
- 98.css, clsx インストール
- Vitest + @testing-library/react セットアップ
- Storybook 10 (react-vite) セットアップ
- `.mise.toml` にランタイムバージョン定義

### Phase 2: 基本コンポーネント実装（98.css準拠）
**2-1. 既存98.cssコンポーネント（全14種）**
Button / Checkbox / OptionButton / GroupBox / TextBox / TextArea / Slider / Dropdown / Window / TitleBar / StatusBar / TreeView / Tabs / TableView

**2-2. 新規実装コンポーネント（98.css未収録）**
MenuBar（PR#167参照） / Toolbar / AddressBar

### Phase 3: ウィンドウ管理機能
- `useDraggable` — タイトルバードラッグでウィンドウ移動
- `useResizable` — 8方向リサイズハンドル
- `useWindowManager` — z-index管理・最小化/最大化/復元

### Phase 4: ファイルエクスプローラー実装
- `useFileSystem` — 仮想ファイルシステム（メモリ内ツリー）
- `FileTree` — 左ペイン（TreeViewベース）
- `FileList` — 右ペイン（TableViewベース）
- エクスプローラー用 MenuBar / Toolbar / StatusBar
- `FileExplorer` — 全コンポーネントの組み立て

### Phase 5: アイコン管理
- `src/icons/index.ts` — `windows98-icons/png/` のカテゴリ別マッピング
- `<Icon>` コンポーネント — 16px/32px サイズ対応

### Phase 6: Storybook & テスト整備
- 全コンポーネントの `.stories.tsx` 作成
- Vitest による全コンポーネントテスト
- ファイルエクスプローラーのフルデモストーリー



### ディレクトリ構成

```
src/
  components/          # 98.css準拠の汎用UIコンポーネント
    button/
    checkbox/
    option-button/
    group-box/
    text-box/
    text-area/
    slider/
    dropdown/
    window/            # Window, TitleBar, StatusBar
    tabs/
    tree-view/
    table-view/
    menu-bar/          # 98.css未収録 - PR#167参照で独自実装
    toolbar/           # 98.css未収録 - スタンダードツールバー
    address-bar/       # 98.css未収録 - アドレスバー
  features/
    file-explorer/     # ファイルエクスプローラー本体
      FileExplorer.tsx
      FileTree.tsx     # 左ペイン（TreeViewベース）
      FileList.tsx     # 右ペイン（TableViewベース）
      useFileSystem.ts # 仮想ファイルシステム（メモリ内）
  hooks/
    useDraggable.ts    # ウィンドウドラッグ移動
    useResizable.ts    # ウィンドウ8方向リサイズ
    useWindowManager.ts # z-index管理・min/max/restore
  icons/
    index.ts           # windows98-icons/png/ のマッピング定義
windows98-icons/png/   # Windows 98アイコン素材（PNG）
image/                 # 目標スクリーンショット（001103-zokusei01.png）
```

### コンポーネント設計の原則

- 各コンポーネントは `src/components/<name>/` に配置し、`index.ts` でエクスポート
- 各ディレクトリに `<Name>.tsx`, `<Name>.test.tsx`, `<Name>.stories.tsx` を同梱
- 98.css のクラス名をそのまま使い、追加スタイルは CSS Modules (`.module.css`) で管理
- `className` は `clsx` で結合する（条件付きクラス名）

### 98.css コンポーネント対応表

98.css の HTML クラスをラップした React コンポーネントとして実装する。

| コンポーネント | 98.css クラス/要素 |
|---|---|
| Button | `<button>`, `.default` |
| Checkbox | `<input type="checkbox">` + `<label>` |
| OptionButton | `<input type="radio">` + `<label>` |
| GroupBox | `<fieldset>` + `<legend>` |
| TextBox | `<input type="text">` |
| TextArea | `<textarea>` |
| Slider | `<input type="range">`, `.has-box-indicator`, `.is-vertical` |
| Dropdown | `<select>` |
| Window | `.window` |
| TitleBar | `.title-bar`, `.title-bar-text`, `.title-bar-controls` |
| StatusBar | `.status-bar`, `.status-bar-field` |
| TreeView | `ul.tree-view`, `<details>/<summary>` |
| Tabs | `menu[role=tablist]`, `li[role=tab]`, `.multirows` |
| TableView | `<table>`, `.interactive`, `.highlighted`, `.sunken-panel` |

### 98.css にない独自コンポーネント

- **MenuBar**: [jdan/98.css PR#167](https://github.com/jdan/98.css/pull/167) のCSSを参考に実装。ドロップダウン・サブメニュー・セパレータ・チェック/無効アイテム対応。キーボードナビ（矢印キー・Escape）必須。
- **Toolbar**: `role="toolbar"` + アイコンボタン群。ボタン間にセパレータ（縦線）。ツールチップ対応。
- **AddressBar**: 「アドレス(D):」ラベル + コンボボックス（`<input>` + `<datalist>` または `<select>`）。

### ウィンドウ管理

- `useDraggable`: タイトルバーの `pointerdown` でドラッグ開始、`pointermove`/`pointerup` で移動。`position: fixed` + `transform` で位置管理。
- `useResizable`: ウィンドウ端に8方向リサイズハンドルを配置。カーソルスタイルも変更。
- `useWindowManager`: 複数ウィンドウの z-index を配列順で管理。クリックで最前面化。

### 仮想ファイルシステム

実際の OS ファイルシステムには**アクセスしない**。`useFileSystem` がメモリ内ツリー構造を管理する。

```typescript
type FSNode = {
  name: string;
  type: 'file' | 'folder' | 'drive';
  children?: FSNode[];
  size?: number;
  modified?: Date;
  icon?: string; // windows98-icons/png/ のファイル名
};
```

デフォルトデータは Windows 98 的な構成（`C:\WINDOWS`, `C:\WINDOWS\System32`, `C:\My Documents`, `C:\Program Files` 等）を用意する。

### アイコン

- アイコン素材は `windows98-icons/png/` 以下の PNG を使用
- `src/icons/index.ts` でファイル種別・用途ごとにマッピングを定義
- `<Icon name="..." size={16|32} />` コンポーネントでレンダリング
- ツールバーアイコンは 16px、デスクトップ・ファイルリストの大アイコンは 32px

## Storybook

- ストーリーファイルは各コンポーネントと同じディレクトリに置く: `<Name>.stories.tsx`
- `default export` に `meta` オブジェクト（title, component, argTypes）
- `Controls` addon でインタラクティブに props 変更できること
- ファイルエクスプローラーのフルデモは `src/features/file-explorer/FileExplorer.stories.tsx`

## Testing

- Vitest + @testing-library/react を使用
- テストファイルは同ディレクトリに `<Name>.test.tsx`
- 単体テストで確認すること:
  - コンポーネントが正しくレンダリングされること
  - `userEvent` によるインタラクション（クリック・キー入力）
  - アクセシビリティ（aria 属性）
- `useFileSystem` などの hooks は `renderHook` でテスト

## Key References

- 目標UI: `image/001103-zokusei01.png`（Windows 98ファイルエクスプローラーのスクリーンショット）
- 98.css ドキュメント: https://jdan.github.io/98.css/
- MenuBar実装参照: https://github.com/jdan/98.css/pull/167
- 参照プロジェクト: https://github.com/lisandro52/react-winplaza-98
