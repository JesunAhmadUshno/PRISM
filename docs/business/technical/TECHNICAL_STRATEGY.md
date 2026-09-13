# PRISM Technical Strategy

**Owner:** CTO
**Status:** Draft for founder review
**Date:** 2026-09-13
**Scope:** Six months from today to a product a stranger will pay for.
**Branch of record:** `army/prism-upgrade`

---

## 0. What is actually here today

Every number in this section was measured from the working tree, not recalled.

| Measure | Value | How measured |
|---|---|---|
| Source files under `src/` | 21 | `find src -type f` |
| Lines under `src/` (ts, tsx, py, css) | 6,560 | `wc -l` |
| Same, excluding `src/styles/index.css` | 6,108 | 6,560 minus 452 |
| Largest single file | `AnalyticsWorkspace.tsx`, 1,586 lines | `wc -l` |
| Python analytics engine | `src/python/prism_core.py`, 657 lines | `wc -l` |
| Worker (Python embedded as a JS template literal) | `src/workers/prism.worker.js`, 1,470+ lines | read |
| Built entry chunk | `dist/js/index-BCPVG91P.js`, 488,502 bytes | `ls -l dist/js` |
| Built charts chunk | `dist/chunks/vendor-charts-CkhUdhnn.js`, 564,384 bytes | `ls -l dist/chunks` |
| Built `vendor-react` chunk | 37 bytes | `ls -l dist/chunks` |
| Built worker asset | `dist/assets/prism.worker-HndLS_VU.js`, 56,503 bytes | `ls -l dist/assets` |
| Statistical tests implemented | 17 | `grep "test_id ==" src/workers/prism.worker.js` |
| `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` in `src/` | zero occurrences | `grep -rn` across `src/` |
| Test files | zero | no `vitest.config.ts`, no `*.test.*` |

Two of those rows deserve to be read twice.

**`vendor-react` is 37 bytes.** The `manualChunks` map in `vite.config.ts` names `react` and
`react-dom` as their own chunk, but the emitted file is 37 bytes, which means React is not in it.
React is inside the 488 kB entry chunk, along with `xlsx`, which is statically imported at
`src/stores/prismStore.ts:11`. The chunking config currently believes something that is not true.
Fix this before optimising anything else, because every bundle number downstream is being read off
a broken split.

**Zero network primitives in `src/`.** I verified this myself rather than taking it on trust. This
is the asset. Everything in this document is in service of keeping that true, proving it to a
buyer, and shipping enough product around it that someone pays.

---

## 1. The honest gap between "works" and "sellable"

PRISM demonstrably runs. Drop in a CSV, get seventeen statistical tests and charts, and no server
ever sees the file. That is a real technical achievement and it is not a product.

Four things stand between here and a first invoice, in priority order:

1. **Nothing comes out.** There is no export path in `src/`. I grepped for `Blob`,
   `createObjectURL`, `download`, `localStorage`, `sessionStorage`, `indexedDB`: zero hits. An
   analyst can compute a result and cannot get it into a deck, an email, or a working paper. The
   privacy guarantee is currently so total that it also excludes the user from their own output.
   This is the single largest gap.
2. **Nothing is verified.** Zero tests. The README asserts WCAG 2.2 AAA and ISO/IEC 27001:2022 with
   nothing behind either. A buyer's security reviewer will ask for evidence, and the honest answer
   today is that there is none. An unverified claim is worse than no claim, because it tells the
   reviewer the rest of the document is also unchecked.
3. **A known-vulnerable dependency in the parse path.** `xlsx@0.18.5` is statically imported and
   handles untrusted file bytes on the main thread. `npm audit` reports a HIGH prototype pollution
   advisory with no npm-published fix.
4. **The identity of the thing is incoherent.** `LICENSE` contains the MIT License text.
   `package.json` declares `"license": "PROPRIETARY"` and `"private": true`. The README reads as
   open source. `repository.url` points at `github.com/organization/prism.git`, a placeholder. You
   cannot sell a licence to software whose licence contradicts itself in three places.

There is a fifth item that is subtler and matters more than it looks.

**The document CSP does not govern the Web Worker.** The CSP in `index.html` is a `<meta>` tag. The
worker is created from a same-origin script URL (`new URL('../workers/prism.worker.js',
import.meta.url)` at `src/stores/prismStore.ts:80`). A dedicated worker loaded from a same-origin
URL takes its CSP from the HTTP response headers of its own script, not from the parent document's
meta tag. GitHub Pages serves no CSP response header. So the worker, which is where all the data
actually lives, runs under no CSP at all. This is precisely why `importScripts` to the Pyodide CDN
succeeds at `prism.worker.js:1128` even though `connect-src` never contemplates it.

