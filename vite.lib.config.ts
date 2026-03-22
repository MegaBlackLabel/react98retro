import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import prefixSelector from 'postcss-prefix-selector';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

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
      ],
    },
  },
  build: {
    cssMinify: false,
    lib: {
      entry: path.resolve(dirname, 'src/index.ts'),
      name: 'React98Retro',
      fileName: 'react98retro',
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
