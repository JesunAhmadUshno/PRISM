/**
 * Content-Security-Policy regression tests.
 *
 * These exist because of a production outage. The fix that made the Web Worker
 * inherit the document CSP (by constructing it from a blob: URL) shipped while
 * script-src still lacked `blob:`. Every single file upload then failed with
 *
 *   Failed to execute 'importScripts' on 'WorkerGlobalScope'
 *
 * because the worker loads the integrity-verified Pyodide bytes through
 * importScripts() on a blob: URL, and the policy it had just correctly
 * inherited forbade exactly that.
 *
 * No test loaded Pyodide, so nothing caught it. These assertions are cheap and
 * they pin the coupling: "the worker is a blob" and "script-src allows blob:"
 * are one decision, not two, and removing either half breaks the product.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readCsp(): Record<string, string[]> {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const match = html.match(
    /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([\s\S]*?)["']\s*>/i
  );
  const body = match?.[1];
  if (!body) throw new Error('No CSP meta tag found in index.html');

  const directives: Record<string, string[]> = {};
  for (const part of body.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    const name = tokens[0];
    if (!name) continue;
    directives[name] = tokens.slice(1);
  }
  return directives;
}

describe('Content-Security-Policy', () => {
  const csp = readCsp();

  it('starts from default-src none', () => {
    expect(csp['default-src']).toEqual(["'none'"]);
  });

  it('allows blob: in script-src, or every upload fails in production', () => {
    // The exact regression. See the comment block above the meta tag.
    expect(csp['script-src']).toContain('blob:');
  });

  it('allows the worker to be constructed from a blob, which is how it inherits this policy', () => {
    expect(csp['worker-src']).toContain('blob:');
  });

  it('keeps the two halves of that decision together', () => {
    // If a future change tightens script-src back down, the worker must stop
    // being a blob at the same time, and that means solving CSP inheritance
    // another way. Failing here is the signal to go read prismStore.ts.
    const workerIsBlob = readFileSync(
      resolve(process.cwd(), 'src/stores/prismStore.ts'),
      'utf8'
    ).includes('createObjectURL');

    if (workerIsBlob) {
      expect(csp['script-src']).toContain('blob:');
    }
  });

  it('still permits WebAssembly, which Pyodide requires', () => {
    expect(csp['script-src']).toContain("'wasm-unsafe-eval'");
  });

  it('restricts network egress to self and the Pyodide CDN only', () => {
    // The product's entire claim. A new origin here is a new way for user data
    // to leave the machine, and it must be argued for, not slipped in.
    expect(csp['connect-src']).toEqual(["'self'", 'https://cdn.jsdelivr.net/pyodide/']);
  });

  it('forbids form submission and plugin content outright', () => {
    expect(csp['form-action']).toEqual(["'none'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['frame-src']).toEqual(["'none'"]);
  });

  it('never allows unsafe-inline or unsafe-eval in script-src', () => {
    expect(csp['script-src']).not.toContain("'unsafe-inline'");
    expect(csp['script-src']).not.toContain("'unsafe-eval'");
  });
});
