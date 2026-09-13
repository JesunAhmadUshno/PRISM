/**
 * Unit tests for the content-security scan and the end-to-end validateFile()
 * pipeline in src/security/validator.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  validateContentSecurity,
  validateFile,
  DANGEROUS_PATTERNS,
} from '@/security/validator';

const csv = (body: string, name = 'data.csv') =>
  new File([body], name, { type: 'text/csv' });

describe('validateContentSecurity', () => {
  it('accepts an ordinary CSV', async () => {
    const result = await validateContentSecurity(csv('region,revenue\nNorth,1200\nSouth,980\n'));
    expect(result).toEqual({ isValid: true });
  });

  it.each([
    ['inline script tag', 'a,b\n1,<script >alert(1)</script>\n'],
    ['iframe tag', 'a,b\n1,<iframe src="x">\n'],
    ['javascript: URI', 'a,b\n1,javascript:alert(1)\n'],
    ['vbscript: URI', 'a,b\n1,vbscript:msgbox(1)\n'],
    ['data:text/html payload', 'a,b\n1,data:text/html;base64,PHNjcmlwdD4=\n'],
    ['CSS expression()', 'a,b\n1,expression(alert(1))\n'],
    ['url(javascript:...)', 'a,b\n1,url( "javascript:alert(1)")\n'],
  ])('rejects a CSV carrying %s', async (_label, body) => {
    const result = await validateContentSecurity(csv(body));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('potentially unsafe content');
  });

  it('rejects benign data whose text happens to match the event-handler pattern', async () => {
    // TODO(BUG): DANGEROUS_PATTERNS[5] at validator.ts:67 is /on\w+\s*=/i, which
    // matches any "on" + word chars + "=" anywhere in the file. "London=UK" hits
    // it ("on" + "don" + "="), so a legitimate spreadsheet is rejected outright
    // with a security error and no way for the user to proceed.
    const result = await validateContentSecurity(csv('city,code\nLondon=UK,1\n'));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('potentially unsafe content');
  });

  it('exposes exactly the eight documented threat patterns', () => {
    expect(DANGEROUS_PATTERNS).toHaveLength(8);
    expect(DANGEROUS_PATTERNS.every((p) => p instanceof RegExp)).toBe(true);
  });
});

describe('validateFile (full pipeline)', () => {
  it('accepts a clean CSV and returns sanitized metadata', async () => {
    const file = csv('region,revenue\nNorth,1200\nSouth,980\n');
    const result = await validateFile(file);
    expect(result.isValid).toBe(true);
    expect(result.metadata).toMatchObject({
      name: 'data.csv',
      type: 'csv',
      mimeType: 'text/csv',
      size: file.size,
    });
  });

  it('strips path separators and traversal sequences from the stored filename', async () => {
    const file = csv('region,revenue\nNorth,1200\n', '../../etc/pa*sswd.csv');
    const result = await validateFile(file);
    expect(result.isValid).toBe(true);
    expect(result.metadata?.name).toBe('____etc_pa_sswd.csv');
    expect(result.metadata?.name).not.toContain('..');
    expect(result.metadata?.name).not.toContain('/');
  });

  it('short-circuits on size before looking at anything else', async () => {
    const result = await validateFile(csv('a,b\n'));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too small');
  });

  it('rejects an unsupported extension before reading any bytes', async () => {
    const result = await validateFile(new File(['MZ\u0090\u0000 padding padding'], 'payload.exe', { type: 'application/x-msdownload' }));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });

  it('never content-scans a spreadsheet, only CSV', async () => {
    // TODO(BUG): validateFile() runs validateContentSecurity
    // for 'csv' only. XLSX cell values reach the parser and the UI
    // without ever being screened for the DANGEROUS_PATTERNS above - the same
    // payload that is blocked as CSV sails through when zipped as .xlsx.
    const zipHeader = new Uint8Array(64);
    zipHeader.set([0x50, 0x4b, 0x03, 0x04]);
    const spreadsheet = new File([zipHeader], 'book.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const result = await validateFile(spreadsheet);
    expect(result.isValid).toBe(true);
    expect(result.metadata?.type).toBe('xlsx');
  });
});
