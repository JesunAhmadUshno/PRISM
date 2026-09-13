# PRISM Engineering Ledger

Run 1, branch army/prism-upgrade. 44 agents, 0 errors, 2,509,338 subagent tokens, 38 minutes.

Findings are scored, not merely listed. A finding only counts once two adversarial
reviewers, both defaulting to REFUTED, fail to kill it. False positives cost points,
which is what stops a fleet of agents from spraying plausible noise.

| event | points |
| :--- | ---: |
| confirmed security finding | +10 |
| confirmed bug with reproduction | +5 |
| idea accepted | +3 |
| false positive | -3 |

```
recon findings     48
unique             48
sent to verify     14   (top severity, 34 deferred unverified)
CONFIRMED          12
REJECTED           2
SCORE              72
```

## Confirmed and addressed

### 1. The Pyodide worker - the only thread that ever holds the plaintext user data - runs with NO Content Security Policy at all

src/stores/prismStore.ts:80 | CRITICAL | security

Stop relying on a meta CSP for the security claim. Either (a) deploy behind something that can send a real `Content-Security-Policy` response header on every asset including the worker script, or (b) instantiate the worker from a blob: URL built from the worker source so it inherits the creator's policy container, and verify with a deliberate cross-origin fetch that it is blocked. Then add a regression test that asserts the worker context cannot reach an off-origin URL.

### 2. Worker loads and executes third-party remote code (Pyodide + pandas/numpy/scipy wheels) with no SRI, into that unsandboxed context, at the exact moment it holds user data

src/workers/prism.worker.js:1128 | CRITICAL | security

Vendor Pyodide and the required wheels into the build so they are served same-origin and covered by the app's own policy, and drop the CDN entirely (this also makes the app genuinely offline-capable, which is what the marketing claim implies). If the CDN must stay, at minimum fetch pyodide.js yourself with an explicit SHA-384 check before eval-ing it rather than using bare `importScripts`, pass an explicit `indexURL`, and remove the preconnect so no network contact occurs until the user initiates an analysis.

### 3. NaN/Infinity leak into analyze_csv() JSON - any missing value in a charted column kills the entire upload

src/workers/prism.worker.js:279 | CRITICAL | bug

Serialize with `json.dumps(..., allow_nan=False)` after scrubbing, or sanitize every payload through one recursive helper that maps non-finite floats to None (reuse/hoist the existing `to_python`). Apply it to get_chart_data's record lists (279, 272), to compute_statistics (165-171, swap `pd.notna(x)` for `np.isfinite(x)`), and to run_visualization's `to_serializable`. Belt-and-braces: have the JS side reject non-finite tokens before JSON.parse rather than letting a SyntaxError surface as a generic analysis failure.

### 4. Paired t-test pairs the wrong rows - positional slicing after independent dropna()

src/workers/prism.worker.js:528 | CRITICAL | bug

Align on the shared index before testing, matching the other paired tests:
```python
valid_idx = col1.index.intersection(col2.index)
stat, p = scipy_stats.ttest_rel(col1.loc[valid_idx], col2.loc[valid_idx])
```
And surface the dropped-pair count in the interpretation string so silent listwise deletion is visible.

### 5. role="application" on #root disables NVDA/JAWS browse mode app-wide, making every sr-only fallback unreachable

index.html:127 | CRITICAL | bug

Delete `role="application"` from index.html:127. It buys nothing here - there is no custom keyboard-driven widget on the page that needs raw key forwarding. If some future grid needs it, scope `role="application"` to that single widget, never to the document root. This one attribute is the difference between the README's NVDA/VoiceOver claim being roughly true and being false.

### 6. AnalyticsWorkspace (1586 LOC, the app's primary surface) contains zero ARIA: no live regions, no tab semantics, no table semantics

src/components/analytics/AnalyticsWorkspace/AnalyticsWorkspace.tsx:671 | CRITICAL | bug

Per file: (1) give TabButton `role="tab"`, `aria-selected={active}`, `aria-controls`, `id`, and roving `tabIndex`, wrap the group in `role="tablist"` with arrow-key handling, and add `role="tabpanel" aria-labelledby` to each panel; (2) wrap each results pane in `role="status" aria-live="polite" aria-atomic="true"`, or move focus to the results heading after a run completes; (3) add `<caption>` and `scope="col"`/`scope="row"` to both tables. Note this file is 26% of the codebase and was evidently written after the a11y work in SmartChart/FileUploader - the AAA claim was never re-validated against it.

### 7. Pyodide + pandas/numpy (~25 MB) download starts only AFTER the user picks a file; the worker is never warmed at app start

src/stores/prismStore.ts:77 | CRITICAL | bug

Create the worker and post `{type:'INIT'}` from a top-level `useEffect` in App.tsx (or at module scope in prismStore.ts, guarded), so the Pyodide/pandas download overlaps the user reading the landing page and choosing a file. The INIT handler already exists at prism.worker.js:1448 and `initializePyodide` is idempotent (:1115-1117), so this is a warm-up call with no duplicate-load risk.

