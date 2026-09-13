/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * PRISM accessibility-test configuration.
 *
 * Backs the `npm run test:a11y` script. Renders real components into jsdom and
 * asserts against axe-core rule sets. Only *.a11y.test.tsx files run here, so
 * this config is standalone rather than merged with vitest.config.ts (vitest's
 * mergeConfig concatenates `include` arrays instead of replacing them).
 */
export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@workers': resolve(__dirname, 'src/workers'),
      '@security': resolve(__dirname, 'src/security'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.a11y.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    restoreMocks: true,
  },
});