The zero-exfiltration property is still true. It is true because the code contains no network
primitives, which I verified. But right now it is enforced by code review, not by the browser. The
claim we make to buyers should match the enforcement we actually have, and the roadmap below closes
that gap in Month 3 by moving to a host that can set real response headers.

---

## 2. Definition of sellable

These are the gates. First paying customer does not happen until every line is true and evidenced
by something automated.

| # | Gate | Evidence that closes it |
|---|---|---|
| S1 | CI is green on typecheck, lint, test, build | `.github/workflows/ci.yml` passes on the default branch |
| S2 | No HIGH or CRITICAL advisory in the dependency tree | `npm audit --audit-level=high` exits 0 in CI |
| S3 | Zero-egress is enforced by the browser, not only by review | CSP response headers covering the worker; CI asserts no network primitives in `dist/` |
| S4 | Results leave the tab under user control | Chart PNG/SVG, results CSV, self-contained HTML report, all client-generated |
| S5 | Statistical output is correct on known-answer inputs | Test suite comparing all 17 tests against published reference values |
| S6 | Claims match reality | README, LICENSE, package.json coherent; every compliance word backed or deleted |
| S7 | Failure is graceful at the size ceiling | Documented limits, pre-flight size check, no silent truncation in charts |
| S8 | A buyer's security team can self-verify in under an hour | Threat model, SBOM, reproducible build, an egress test they can run themselves |
| S9 | Someone can pay without us running a server | Offline licence activation, or a paid self-hosted build |

S9 is the one people forget. A product with no backend cannot phone home to check a subscription.
Section 5 deals with it.

---

## 3. The xlsx migration, concretely

**Current state.** `src/stores/prismStore.ts:11` does `import * as XLSX from 'xlsx'`. It is used at
two call sites, `setFile` (lines ~159 and ~172) and `addDataset` (lines ~388 and ~397). Both do the
same two operations: `XLSX.read(buffer, { type: 'array' })` then
`XLSX.utils.sheet_to_csv(sheet)`. Because the import is static, the library sits in the entry chunk
and loads for every visitor, including the ones who only ever open a CSV.

The CSP in `index.html` already lists `https://cdn.sheetjs.com/` under `script-src`. It is **not**
listed under `connect-src`, and it must not be added there. The distribution must be loaded as a
script, never via `fetch`, because a `fetch` call appearing in `src/` would break the one property
the whole product rests on.

### Steps

**X0. Record the advisory ID before touching anything.**
Run `npm audit --json > audit-before.json` and copy the exact advisory identifier and affected
range into the migration PR description. Do not quote an advisory number from memory. The PR needs
a before-and-after pair that a reviewer can diff.

**X1. Pick and pin an exact version.**
Choose a specific SheetJS release at
`https://cdn.sheetjs.com/xlsx-<version>/package/dist/xlsx.full.min.js`. Pin the exact version
string. No ranges, no `latest`.

**X2. Compute the Subresource Integrity hash yourself.**
Download the file once, locally, then compute:

```
openssl dgst -sha384 -binary xlsx.full.min.js | openssl base64 -A
```

Prefix the result with `sha384-`. Do not copy an integrity hash from any web page. A hash you did
not compute is a hash you cannot vouch for, and SRI is the only thing standing between us and a
compromised CDN executing arbitrary code inside the tab that is holding the user's data.

**X3. Add a loader module** at `src/lib/sheetjs-loader.ts`:

- injects a `<script>` element with the pinned `src`, the `integrity` value from X2, and
  `crossorigin="anonymous"`
- caches the in-flight promise so concurrent Excel drops load it exactly once
- resolves with the `XLSX` global, rejects on the `error` event with a message the UI can show
- contains no `fetch`, no `XHR`, and no dynamic string concatenation into `src`

**X4. Add an ambient type declaration** so TypeScript still checks the call sites once the npm types
are gone. A minimal `declare global` covering only `read` and `utils.sheet_to_csv`, the two
functions actually used, is better than pulling the full type package back in.

**X5. Rewrite the two call sites** in `prismStore.ts` to `await loadSheetJS()` first, then call
`read` and `sheet_to_csv` on the returned object. The API surface is identical, so the body of each
branch changes by one line plus the await.

