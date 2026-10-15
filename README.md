# react98retro

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

React で Windows 98 のコンポーネントを実装しました。

98.css をベースに React コンポーネントライブラリを構築し、ドラッグ・リサイズ可能なウィンドウ上で Windows 98 風のファイルエクスプローラーを動作させることを目標としたプロジェクトです。

🌐 **<a href="https://megablacklabel.github.io/react98retro/" target="_blank">デモを見る → https://megablacklabel.github.io/react98retro/</a>**

## スクリーンショット

![Windows 98 ファイルエクスプローラー](./image/screenshot.png)

## 実装コンポーネント

- **Window** — タイトルバー付き、ドラッグ移動・リサイズ対応ウィンドウ（`data-testid` などの任意 DOM props をそのまま転送。`modal` でダイアログ化）
- **MenuBar** — プルダウンメニュー付きメニューバー（ドロップダウンはポータル層 `document.body` に描画されるので他ウィンドウの下に隠れない。トップレベル項目に `data-menu-id` を出力）
- **Toolbar** — アイコン＋ラベル付きツールバー（SplitButton 対応。`variant="band"` で帯に詰める形になり、`--win98-toolbar-*` で寸法を差し替えられる）
- **ToolbarBand** — ツールバー帯（ドッキング ツールバー）。外周の溝と、折り返した段の間の溝を持つ
- **ToolbarRow** — ツールバー 1 段の枠。計測が終わるまで CSS でも折り返し、子を縮めない
- **useToolbarRows / packToolbarRows** — 帯と項目の幅を測って段に詰める（`keepWithNext` 対応、`measure` で項目幅の測り方を差し替え、`ResizeObserver` 無しでも 1 段で動く）
- **Groove** — 2px の凹んだ区切り線（横 = 帯と帯の間 / 縦 = 同じ帯の中の区切り）
- **AddressBar** — アドレスバー（ドロップダウン履歴付き）
- **TreeView** — フォルダツリー
- **TableView** — 列リサイズ対応ファイル一覧テーブル（行 `id` は `string | number`。内部で文字列に正規化してハイライト判定する。`onRowContextMenu` で行の右クリックを受け取れる）
- **Tabs** — タブ。`fill` で親の高さに追従、`panelClassName` でパネルへクラス追加
- **SplitButton** — アイコン＋▼ボタン＋メニューの複合ボタン
- **Menu** — ネスト対応コンテキストメニュー（任意の DOM props を転送するので `style` で位置指定できる）
- **DesktopIcons** — デスクトップのアイコン層（クリックで選択、ダブルクリックで開く、ドラッグ移動＋グリッド吸着。`onSelect` / `onOpen` / `onMove`）
- **StartMenu** — スタートメニュー（サブメニュー・セパレータ・無効項目対応。タスクバーの `onStartClick` から開く）
- **Button / CheckBox / Radio / TextBox / TextArea / GroupBox** など、98.css の全 UI コンポーネント
  - `Checkbox` / `OptionButton` / `TextBox` / `TextArea` の `label` は任意。省略すると `label` 要素を描画しないので、
    `<TextBox aria-label="検索" />` のようにアクセシブルネームだけ付けて素の入力として使える（`id` も省略可）

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite 8 |
| ランタイム | Bun |
| スタイル | 98.css |
| アイコン | Chicago95（jsDelivr CDN 経由で動的取得） |
| フォント | Pixelated MS Sans Serif / DotGothic16 |
| コンポーネントカタログ | Storybook |
| テスト | Vitest |

## 開発環境の起動

```bash
# 開発サーバー起動
bun run dev

# Storybook 起動
bun run storybook

# テスト実行
bun run test

# ビルド（デモアプリ）
bun run build

# ビルド（ライブラリ）
bun run build:lib
```

### ツールチェーンのメモ

