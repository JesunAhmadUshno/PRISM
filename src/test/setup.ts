/**
 * Global test setup.
 *
 * Only shims browser APIs that jsdom does not implement but that PRISM touches
 * at module-evaluation time. Nothing here fakes application behaviour.
 */
import '@testing-library/jest-dom/vitest';
import { webcrypto } from 'node:crypto';

// src/stores/prismStore.ts reads window.matchMedia at module scope
// (initialAccessibility.reducedMotion), which jsdom does not implement.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom exposes no crypto.randomUUID; the store uses it for dataset ids.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    writable: true,
    configurable: true,
    value: webcrypto,
  });
}
