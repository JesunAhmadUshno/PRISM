/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * PRISM unit-test configuration.
 *
 * Scope: pure logic (security, stores, utils). Accessibility tests live in
 * vitest.a11y.config.ts and are excluded here so `npm test` stays fast.
 */
export default defineConfig({
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
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/**/*.a11y.test.tsx'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/security/**/*.ts', 'src/stores/**/*.ts'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/types/**'],
    },
  },
});