### 8. Every CSV parse uses pandas' pure-Python engine, and the full CSV is re-shipped and re-parsed from scratch on every workspace action

src/workers/prism.worker.js:65 | CRITICAL | bug

Drop `engine='python'` from :65-70, :352, :444, :774, :866 (keep it only on the `sep=None` sniffing fallback at :73-78, which requires it). Then keep the parsed DataFrame in the worker: `run_statistical_test`/`run_preprocessing`/`run_visualization` should accept the already-loaded `PrismAnalytics.df` and `runCustomAnalysis` should stop sending `dataContent` unless the worker reports it has no data cached.

### 9. LICENSE is MIT while README, badge and package.json all say Proprietary - the repo is legally open source

LICENSE:1 | CRITICAL | bug

Decide the model once, then make all four places agree. If proprietary: replace LICENSE with a real proprietary/EULA text, set `"license": "UNLICENSED"` in package.json, keep `private: true`. If open source: drop the Proprietary badge and the README:117 line, set `"license": "MIT"`. Either way replace the `github.com/organization/prism` placeholder with the real remote - it is the URL `npm repository` and every dependency dashboard will follow.

### 10. Zero export path exists - nothing a user produces can leave the tab, not even locally

src/App.tsx:402 | CRITICAL | idea

This is the single highest-leverage feature here, and uniquely it is one where zero-egress is an advantage rather than a constraint - every export is a client-side Blob + `URL.createObjectURL`, so nothing touches the network and the privacy claim strengthens rather than weakens. Ship, in order: (1) chart → PNG/SVG via the Recharts SVG node serialized to a canvas; (2) summary/stat-test results → CSV, which the Python layer already has as dicts at prism.worker.js:279 `self.df[cols].head(limit).to_dict('records')`; (3) a self-contained single-file HTML report with inlined SVG charts and a provenance header (filename, SHA-256 of the input, Pyodide version, UTC timestamp). Item 3 is the actual product: an auditable analysis artifact that provably never left the analyst's machine is what a compliance buyer pays for.

### 11. Quadratic-backtracking ReDoS in DANGEROUS_PATTERNS, run synchronously on the main thread over files up to 500 MB

src/security/validator.ts:67 | HIGH | security

Delete `validateContentSecurity` and DANGEROUS_PATTERNS entirely - they scan for an attack that the rendering layer does not permit, and pattern-matching file bodies is the wrong control. If a content scan is genuinely wanted, run it in a worker on a bounded prefix (e.g. first 64 KB) with a linear-time matcher (indexOf / a regex with no nested quantifier over `\w`), and never on the full 500 MB.

### 12. Attacker-controlled XLSX goes straight into xlsx@0.18.5's prototype-pollution sink, and XLSX is the one format exempted from content inspection

src/stores/prismStore.ts:159 | HIGH | security

Move to the maintained SheetJS distribution at >= 0.20.x (the npm `xlsx` package is frozen at 0.18.5 and will never be patched), or swap to an actively maintained reader. Either way: move `XLSX.read` off the main thread into the worker, pass `{ type:'array', sheetRows: <cap>, cellFormula: false, cellHTML: false }`, and stop exempting xlsx from whatever content validation remains. Also de-duplicate the two copies of this block (prismStore.ts:157 and :386) so the hardening cannot be applied to only one.

## Rejected by adversarial review

Reported by a recon specialist, then killed on verification. Recorded so the same
ground is not re-covered next run.