**X6. Remove `xlsx`** from `package.json` dependencies and from `optimizeDeps.include`, then
reinstall to regenerate the lockfile. Run `npm audit --json > audit-after.json`.

**X7. Verify the four things that can silently break:**

- the entry chunk shrinks (compare `ls -l dist/js` before and after)
- a CSV-only session issues no request to `cdn.sheetjs.com` (DevTools Network, filtered)
- an `.xlsx` fixture still parses and produces byte-identical CSV to the old path
- no CSP violation appears in the DevTools console

**X8. Handle the new failure mode, which is real.**
Today, Excel parsing works with no network access at all. After X5 it needs one CDN request on the
first Excel file of a session. A user behind a restrictive corporate proxy, or on a plane, loses
Excel support while CSV and XML keep working. The UI must say exactly that, not "something went
wrong". This is a genuine regression in the offline story and it belongs in the release notes, not
smoothed over.

**X9. The stronger variant, recommended as a follow-up in Month 2.**
Vendor the same pinned, hash-verified file into `public/` and serve it same-origin. `script-src
'self'` then covers it, the advisory is still closed, the SRI concern disappears because we serve
the bytes ourselves, and PRISM goes back to working with the network cable unplugged. The only cost
is that updating SheetJS becomes a deliberate commit instead of a version bump. For a product whose
entire pitch is that nothing leaves your machine, a vendored copy is more defensible than a CDN.
Ship the CDN migration first because it closes the HIGH advisory fastest, then land X9.

---

## 4. Six-month roadmap

Each month has exit criteria. A month does not close because the calendar says so.

### Month 1: Stop the bleeding

Goal: the repository stops asserting things that are not true, and the known vulnerability is gone.

- X0 to X8 above. Advisory closed, `npm audit --audit-level=high` clean.
- Fix the chunking defect in `vite.config.ts`. `vendor-react` at 37 bytes means the split is not
  doing what it claims. Get React genuinely into its own chunk.
- Lazy-load `recharts`. The 564 kB charts chunk is downloaded by users who have not yet dropped a
  file. Charts are not needed until a dataset exists.
- Resolve the licence contradiction. Pick one of proprietary or open source and make `LICENSE`,
  `package.json`, and `README.md` agree. Replace the `github.com/organization/prism.git`
  placeholder with the real remote.
- Remove the unverified WCAG 2.2 AAA and ISO/IEC 27001:2022 claims from the README. Replace them
  with what is defensible today: the architecture was designed against those frameworks,
  verification is in progress, and here is the evidence trail as it lands.
- Fix `MAX_FILE_SIZE` in `src/security/validator.ts`. The constant is `500 * 1024 * 1024` and the
  doc comment directly above it says 50MB. One of those is wrong and nobody currently knows which
  was intended. Decide deliberately, using the ceilings in `SCALING_LIMITS.md`.

**Exit:** `npm audit --audit-level=high` exits 0. README contains no unbacked compliance claim.
Licence is coherent. Entry chunk is measurably smaller.

### Month 2: Make the numbers trustworthy

Goal: a statistician can check our arithmetic, and so can CI.

The parallel engineering team is standing up the test harness. This month is about what the tests
must cover, which is a CTO call rather than a harness call.

- **Known-answer tests for all 17 statistical tests.** Each one gets a fixture whose correct
  statistic and p-value come from a published source, or from R or scipy run on the same input,
  with the provenance recorded in the test file. This is the difference between a product and a
  demo.
- **Fix three statistical correctness defects found while reading `prism.worker.js`:**
  - `independent_t` takes `df[group_col].dropna().unique()[:2]`. With three or more groups it
    silently picks the first two in encounter order and reports the result as though that were the
    whole comparison. It must refuse, or make the group choice explicit in the UI.
  - `paired_t` truncates both columns to `min_len` and pairs them **by position**. Pairing is a
    property of the data, not of row order, and a null in either column shifts every pair after it.
  - `shapiro_wilk` subsamples to 5,000 rows when the column is larger. That is defensible, and it
    is currently invisible to the user. Report the sample size alongside the p-value.
- **Egress regression test.** A CI step that scans the built `dist/` output for `fetch(`,
  `XMLHttpRequest`, `WebSocket`, and `sendBeacon`, failing the build on a hit. Allowlist exactly one
  thing, the Pyodide `importScripts` URL, by exact string. This converts the core claim from "we
  checked once" into "CI checks on every commit", which is the form a buyer can actually audit.
