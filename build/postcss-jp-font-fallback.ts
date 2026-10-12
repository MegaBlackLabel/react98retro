/**
 * 98.css のフォント指定に日本語 UI フォントのフォールバックを足す。
 *
 * 98.css は `font-family: "Pixelated MS Sans Serif", Arial` を当てるが、Arial には
 * 日本語グリフが無いため、日本語はブラウザ既定 (環境によって Meiryo / Yu Gothic など) に
 * なってしまう。Windows 98 日本語版の既定 UI フォント (MS UI Gothic / MS PGothic) を
 * 先に並べ、無い環境では DotGothic16 (ドット絵フォント) に落とす。
 */
const JP_FALLBACK = '"MS UI Gothic", "MS PGothic", "DotGothic16"';

export function jpFontFallback() {
  return {
    postcssPlugin: 'react98retro:jp-font-fallback',
    Declaration(decl: { prop: string; value: string }) {
      if (decl.prop !== 'font-family') return;
      if (!decl.value.includes('Pixelated MS Sans Serif')) return;
      if (decl.value.includes('MS UI Gothic')) return;
      decl.value = decl.value.replace(/(Arial|sans-serif)/, `${JP_FALLBACK}, $1`);
    },
  };
}
