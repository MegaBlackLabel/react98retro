/**
 * 98.css のフォントを日本語版 Windows 98 の見た目に寄せる。
 *
 * 1. フォント: 98.css は `"Pixelated MS Sans Serif"` を第一候補にするが、これは
 *    輪郭フォントのため Chromium では常にアンチエイリアスが掛かり、実測で
 *    中間色ピクセルが 43% (= 滲んで見える)。日本語版 Win98 の UI フォントである
 *    MS UI Gothic は 12px のビットマップを持ち、同じ 12px で描くと中間色 0%
 *    (= ドット通りシャープ) になる。そこで MS UI Gothic を第一候補にし、
 *    無い環境では MS PGothic → Pixelated MS Sans Serif → DotGothic16 に落とす。
 *
 * 2. サイズ: 日本語版 Windows 98 の UI は MS UI Gothic 9pt = **12px**。
 *    11px では 12px 用ビットマップが行内で潰れて汚く見えるため 12px に揃える。
 */
const JP_STACK = '"MS UI Gothic", "MS PGothic", "Pixelated MS Sans Serif", "DotGothic16", Arial';

export function jpFontFallback() {
  return {
    postcssPlugin: 'react98retro:jp-font-fallback',
    Declaration(decl: { prop: string; value: string }) {
      if (decl.prop === 'font-family') {
        if (!decl.value.includes('Pixelated MS Sans Serif')) return;
        if (decl.value.includes('MS UI Gothic')) return;
        // ピクセルフォントを第一候補にしている宣言を、日本語 UI フォント優先に置き換える
        decl.value = decl.value.replace(
          /"?Pixelated MS Sans Serif"?\s*(,\s*(Arial|sans-serif))?/,
          JP_STACK,
        );
        return;
      }

      if (decl.prop === 'font-size' && decl.value === '11px') {
        decl.value = '12px';
      }
    },
  };
}