- **Accessibility, measured.** `axe-core` and `eslint-plugin-jsx-a11y` are already in
  `devDependencies` and currently unused. Wire them up, run them, publish the real conformance level
  whatever it turns out to be. If the result is AA with three known gaps, say AA with three known
  gaps. That sentence sells better than an unbacked AAA.
- Land X9 (vendored SheetJS).

**Exit:** All 17 tests have known-answer coverage. The three correctness defects are fixed or
explicitly gated in the UI. CI fails when a `fetch(` is introduced. An accessibility number exists
and is honest.

### Month 3: Enforce the claim in the browser

Goal: move the zero-egress guarantee from code review into the platform.

- **Move hosting to something that can set response headers.** GitHub Pages cannot, which is why the
  worker runs with no CSP and why `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`
  cannot be set at all. Any static host with a headers file will do. Requirements: a real
  `Content-Security-Policy` response header on both the document and the worker script,
  `frame-ancestors 'none'`, `Referrer-Policy`, and `Permissions-Policy`. The `vite.config.ts` dev
  server already defines close to the header set we want; production has never had it.
- **Write the threat model.** Assets, adversaries, trust boundaries, what PRISM defends against and
  what it explicitly does not. It does not defend against a compromised browser, a malicious
  extension with host permissions, a keylogger, or a user screenshotting the results. Naming what
  you do not defend against is what makes the list of what you do defend against credible.
- **Publish an SBOM** generated in CI from the lockfile, on every release.
- **Reproducible build.** A buyer should be able to check out the tag, build, and obtain the same
  hashes as the deployed artifacts. Publish the hashes with each release.
- Decide on COOP and COEP. Cross-origin isolation would unlock `SharedArrayBuffer` and therefore
  Pyodide threading, but it constrains what can be loaded cross-origin, which interacts directly
  with the CDN decision in X9. Measure before committing.

**Exit:** A security reviewer can load the deployed app, open DevTools, and see the CSP enforced on
the worker. Threat model, SBOM, and build hashes are published.

### Month 4: Let the work leave the tab

Goal: close S4, the largest product gap.

Everything here is generated client-side. No upload, ever.

- **Chart export to PNG and SVG.** Recharts renders SVG, so serialise the node and rasterise through
  an offscreen canvas for PNG, then hand the user a `Blob`. No server round-trip and no third-party
  rendering service, either of which would destroy the claim.
- **Results export to CSV.** Summary statistics, the full correlation matrix, and every test result
  with its statistic, p-value, degrees of freedom, and interpretation string.
- **Self-contained HTML report.** One file, charts inlined as SVG, no external references, opens
  offline anywhere. This is the artefact an analyst actually attaches to an email, and it inherits
  the privacy property because it never touched a server.
- **Session persistence, opt-in and local.** There is no storage in `src/` today, so a refresh
  destroys everything including a warm Pyodide runtime. IndexedDB, explicitly opt-in, with a visible
  "clear everything" control. For the threat model this is a real change: data at rest on the user's
  disk is a new state to reason about. Default it off, say so plainly, and make the clear control
  impossible to miss.
- **Fix the warm-runtime defect.** `clearFile` calls `terminateWorker()`, which discards the
  initialised Pyodide instance. The next file then pays the full cold start again. Keep the worker
  alive and reset the Python state instead.

**Exit:** A user can produce a chart, a statistics table, and a shareable report without any byte
leaving the machine. Second and subsequent files in a session start analysis without a cold start.

### Month 5: Survive real files

Goal: the ceilings in `SCALING_LIMITS.md` become handled cases instead of crashes.

- **Measure the ceilings.** `SCALING_LIMITS.md` specifies the measurement protocol. Run it on
  Chrome, Firefox, Safari, and one mid-range Android device. Publish the numbers. Until this is
  done, every size figure we state is a guess and must be labelled as one.
- **Pre-flight sizing.** Before parsing, estimate the memory the pipeline will require and warn or
  refuse above the measured ceiling, with a specific message. Today a file that is too large
  produces a killed tab and no explanation at all.
- **Stop silent truncation in charts.** Scatter plots are capped at 500 points, line previews at
  100, bar charts at 15 categories, and the user is never told. A chart that silently shows 500 of
  200,000 points is a wrong chart. Label every truncated visual with the sampling rule applied.
- **Streaming CSV ingest.** `file.text()` materialises the whole file as a JS string before anything
  else happens. `papaparse` is already a dependency and supports streaming. This removes one full
  copy from the peak-memory chain described in `SCALING_LIMITS.md`.
