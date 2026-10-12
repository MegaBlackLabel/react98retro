# react98retro

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

React で Windows 98 のコンポーネントを実装しました。

98.css をベースに React コンポーネントライブラリを構築し、ドラッグ・リサイズ可能なウィンドウ上で Windows 98 風のファイルエクスプローラーを動作させることを目標としたプロジェクトです。

🌐 **<a href="https://megablacklabel.github.io/react98retro/" target="_blank">デモを見る → https://megablacklabel.github.io/react98retro/</a>**

## スクリーンショット

![Windows 98 ファイルエクスプローラー](./image/screenshot.png)

## 実装コンポーネント

- **Window** — タイトルバー付き、ドラッグ移動・リサイズ対応ウィンドウ（`data-testid` などの任意 DOM props をそのまま転送）
- **MenuBar** — プルダウンメニュー付きメニューバー（ドロップダウンはポータル層 `document.body` に描画されるので他ウィンドウの下に隠れない）
- **Toolbar** — アイコン＋ラベル付きツールバー（SplitButton 対応）
- **AddressBar** — アドレスバー（ドロップダウン履歴付き）
- **TreeView** — フォルダツリー
- **TableView** — 列リサイズ対応ファイル一覧テーブル
- **SplitButton** — アイコン＋▼ボタン＋メニューの複合ボタン
- **Menu** — ネスト対応コンテキストメニュー
- **Button / CheckBox / Radio / TextBox / TextArea / GroupBox** など、98.css の全 UI コンポーネント

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

### 1. `.npmrc` にレジストリを追加

プロジェクトルートの `.npmrc` に以下を追記してください。

```
@megablacklabel:registry=https://npm.pkg.github.com
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

CSS minify は既定で問題ありません。ビルド済み `style.css` は lightningcss で解析できる形に
正規化済みです（98.css の `@media (not(hover))` を `@media not (hover)` に変換して同梱）。

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
