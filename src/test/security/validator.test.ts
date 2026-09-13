/**
 * Unit tests for src/security/validator.ts — size / extension / MIME / magic bytes.
 *
 * These guard the "first line of defense" claim in the module header, so every
 * assertion here is about a real accept/reject decision, not a shape check.
 */
import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateFileExtension,
  validateMimeType,
  validateMagicBytes,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
} from '@/security/validator';

/** Builds a File with an exact byte header, so magic-byte checks are real. */
function fileWithHeader(bytes: number[], name: string, type = ''): File {
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return new File([padded], name, { type });
}

const ZIP_HEADER = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" — xlsx/ooxml
const OLE2_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // legacy .xls

describe('validateFileSize', () => {
  it('rejects files below the minimum and names the limit', () => {
    const result = validateFileSize(MIN_FILE_SIZE - 1);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too small');
    expect(result.error).toContain(String(MIN_FILE_SIZE));
  });

  it('accepts a file of exactly the minimum size (boundary is inclusive)', () => {
    expect(validateFileSize(MIN_FILE_SIZE)).toEqual({ isValid: true });
  });

  it('accepts a file of exactly the maximum size and rejects one byte more', () => {
    expect(validateFileSize(MAX_FILE_SIZE).isValid).toBe(true);
    expect(validateFileSize(MAX_FILE_SIZE + 1).isValid).toBe(false);
  });

  it('enforces a 500MB ceiling, not the 50MB the doc comment advertises', () => {
    // TODO(BUG): validator.ts:16-20 documents "Maximum file size: 50MB /
    // Prevents memory exhaustion attacks" but the constant is 500 * 1024 * 1024.
    // Test pins the real behaviour; do not "fix" the test if the constant changes.
    expect(MAX_FILE_SIZE).toBe(500 * 1024 * 1024);
    expect(validateFileSize(100 * 1024 * 1024).isValid).toBe(true);
  });
});

describe('validateFileExtension', () => {
  it.each([
    ['data.csv', true],
    ['book.xlsx', true],
    ['legacy.xls', true],
    ['feed.xml', true],
    ['payload.exe', false],
    ['script.js', false],
    ['README', false],
  ])('%s -> valid=%s', (name, expected) => {
    expect(validateFileExtension(name).isValid).toBe(expected);
  });

  it('is case-insensitive on the extension', () => {
    expect(validateFileExtension('QUARTER.CSV').isValid).toBe(true);
  });

  it('only inspects the final segment, so a double extension passes', () => {
    // Documents real behaviour: the last dot wins.
    expect(validateFileExtension('payload.exe.csv').isValid).toBe(true);
    expect(validateFileExtension('report.csv.exe').isValid).toBe(false);
  });
});

describe('validateMimeType', () => {
  it('accepts a recognised MIME type', () => {
    expect(validateMimeType('text/csv', 'data.csv').isValid).toBe(true);
  });

  it('falls back to the extension when the browser reports no MIME type', () => {
    expect(validateMimeType('', 'data.csv').isValid).toBe(true);
  });

  it('accepts a hostile MIME type as long as the extension is allowed', () => {
    // TODO(BUG): validator.ts:172-193 — the extension fallback runs even when a
    // MIME type IS present and is explicitly not in SUPPORTED_TYPES, so the MIME
    // check can never reject anything that got past validateFileExtension.
    expect(validateMimeType('application/x-msdownload', 'payload.csv').isValid).toBe(true);
  });

  it('rejects when neither MIME type nor extension is supported', () => {
    const result = validateMimeType('application/x-msdownload', 'payload.exe');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('CSV, Excel, or XML');
  });
});

describe('validateMagicBytes', () => {
  it('skips the check for CSV, which has no signature', async () => {
    const csv = new File(['a,b\n1,2\n'], 'data.csv', { type: 'text/csv' });
    await expect(validateMagicBytes(csv)).resolves.toEqual({ isValid: true });
  });

  it('accepts a real ZIP/OOXML header for .xlsx', async () => {
    const xlsx = fileWithHeader(ZIP_HEADER, 'book.xlsx');
    await expect(validateMagicBytes(xlsx)).resolves.toEqual({ isValid: true });
  });

  it('rejects a .xlsx whose bytes are not a ZIP (extension spoofing)', async () => {
    const spoofed = fileWithHeader([0x4d, 0x5a, 0x90, 0x00], 'payload.xlsx'); // "MZ" PE header
    const result = await validateMagicBytes(spoofed);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('does not match Excel format');
  });

  it('rejects every genuine legacy .xls file', async () => {
    // TODO(BUG): getFileType() (validator.ts:294-301) maps ".xls" to the "xlsx"
    // branch, but MAGIC_BYTES.xlsx (validator.ts:46-50) only lists ZIP/PK
    // signatures. A real BIFF8 .xls starts with the OLE2 compound-document magic
    // D0 CF 11 E0 A1 B1 1A E1, so it can never pass — while the uploader,
    // README and validateFileExtension all advertise .xls support.
    const legacyXls = fileWithHeader(OLE2_HEADER, 'legacy.xls', 'application/vnd.ms-excel');
    const result = await validateMagicBytes(legacyXls);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('does not match Excel format');
  });

  it('accepts an XML declaration header', async () => {
    const xml = new File(['<?xml version="1.0"?><root/>'], 'feed.xml', { type: 'text/xml' });
    await expect(validateMagicBytes(xml)).resolves.toEqual({ isValid: true });
  });

  it('accepts any .xml file that merely starts with "<"', async () => {
    // Documents the permissive fallback at validator.ts:235-237.
    const html = new File(['<html><body>not xml</body></html>'], 'feed.xml', { type: 'text/xml' });
    await expect(validateMagicBytes(html)).resolves.toEqual({ isValid: true });
  });

  it('rejects an .xml file that does not start with "<"', async () => {
    const notXml = new File(['plain text, no markup at all'], 'feed.xml', { type: 'text/xml' });
    const result = await validateMagicBytes(notXml);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('valid XML');
  });
});
