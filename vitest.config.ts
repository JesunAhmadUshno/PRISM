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
      /**
       * Coverage `include` used to list only `src/security` and `src/stores`,
       * which are the two directories that actually have tests. Any percentage
       * published from that configuration was arithmetically true and
       * materially misleading: the components and App.tsx were not counted as
       * uncovered, they were not counted at all.
       *
       * The set below is every source file this config could plausibly test.
       * The number it produces is lower and it is honest, which is the only
       * kind of number worth publishing for a product whose pitch is "do not
       * trust us, verify it yourself".
       */
      include: [
        'src/**/*.ts',
        'src/**/*.tsx',
      ],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/types/**',
        // Entry point: mounts React into the DOM, no branches worth measuring.
        'src/main.tsx',
        /**
         * The analytics engine is Python embedded in a JS template literal, so
         * v8 sees one enormous string literal and nothing it can instrument.
         * Counting it here would report either a meaningless 100% (the string
         * is "executed" when the module loads) or a meaningless 0%, and either
         * number would obscure the real position.
         *
         * It is covered instead by tests/python/, which extracts that Python
         * and runs it against published reference values, gated in CI by
         * .github/workflows/stats.yml. Do not add the worker here: doing so
         * would replace a real check with a cosmetic one.
         */
        'src/workers/**',
        // Dead code, kept deliberately and documented in its own header: the
        // engine that runs is the copy inside src/workers/prism.worker.js.
        'src/python/**',
      ],
    },
  },
});
