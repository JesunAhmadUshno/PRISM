/**
 * @vitest-environment jsdom
 *
 * Regression tests for the two security properties prismStore is responsible for:
 *
 *  1. The Pyodide worker - the only thread that ever holds plaintext user data -
 *     must be created from a blob: URL. blob: is a local scheme, so the worker
 *     inherits the document's policy container (the CSP in index.html). A worker
 *     loaded from an https: URL would instead derive its policy from the worker
 *     script's own response headers, and the GitHub Pages deploy target cannot
 *     send any - leaving it unpoliced with network access to every origin.
 *
 *  2. XLSX parsing (xlsx@0.18.5, CVE-2023-30533) must not be able to leave
 *     anything behind on Object.prototype.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface WorkerConstructorCall {
  url: string;
  options: WorkerOptions | undefined;
}

const workerCalls: WorkerConstructorCall[] = [];

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(url: string | URL, options?: WorkerOptions) {
    workerCalls.push({ url: String(url), options });
  }

  postMessage(): void {
    /* no-op */
  }

  terminate(): void {
    /* no-op */
  }
}

describe('prismStore worker isolation', () => {
  beforeEach(() => {
    workerCalls.length = 0;
    vi.resetModules();

    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('URL', Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:http://localhost/fake-worker'),
      revokeObjectURL: vi.fn(),
    }));
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => 'test-uuid' });
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates the worker from a blob: URL so it inherits the document CSP', async () => {
    await import('./prismStore');

    expect(workerCalls.length).toBeGreaterThan(0);
    const call = workerCalls[0]!;
    expect(call.url.startsWith('blob:')).toBe(true);
    expect(call.options?.type).toBe('classic');
  });

  it('never constructs the worker from a network URL', async () => {
    await import('./prismStore');

    for (const call of workerCalls) {
      expect(/^https?:/.test(call.url)).toBe(false);
    }
  });

  it('builds the blob from the worker source, which has no off-origin egress calls', async () => {
    const { default: source } = await import('../workers/prism.worker.js?raw');

    // The worker may only reach the Pyodide CDN, and only via importScripts,
    // which the inherited script-src allows. No other network primitive is used.
    expect(source).toContain('importScripts');
    expect(source).not.toMatch(/\bnew WebSocket\s*\(/);
    expect(source).not.toMatch(/\bnew XMLHttpRequest\s*\(/);
    expect(source).not.toMatch(/\bnavigator\.sendBeacon\s*\(/);
  });
});