- **Move Excel parsing into the worker.** Keeps the ArrayBuffer and the SheetJS workbook off the UI
  thread, so a large `.xlsx` stops freezing the interface.
- **Take a mobile position.** Decide whether mobile is supported, degraded, or explicitly
  unsupported, and say which in the UI. An iOS tab killed for memory reloads with no catchable error
  and no message; the user simply watches their work vanish. Any of the three positions is
  defensible. Silence is not.

**Exit:** Published, measured ceilings. Files above the ceiling are refused with a clear reason. No
chart truncates without saying so.

### Month 6: Make it purchasable

Goal: someone can pay, and the thing they receive is licensed, versioned, and supportable.

- **Licensing that respects the architecture (S9).** Two options, neither requiring a backend at
  runtime:
  - *Offline activation keys.* Issue a signed licence token out of band, verified locally with
    WebCrypto. No phone-home, therefore no telemetry, therefore the privacy claim survives intact.
    The cost is honest: offline verification cannot revoke, and a key can be shared. That is the
    same trade every offline-licensed product makes.
  - *Paid self-hosted build.* Sell a versioned artifact the customer serves inside their own
    perimeter. For the regulated buyers this product targets, this may be the easier sale, and it
    moves the CSP-header problem onto infrastructure they already control.

  Pick one for launch. Do not build both.
- **Versioning and release discipline.** Semantic versions, tagged releases, a changelog, published
  build hashes. `package.json` currently says `1.0.0` for software with seven commits and no tests.
- **Support surface.** A documented way to report a bug that does not require sending us the data,
  because the data is the entire point. Redacted reproduction guidance: schema and shape, never
  contents.
- **Security review by someone who is not us.** Budget for it. The founder's KPMG background makes
  this a fair fight to run, but a self-audit is not an audit, and a buyer's reviewer knows that.

**Exit:** An invoice can be raised, a licence delivered, and the customer can verify what they
received.

---

## 5. What I am deliberately not doing in six months

Saying no is half of a roadmap.

- **No backend.** Not for auth, not for storage, not for telemetry, not for "just analytics". One
  server endpoint ends the only differentiated claim this product has. If a feature needs a server,
  it is not a PRISM feature.
- **No usage telemetry.** Not even anonymous counters. The product cannot both promise zero egress
  and count things. This costs real product intelligence and it is the correct trade.
- **No collaboration or sharing.** Multi-user anything requires a server. The export path in Month 4
  is the answer to sharing: a file the user sends themselves, by whatever means they already trust.
- **No scheduled or recurring analysis.** That requires a machine that is awake when the user is
  not.
- **No datasets beyond browser memory.** The ceiling is real, and it gets documented rather than
  engineered around. Customers whose data does not fit are not our customers yet.
- **No mobile-first work.** Measure it in Month 5, take a position, move on.
- **No additional statistical tests until the existing 17 are verified.** Breadth on an unverified
  base multiplies the surface of things that might be quietly wrong.

---

## 6. Risks

| Risk | Impact | Response |
|---|---|---|
| Pyodide CDN outage or version pull | Product is fully dead, not degraded. Hardest single external dependency. | Self-host the Pyodide distribution behind `'self'`. Same argument as X9, larger payload. Scope in Month 3. |
| CDN compromise executing inside the data-holding tab | Total compromise of the core claim | SRI on every external script, pinned versions, self-host wherever payload allows |
| Measured ceiling lands far below what buyers bring | Disqualified during evaluation | Measure in Month 5 before committing to any customer-facing size number |
| The 17 tests disagree with R or SPSS on an edge case | Trust loss, and trust is the product | Known-answer tests in Month 2, provenance recorded per fixture |
| Single-maintainer bus factor | Everything stops | Documentation-first: these three files, the threat model, and the ADRs are the mitigation |
| Browser vendor changes WASM or worker memory behaviour | Silent regression in the ceilings | Re-run the Month 5 measurement protocol each quarter |

---

## 7. What I would tell a buyer today, and what I would not

**Would say:** all computation happens in your browser; the source contains no network calls and CI
will prove it on every commit; you can run it from a local file server inside your own perimeter;
here is the threat model, the SBOM, and the build hashes; and here is a written list of what it
cannot do.

**Would not say, yet:** any certification word, any conformance level we have not measured, any
dataset size we have not benchmarked, and any claim that the browser is enforcing the egress
guarantee until the Month 3 header work lands.

The distance between those two lists is exactly this roadmap.
