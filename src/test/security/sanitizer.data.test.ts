/**
 * Unit tests for the structural sanitizers in src/security/sanitizer.ts -
 * the ones that run over every parsed row before it reaches a chart.
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeChartData,
  sanitizeColumnName,
  sanitizeInsight,
} from '@/security/sanitizer';

describe('sanitizeChartData', () => {
  it('passes finite numbers through untouched', () => {
    expect(sanitizeChartData([{ revenue: 1200, margin: -0.5 }])).toEqual([
      { revenue: 1200, margin: -0.5 },
    ]);
  });

  it('nulls out NaN and Infinity so charts do not break', () => {
    expect(sanitizeChartData([{ a: NaN, b: Infinity, c: -Infinity }])).toEqual([
      { a: null, b: null, c: null },
    ]);
  });

  it('normalises null and undefined values to null', () => {
    expect(sanitizeChartData([{ a: null, b: undefined }])).toEqual([{ a: null, b: null }]);
  });

  it('strips tags from string values', () => {
    expect(sanitizeChartData([{ label: '<b>North</b>' }])).toEqual([{ label: 'North' }]);
  });

  it('truncates long string values to 1000 characters', () => {
    const [row] = sanitizeChartData([{ note: 'x'.repeat(1500) }]);
    expect(row?.note).toHaveLength(1000);
  });

  it('preserves row count and order', () => {
    const out = sanitizeChartData([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(out.map((r) => r.n)).toEqual([1, 2, 3]);
  });

  it('silently drops a column when two column names sanitize to the same key', () => {
    // TODO(BUG): sanitizer.ts:194-214 builds the output object keyed by the
    // sanitized name. '<b>x</b>' and 'x' both sanitize to 'x', so the first
    // column's value is overwritten and the row silently loses a field. Every
    // statistic computed downstream is then computed on fewer columns than the
    // user uploaded, with no warning anywhere.
    expect(
      sanitizeChartData([{ '<b>x</b>': 1, x: 2 } as Record<string, unknown>])
    ).toEqual([{ x: 2 }]);
  });

  it('re-emits executable markup from entity-encoded cell values', () => {
    // TODO(BUG): consequence of the sanitizeToPlainText entity-decoding defect
    // (sanitizer.ts:115-117) reaching the chart data path via sanitizer.ts:205.
    expect(sanitizeChartData([{ a: '&lt;img src=x onerror=alert(1)&gt;' }])).toEqual([
      { a: '<img src=x onerror=alert(1)>' },
    ]);
  });
});

describe('sanitizeColumnName', () => {
  it('keeps word characters, hyphens, underscores and dots', () => {
    expect(sanitizeColumnName('Net_Revenue-2024.Q1')).toBe('Net_Revenue-2024.Q1');
  });

  it('strips currency and punctuation characters', () => {
    expect(sanitizeColumnName('Sales ($) 2024')).toBe('Sales  2024');
  });

  it('removes markup from a column name', () => {
    expect(sanitizeColumnName('<script>alert(1)</script>Region')).toBe('Region');
  });

  it('caps the name at 100 characters', () => {
    expect(sanitizeColumnName('c'.repeat(250))).toHaveLength(100);
  });

  it('collapses two distinct real-world headers into the same name', () => {
    // TODO(BUG): same collision hazard as sanitizeChartData - 'Revenue (%)' and
    // 'Revenue ($)' are different columns in the uploaded file and identical
    // after sanitizer.ts:220-224.
    expect(sanitizeColumnName('Revenue (%)')).toBe(sanitizeColumnName('Revenue ($)'));
  });
});

describe('sanitizeInsight', () => {
  it('strips markup from the title and caps it at 200 characters', () => {
    const out = sanitizeInsight({
      title: `<img src=x onerror=alert(1)>${'t'.repeat(300)}`,
      description: '<p>ok</p>',
      accessibleDescription: 'a'.repeat(700),
    });
    expect(out.title).toHaveLength(200);
    expect(out.title).not.toContain('onerror');
  });

  it('keeps safe markup in the description but removes scripts', () => {
    const out = sanitizeInsight({
      title: 'Trend',
      description: '<p>Revenue rose <strong>12%</strong></p><script>alert(1)</script>',
      accessibleDescription: 'Revenue rose 12 percent',
    });
    expect(out.description).toBe('<p>Revenue rose <strong>12%</strong></p>');
  });

  it('caps the screen-reader description at 500 characters', () => {
    const out = sanitizeInsight({
      title: 'Trend',
      description: 'x',
      accessibleDescription: 'a'.repeat(900),
    });
    expect(out.accessibleDescription).toHaveLength(500);
  });
});
