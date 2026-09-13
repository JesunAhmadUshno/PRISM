/**
 * Lazy, integrity-checked loader for the vendored SheetJS build.
 *
 * Why this exists rather than `import * as XLSX from 'xlsx'`:
 *
 * The npm package `xlsx` is frozen at 0.18.5 and carries two advisories that
 * will never be fixed there, because SheetJS moved distribution off npm:
 *   GHSA-4r6h-8v6p-xvw6  prototype pollution in XLSX.read
 *   GHSA-5pgg-2g8v-p4x9  ReDoS
 * `npm audit` reports `fixAvailable: false`, and PRISM fed user-supplied bytes
 * straight into that parser.
 *
 * 0.20.3 fixes both (prototype pollution in 0.19.3, ReDoS in 0.20.2). It is
 * vendored into `public/vendor/` and served same-origin rather than pulled from
 * cdn.sheetjs.com, which buys three things at once:
 *   - the advisories are actually remediated, not merely mitigated
 *   - Excel parsing keeps working offline, which the product's own pitch implies
 *   - `script-src 'self'` covers it, so the CSP no longer needs a CDN allowance
 *
 * It is loaded on demand, so the ~930 kB parser is no longer downloaded and
 * evaluated on every page view by users who never open a spreadsheet.
 *
 * The integrity hash was computed locally from the vendored file:
 *   openssl dgst -sha384 -binary public/vendor/xlsx-0.20.3.full.min.js \
 *     | openssl base64 -A
 * Never copy an SRI hash from a web page. Recompute it if you change the file.
 */

const SHEETJS_FILE = 'vendor/xlsx-0.20.3.full.min.js';
const SHEETJS_INTEGRITY = 'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT';

/** The subset of the SheetJS surface PRISM actually uses. */
export interface SheetJS {
  read(data: ArrayBuffer | Uint8Array, opts?: Record<string, unknown>): {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_csv(sheet: unknown, opts?: Record<string, unknown>): string;
  };
}

declare global {
  interface Window {
    XLSX?: SheetJS;
  }
}

/** Single in-flight promise, so concurrent uploads do not inject two script tags. */
let loading: Promise<SheetJS> | null = null;

export function loadSheetJS(): Promise<SheetJS> {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (loading) return loading;

  loading = new Promise<SheetJS>((resolve, reject) => {
    const script = document.createElement('script');

    // BASE_URL keeps this correct under the '/PRISM/' base used for Pages.
    script.src = `${import.meta.env.BASE_URL}${SHEETJS_FILE}`;
    script.integrity = SHEETJS_INTEGRITY;

    // Same-origin, but SRI on a classic script requires a CORS mode to be set.
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      if (window.XLSX) {
        resolve(window.XLSX);
      } else {
        loading = null;
        reject(new Error('SheetJS loaded but did not define window.XLSX'));
      }
    };

    script.onerror = () => {
      loading = null;
      script.remove();
      // An integrity mismatch surfaces here too, and that case matters: it means
      // the vendored file does not match the hash compiled into this module.
      reject(
        new Error(
          'Could not load the spreadsheet parser. If the vendored file was ' +
            'replaced, its integrity hash in src/lib/sheetjs-loader.ts must be ' +
            'recomputed to match.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return loading;
}
