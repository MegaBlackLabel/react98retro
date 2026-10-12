import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import prefixSelector from 'postcss-prefix-selector';
import { normalizeNotFeatures } from './build/postcss-normalize-not-features.ts';
import { jpFontFallback } from './build/postcss-jp-font-fallback.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/index.ts', 'src/components/**/*.ts', 'src/components/**/*.tsx', 'src/icons/**/*.ts', 'src/icons/**/*.tsx'],
      exclude: ['src/**/*.stories.*', 'src/**/*.test.*', 'src/features/**', 'src/App.tsx', 'src/main.tsx'],
      outDir: 'dist',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  css: {
    postcss: {
      plugins: [
        prefixSelector({
          prefix: '.win98',
          transform(prefix, selector, prefixedSelector, filePath) {
            // 98.css だけスコープ化する。html/body/:root はそのまま
            if (!filePath.includes('98.css')) return selector;
            if ([':root', 'html', 'body'].includes(selector)) return selector;
            return prefixedSelector;
          },
        }),
        normalizeNotFeatures(),
        jpFontFallback(),
      ],
    },
  },
  // デモ用アセットを配布物にコピーしない
  publicDir: false,
  build: {
    // 同梱 98.css の @media (not(hover)) を lightningcss (Vite 8 既定) が
    // invalid として落とすため esbuild minifier を使う
    cssMinify: 'esbuild',
    lib: {
      entry: path.resolve(dirname, 'src/index.ts'),
      name: 'React98Retro',
      fileName: 'react98retro',
      // package.json の "./style.css" export と一致させる。
      // Vite はこの値に ".css" を付けて出力するので "style" → dist/style.css
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
        },
      },
    },
  },
});
