/**
 * 98.css のフォントを日本語版 Windows 98 の見た目に寄せる。
 *
 * 1. フォールバック: 98.css は `font-family: "Pixelated MS Sans Serif", Arial` を当てるが、
 *    Arial には日本語グリフが無く、日本語はブラウザ既定 (Meiryo / Yu Gothic など) になる。
 *    日本語版 Win98 の既定 UI フォント (MS UI Gothic / MS PGothic) を先に並べ、
 *    無い環境では DotGothic16 (ドット絵フォント) に落とす。
 *
 * 2. サイズ: 98.css は英語版のメトリック (MS Sans Serif 8pt = 11px) を使うが、
 *    日本語版 Windows 98 の UI は MS UI Gothic 9pt = **12px**。
 *    MS UI Gothic のビットマップは 12px 用なので、11px だと行内で潰れて汚く見える。
 *    日本語 UI に合わせて 12px に揃える。
 */
const JP_FALLBACK = '"MS UI Gothic", "MS PGothic", "DotGothic16"';

export function jpFontFallback() {
  return {
    postcssPlugin: 'react98retro:jp-font-fallback',
    Declaration(decl: { prop: string; value: string }) {
      if (decl.prop === 'font-family') {
        if (!decl.value.includes('Pixelated MS Sans Serif')) return;
        if (decl.value.includes('MS UI Gothic')) return;
        decl.value = decl.value.replace(/(Arial|sans-serif)/, `${JP_FALLBACK}, $1`);
        return;
      }

      if (decl.prop === 'font-size' && decl.value === '11px') {
        decl.value = '12px';
      }
    },
  };
}
