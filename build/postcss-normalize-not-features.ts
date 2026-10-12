/**
 * 98.css は `@media (not(hover))` を使う。仕様上は有効だが lightningcss (Vite 8 の
 * CSS minify 既定) が "Invalid media query" で落とすため、配布 CSS を
 * `@media not (hover)` に正規化しておく。これをやらないと consumer 側の
 * `vite build` が同梱 CSS を minify する段で失敗する。
 *
 * postcss 本体の型は Vite 同梱の postcss と別インスタンスになり得るので、
 * ここでは構造的に必要な最小の型だけを書いて PostCSS プラグインとして渡す。
 */
export function normalizeNotFeatures() {
  return {
    postcssPlugin: 'react98retro:normalize-not-features',
    AtRule: {
      media: (atRule: { params: string }) => {
        atRule.params = atRule.params.replace(/\(not\s*\(([^()]+)\)\)/g, 'not ($1)');
      },
    },
  };
}
