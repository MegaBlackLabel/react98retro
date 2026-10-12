/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { normalizeNotFeatures } from './build/postcss-normalize-not-features.ts';
import { jpFontFallback } from './build/postcss-jp-font-fallback.ts';
const dirname = path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [normalizeNotFeatures(), jpFontFallback()],
    },
  },
  base: '/react98retro/',
  build: {
    // ライブラリ成果物 (dist/) を壊さないよう、デモの出力先を分ける
    outDir: 'demo-dist',
    // 98.css の @media (not(hover)) は lightningcss minify が invalid 判定する
    cssMinify: 'esbuild',
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/test-setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.stories.{ts,tsx}'],
        },
      },
    ],
  },
});