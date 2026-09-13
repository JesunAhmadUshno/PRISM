/**
 * Unit tests for the string-level sanitizers in src/security/sanitizer.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  sanitizeToPlainText,
  escapeHTML,
  sanitizeValue,
} from '@/security/sanitizer';

describe('sanitizeHTML', () => {
  it('drops script tags but keeps allowed markup', () => {
    expect(sanitizeHTML('<script>alert(1)</script><p>Hi</p>')).toBe('<p>Hi</p>');
  });

  it('drops an img with an inline event handler entirely', () => {
    expect(sanitizeHTML('<img src=x onerror=alert(1)>ok')).toBe('ok');
  });

  it('strips href from anchors, defeating javascript: URIs', () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('href');
    expect(out).toBe('x');
  });

  it('strips style attributes and style elements', () => {
    const out = sanitizeHTML('<style>body{}</style><p style="width:expression(alert(1))">t</p>');
    expect(out).toBe('<p>t</p>');
  });

  it('preserves the aria attributes the accessibility claim depends on', () => {
    const out = sanitizeHTML(
      '<table aria-label="Sales" role="table"><tr><th scope="col">Q1</th></tr></table>'
    );
    expect(out).toContain('aria-label="Sales"');
    expect(out).toContain('role="table"');
    expect(out).toContain('scope="col"');
  });

  it('coerces non-string input instead of throwing', () => {
    expect(sanitizeHTML(42 as unknown as string)).toBe('42');
    expect(sanitizeHTML(null as unknown as string)).toBe('null');
  });
});

describe('sanitizeToPlainText', () => {
  it('removes all tags but keeps their text content', () => {
    expect(sanitizeToPlainText('<b>bold</b> text')).toBe('bold text');
  });

  it('removes script element content entirely', () => {
    expect(sanitizeToPlainText('<script>alert(1)</script>safe')).toBe('safe');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeToPlainText('   padded   ')).toBe('padded');
  });

  it('decodes HTML entities back into live markup', () => {
    // TODO(BUG): sanitizer.ts:115-117 pipes the DOMPurify output through
    // `textarea.innerHTML = sanitized; return textarea.value`, which HTML-decodes
    // it. Entity-encoded input therefore leaves the "sanitizer" as raw markup.
    // Anything that later inserts this value as HTML - or decodes it once more -
    // gets an executable tag back. Escaping is undone, not applied.
    expect(sanitizeToPlainText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe(
      '<script>alert(1)</script>'
    );
    expect(sanitizeToPlainText('&lt;img src=x onerror=alert(1)&gt;')).toBe(
      '<img src=x onerror=alert(1)>'
    );
  });

  it('round-trips escapeHTML output straight back to the dangerous original', () => {
    // TODO(BUG): same defect as above, shown as a composition failure - the two
    // exported sanitizers cancel each other out.
    const dangerous = '<script>alert(1)</script>';
    expect(sanitizeToPlainText(escapeHTML(dangerous))).toBe(dangerous);
  });
});

describe('escapeHTML', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escapeHTML('<a href="x" title=\'y\'>&</a>')).toBe(
      '&lt;a href=&quot;x&quot; title=&#039;y&#039;&gt;&amp;&lt;/a&gt;'
    );
  });

  it('escapes the ampersand first so entities are not double-decoded', () => {
    expect(escapeHTML('&lt;')).toBe('&amp;lt;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHTML('Revenue 2024 - North region')).toBe('Revenue 2024 - North region');
  });
});

describe('sanitizeValue', () => {
  it('renders null and undefined as an empty string', () => {
    expect(sanitizeValue(null)).toBe('');
    expect(sanitizeValue(undefined)).toBe('');
  });

  it('renders non-finite numbers as N/A', () => {
    expect(sanitizeValue(NaN)).toBe('N/A');
    expect(sanitizeValue(Infinity)).toBe('N/A');
  });

  it('renders booleans as Yes/No', () => {
    expect(sanitizeValue(true)).toBe('Yes');
    expect(sanitizeValue(false)).toBe('No');
  });

  it('escapes string input', () => {
    expect(sanitizeValue('<b>&x')).toBe('&lt;b&gt;&amp;x');
  });

  it('truncates strings longer than 10000 characters', () => {
    const out = sanitizeValue('a'.repeat(10_050));
    expect(out).toHaveLength(10_003);
    expect(out.endsWith('...')).toBe(true);
  });

  it('stringifies objects and escapes the result', () => {
    expect(sanitizeValue({ a: 1 })).toBe('{&quot;a&quot;:1}');
  });

  it('locale-formats numbers, which is lossy for machine-readable output', () => {
    // TODO(BUG): sanitizer.ts:155 returns value.toLocaleString(), so 1234567.5
    // becomes "1,234,567.5" (and is locale-dependent). Any consumer that parses
    // this back - chart axes, CSV export, clipboard copy - gets 1, not 1234567.5.
    expect(sanitizeValue(1234567.5)).toBe('1,234,567.5');
    expect(Number.parseFloat(sanitizeValue(1234567.5))).toBe(1);
  });
});