- **TypeScript は 2 系統**で入っています。
  - `@typescript/native` (`npm:typescript@^7.0.2`) — `tsc -b` を実行するネイティブコンパイラ
  - `typescript` (`npm:typescript@^6.0.3`) — typescript-eslint / vite-plugin-dts が参照する TS 6 API
  - typescript-eslint は TS 7 の API に未対応（[#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)）のため分けています。`tsc -b` の解決先が TS 6 になっても型チェックは通ります。
- ストーリーテスト（vitest browser mode）は Playwright のブラウザを使います。未取得の場合は
  `bunx playwright install chromium-headless-shell` を実行してください。

## パッケージとして使う

このライブラリは [GitHub Packages](https://github.com/MegaBlackLabel/react98retro/packages) として公開されています。

### 1. 認証とレジストリの設定

> [!IMPORTANT]
> GitHub Packages は **public パッケージでも匿名アクセスに 401 を返します**（npmjs.com の
> public が匿名 200 なのと違います）。registry の追記だけでは `bun add` / `npm install` は
> 通りません。認証トークンが必要です。

トークンには **`read:packages`** が要ります。**トークンはコミットしないでください**（レジストリ行だけを
プロジェクトの `.npmrc` に置き、トークンは `~/.npmrc` か CI のシークレットに置きます）。

プロジェクトルートの `.npmrc`:

```
@megablacklabel:registry=https://npm.pkg.github.com
```

**ローカル** — `~/.npmrc` にトークンを置きます:

```
//npm.pkg.github.com/:_authToken=<read:packages 付きトークン>
```

gh CLI を使う場合:

```bash
gh auth refresh -s read:packages   # トークンに read:packages を足す
gh auth token                      # 表示された値を ~/.npmrc に貼る
```

Personal Access Token から作る場合は `read:packages` を付けて発行してください。

**CI (GitHub Actions)** — `GITHUB_TOKEN` を渡します。workflow の `permissions` に
`packages: read` が要ります（無いと 403 になります）:

```yaml
permissions:
  contents: read
  packages: read

steps:
  - name: Configure GitHub Packages
    run: |
      echo "@megablacklabel:registry=https://npm.pkg.github.com" > ~/.npmrc
      echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. インストール

```bash
npm install @megablacklabel/react98retro
# または
bun add @megablacklabel/react98retro
```

### 3. 使い方

```tsx
import { Window, Button, MenuBar } from '@megablacklabel/react98retro';
import '@megablacklabel/react98retro/style.css';

function App() {
  return (
    <Window title="My App" width={400} height={300} initialX={50} initialY={50}>
      <p>Hello, Windows 98!</p>
      <Button>OK</Button>
    </Window>
  );
}
```

`react` / `react-dom` は `peerDependencies` です（`>=18`）。バンドラに二重ロードさせないでください。

### 4. バンドラ設定（Vite）

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    // ライブラリは react / react-dom を external にしているので、
    // pnpm/nested install や alias 参照時に React が二重ロードされるのを防ぐ
    dedupe: ['react', 'react-dom'],
  },
});
```

`dedupe` が無いと `resolve.alias` などで `dist` を直接参照したときに React が 2 つ読み込まれ、
`useRef` などが `null is not an object` で落ちます。

CSS minify は既定のままで問題ありません（consumer 側で `build.cssMinify` を変更する必要はありません）。
ビルド済み `style.css` は lightningcss で解析できる形に正規化済みです（98.css の
`@media (not(hover))` を `@media not (hover)` に変換して同梱）。

### 5. 重なり順とモーダル

`Window` は root に inline の `z-index` を持ち、クリックで前面化します。重なり順は
**`zIndex` prop で制御**してください。

```tsx
<Window title="起動確認" zIndex={100} modal onClose={close}>…</Window>
```

`[data-testid='main-window'] { position: relative; z-index: 10 }` のように **wrapper へ CSS の
`z-index` を当てないでください**。wrapper がスタッキングコンテキストを作り、後から描画した
ダイアログが背面に回ってクリックできなくなります。

モーダルとして使う場合は `modal` を付けます。

- `role="dialog"` / `aria-modal="true"` / `aria-label={title}`（`role` / `aria-label` を渡せば上書きされます）
- 背景を覆う透明バックドロップを描画し、背後のクリックをブロック
- マウント時に自分へフォーカスを移し、`Escape` で `onClose` を呼ぶ

アクセシビリティ属性だけが必要なら、`Window` は任意の DOM props を転送するので
`role="dialog" aria-modal="true"` を直接渡すこともできます。

### 6. 文字の配色と描画

`.win98` 配下の文字色は Windows Standard scheme に合わせています。

| 用途 | 色 |
|---|---|
| 通常の文字 | `#000000`（98.css は `body` に `#222` を当てるので `.win98` で黒に戻しています） |
| 選択 (Highlight) | 背景 `#000080` / 文字 `#ffffff` |
| 無効 (Grayed) | `#808080`（+ 白の 1px シャドウ） |
| デスクトップアイコン名 | `#ffffff`（背景は `#008080`） |

ピクセルフォント (Pixelated MS Sans Serif / DotGothic16) は、Windows の ClearType
（LCD サブピクセル AA）で描かれると **文字の縁が緑/橙に色づいて見えます**。Chromium は
`-webkit-font-smoothing` を無視するため、このライブラリでは文字面を合成レイヤーに載せて
グレースケール AA に固定しています（`title-bar` / `window-body` / `status-bar` とメニューの
ポップアップ層）。

`Window` の外に独自の文字面（デスクトップアイコンなど）を置く場合は、同じ方法を当てられます。

```css
/* 子孫に position: fixed が無い場合のみ。付けると fixed の基準が変わるので、
   .win98 や .window 自体には付けないこと（ウィンドウ位置やモーダルの
   バックドロップがずれます） */
.my-desktop-label {
  will-change: transform;
}
```

### 7. ツールバー帯と溝

Win98 のドッキング ツールバーは、帯 (バンド) と段 (行) と 2px の溝でできています。
幅に合わせて段に詰め直す計測もライブラリ側にあります。

```tsx
import { Toolbar, ToolbarBand, ToolbarRow, useToolbarRows, Groove } from '@megablacklabel/react98retro';

// 1 段の帯
<ToolbarBand
  rows={[
    <ToolbarRow key="row">
      <Toolbar items={items} variant="band" />
    </ToolbarRow>,
  ]}
/>

// 幅に合わせて折り返す帯 (計測 + 詰め + 段間の溝)
function DockedToolbar({ groups }: { groups: ToolbarItemDef[][] }) {
  const { stripRef, itemRefs, rows } = useToolbarRows({ count: groups.length, gap: 2 });

  return (
    <ToolbarBand
      ref={stripRef}
      rows={rows.map((row) => (
        <ToolbarRow key={row[0]}>
          {row.map((index) => (
            <Toolbar
              key={index}
              variant="band"
              items={groups[index]}
              ref={(element) => { itemRefs.current[index] = element; }}
            />
          ))}
        </ToolbarRow>
      ))}
    />
  );
}

// 帯と帯の間の区切り (横) / 同じ帯の中の区切り (縦)
<Groove />
<Groove orientation="vertical" />
```

- `useToolbarRows` が帯と各項目の幅を測り、`packToolbarRows` で段に詰めます。ウィンドウのリサイズ・フォントの読み込み・項目の増減で詰め直し、`ResizeObserver` が無い環境 (SSR など) では計測せず 1 段のまま返します
- 詰める単位は「項目」です。`keepWithNext` を渡すと、ラベルとコントロールのように離したくない項目を段の末尾に残しません
- **帯は幅が決まっている箱 (伸びる親・固定幅) に置いてください。** 帯の幅を測って段を決めるので、`display: flex` の行のように内容に合わせて縮む箱に入れると、段が決まる → 帯の幅が変わる → 段が決まる、の循環で 1 段 1 項目まで崩れます
- 使える幅は「帯の幅 − `paddingX` × 2」です。`paddingX` は**段 (行) 自身が左右に持つ余白**で、既定は `0` (`ToolbarRow` は余白を持たず、左右の 2px は `Toolbar variant="band"` が持ちます)。自前の行に `padding: 0 2px` を付けている場合は `paddingX: 2` を渡してください
- 項目の幅は既定で `element.getBoundingClientRect().width` です。**項目が区切り線を自分の前に持つ**など、要素の幅に足して詰めたいときは `measure` を渡します

```tsx
// 区切り線 (8px) を自分の前に持つ項目を、その幅込みで詰める
useToolbarRows({
  count: items.length,
  gap: 4,
  measure: (element, index) =>
    element.getBoundingClientRect().width + (items[index].separatorBefore ? 8 : 0),
});
```
- `ToolbarRow` は `flex-wrap: wrap` で、計測が終わるまでは CSS 側でも折り返します。子は `flex: 0 0 auto` で縮めません (縮むと幅を測れず、段分けが決まらないため)
- `Toolbar` の `variant="band"` は、内容を実物のツールバー ボタンと同じ **22px ちょうど** に詰めます (既定の `plain` は上下 1px の余白付き)
- `ToolbarBand` は外周の溝 (上辺の外の暗 1px / 上辺の明 1px / 明と暗の間の銀 1px / 下辺の暗 2px) を持ち、折り返した段の間には 銀 1px + 溝 2px + 銀 2px を空けます
- `Groove` は 2px の凹んだ区切り (上/左が `#808080`、下/右が `#ffffff`)。逆向きにすると凸った「浮いた線」に見えるので向きは固定です。帯の区切りは装飾なので既定で `aria-hidden="true"` が付きます (意味のある区切りとして読み上げさせたいときは `aria-hidden={undefined}` を渡してください)

寸法は CSS 変数で差し替えられます (帯の中の間隔を 4px にしたい、区切り線の高さを変えたい等)。

| 変数 | 既定 | 用途 |
|---|---|---|
| `--win98-toolbar-separator-height` | `18px` | ツールバーの区切り線の高さ (実測: Win98 ヘルプのツールバー画像で 22px ボタンの上下 2px 内側) |
| `--win98-toolbar-content-height` | `22px` | 帯に詰めるときの内容の高さ |
| `--win98-toolbar-gap` | `1px` | ツールバー内の項目の間隔 |
| `--win98-groove-dark` | `#808080` | 溝の暗い側 |
| `--win98-groove-light` | `#ffffff` | 溝の明るい側 |

```css
.my-docked-toolbar {
  --win98-toolbar-gap: 4px;
  --win98-toolbar-separator-height: 18px;
}
```

## ローカルの作業ツリーを消費側で使う

`file:` / `link:` 依存は Windows でツリー全体のコピーに失敗する（`EPERM` /
`FileNotFound`）ことがあるので、tarball 経由で入れるのが確実です。

```bash
# ライブラリ側
bun run pack:lib        # build:lib + bun pm pack → megablacklabel-react98retro-<version>.tgz

# 消費側（出力されたファイル名を指定）
bun add ./megablacklabel-react98retro-<version>.tgz
```

`prepublishOnly` で publish 前に必ず `build:lib` が走るため、`dist` と `exports` の
食い違いは publish 時に検出されます。

## アイコンについて

アイコンは [Chicago95](https://github.com/grassmunk/Chicago95) の SVG を
[jsDelivr CDN](https://www.jsdelivr.com/) 経由で動的に取得しています。

```
https://cdn.jsdelivr.net/gh/grassmunk/Chicago95@master/Icons/Chicago95/...
```

ローカルにアイコンファイルをバンドルしていないため、インターネット接続が必要です。

## ライセンス表記

このプロジェクトのソースコードは **MIT License** で配布されています。

---

### 98.css

**Copyright (c) 2020 Jordan Scales**
License: **MIT**
Repository: https://github.com/jdan/98.css

---

### Chicago95 Icons（実行時に CDN から取得）

**Copyright (c) 2019-2024 grassmunk**
License: **GNU General Public License v3.0 (GPL-3.0)**
Repository: https://github.com/grassmunk/Chicago95

> アイコンはローカルにバンドルせず、実行時に jsDelivr CDN 経由で取得します。
> Chicago95 アイコン自体の利用は GPL-3.0 に従います。

---

### DotGothic16

**Copyright (c) 2020 Fontworks Inc.**
License: **SIL Open Font License 1.1 (OFL-1.1)**
Google Fonts: https://fonts.google.com/specimen/DotGothic16