- **Singleton Worker with reassigned onmessage: concurrent analyses silently clobber each other and leave promises forever pending**
  REFUTED as a critical bug - the code description is accurate, but the claimed failure does not reproduce through any reachable path.  WHAT IS TRUE (every cited line checked): - src/stores/prismStore.ts:75 `let worker: Worker | null = null;` and getWorker() :77-86 - one module-level singleton, never per-request. - The handler slot is reassigned, not added: `prismWorker.onmessage = (event: MessageEv

- **CSP's own allowlist is a working exfiltration channel: `connect-src` permits arbitrary paths under cdn.jsdelivr.net, and `script-src` additionally allows an unused CDN**
  Sub-facts verify, impact claim does not. Verified true: index.html:19/:24 quoted accurately; CSP path expressions ending in "/" do prefix-match and the query string is not compared, so https://cdn.jsdelivr.net/pyodide/x?d=DATA is permitted by connect-src; cdn.sheetjs.com is genuinely dead surface (xlsx is a bundled npm dep - prismStore.ts:11 `import * as XLSX from 'xlsx'`, used at :159 and :172, p

## Deferred backlog

Surfaced by recon, below the severity cut for this run's verification budget.
Not verified, so treat each as a claim rather than a fact.

- [high] One-sample t-test is degenerate: always t=0.000, p=1.0000, "not significant" (src/workers/prism.worker.js)
- [high] Numeric columns with ≤10 distinct values are typed CATEGORICAL - small datasets get zero statistics and zero charts (src/workers/prism.worker.js)
- [high] Fisher's exact test silently discards all but the alphabetically-first 2x2 block (src/workers/prism.worker.js)
- [high] Measured contrast fails the claimed 7:1 AAA threshold everywhere, and the primary button and default-theme controls fail even AA (src/styles/index.css)
- [high] Sonification has no unmount cleanup: switching tabs mid-playback leaves tones looping forever with no way to stop them (src/components/visualization/SmartChart/SmartChart.tsx)
- [high] Every <select> in the link builder and the chart-title input have no accessible name (orphan <label> with no htmlFor) (src/components/core/DatasetManager/DatasetManager.tsx)
- [high] Upload path blocks the main thread twice on a full file read, then a third time on synchronous XLSX parsing - with a 500 MB cap (src/security/validator.ts)
- [high] The whole dataset is held in memory 4-5 times simultaneously; linked-dataset merge JSON.stringifies every dataset's content into one string (src/stores/prismStore.ts)
- [high] The 564 kB vendor-charts chunk actually contains React; the vendor-react chunk is a 37-byte stub, and SheetJS sits eagerly in the 488 kB entry chunk (vite.config.ts)
- [high] addDataset throws raw Errors into an unguarded dropzone callback: file upload dies silently and the drop zone locks permanently (src/stores/prismStore.ts)
- [high] CustomAnalysisResult is a fictional type: the worker sends a different shape, and three `any` states hide the mismatch (src/types/index.ts)
- [high] The analytics engine exists twice: 657 LOC of prism_core.py is dead, the live engine is a ~1080-line Python string inside a .js file (src/python/prism_core.py)
- [high] Two independent Recharts renderers; the workspace bypasses the accessible one, dropping sonification, the data table, and the colorblind palette (src/components/analytics/AnalyticsWorkspace/AnalyticsWorkspace.tsx)
- [high] The store cannot be imported under a test runner: window.matchMedia runs at module scope and the Worker is a hardcoded module-level singleton (src/stores/prismStore.ts)
- [high] Content-security regex rejects ordinary business data with an unactionable, unoverridable error (src/security/validator.ts)
- [high] Multi-sheet Excel workbooks silently lose every sheet but the first (src/stores/prismStore.ts)
- [high] Work is unrecoverable by design - no persistence, no navigation guard, no error boundary - and the Pyodide cold start makes every loss expensive (src/stores/prismStore.ts)
- [high] "No bytes ever leave your machine" is contradicted by a mandatory third-party CDN call that is undisclosed and unhandled (src/workers/prism.worker.js)
- [medium] sanitizeToPlainText un-escapes HTML that DOMPurify had just escaped - a 'sanitizer' that hands back live markup (src/security/sanitizer.ts)
- [medium] MAX_FILE_SIZE is 500 MB while its own doc comment says 50 MB, and the whole file is read into a JS string on the main thread (src/security/validator.ts)
- [medium] validateContentSecurity rejects ordinary business data outright, with no override, on patterns that carry no real risk here (src/security/validator.ts)
- [medium] "Two-way ANOVA" runs two independent one-way ANOVAs and reports min(p1, p2) uncorrected (src/workers/prism.worker.js)
- [medium] addDataset parses CSV headers by naive split(',') - join-key dropdowns show phantom columns (src/stores/prismStore.ts)
- [medium] Single shared Worker with reassigned onmessage - cross-dropped messages leave promises permanently pending (src/stores/prismStore.ts)
- [medium] Focus is dropped to <body> when analysis completes, and completion is announced to no one (src/App.tsx)
- [medium] The only configuration that actually reaches 7:1 - high-contrast mode - has no UI control, and the reducedMotion setting is read by nothing (src/App.tsx)
- [medium] Results-view tabs declare role="tab" with no aria-controls and no tabpanel anywhere, and neither tablist supports arrow keys (src/App.tsx)
- [medium] compute_statistics evaluates every aggregate twice, and nunique/isna are recomputed three times per column (src/workers/prism.worker.js)
- [medium] Correlation heatmap does an O(V^4) linear scan on every render with no memoisation (src/components/analytics/AnalyticsWorkspace/AnalyticsWorkspace.tsx)
- [medium] App subscribes to the entire store with no selector, so every worker progress tick re-renders all charts; no component in src is memoised (src/App.tsx)
- [medium] AnalyticsWorkspace is a god component in which ~570 lines are data tables or inert markup, and ~220 lines of UI have no handlers at all (src/components/analytics/AnalyticsWorkspace/AnalyticsWorkspace.tsx)
- [medium] App subscribes to the entire store with no selector and nothing is memoized, so the whole tree re-renders on every worker progress tick (src/App.tsx)
- [medium] The documented 657-line analytics engine is dead code that has already diverged from the engine that actually runs (src/python/prism_core.py)
- [medium] Advertised 500 MB limit contradicts its own comment and guarantees a tab crash - the file is copied four times before analysis (src/security/validator.ts)
