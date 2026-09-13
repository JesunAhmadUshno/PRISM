# PRISM Architecture Decision Records

**Owner:** CTO
**Date:** 2026-09-13
**Purpose:** Record the load-bearing choices already made in `src/`, with what each one costs.

These ADRs are written retrospectively. The decisions were made in code before they were written
down, so "Context" here reconstructs the reasoning that the code implies. Where I am inferring
intent rather than reading it, I say so.

Every ADR carries a **Cost** section. An ADR without one is marketing. The costs in this document
are the reason certain features will never ship, and they should be read before anyone promises a
customer something the architecture cannot do.

---

## ADR-0001: All computation happens in the browser, with no backend

**Status:** Accepted, and effectively irreversible
**Evidence:** `grep -rn "fetch(|XMLHttpRequest|WebSocket|sendBeacon" src/` returns zero matches.
`index.html` sets `default-src 'none'` and `form-action 'none'`. `.github/workflows/deploy.yml`
publishes `./dist` to GitHub Pages, a static host.

### Context

PRISM's intended users open files they cannot upload anywhere: a competitor's financials, patient
records, an unreleased earnings sheet. For that user the question is never "is your cloud secure",
it is "did my file leave this room". Every cloud analytics product answers that question with a
policy document. An architecture with no network path answers it with a fact.

### Decision

No server component of any kind. No API, no auth service, no object storage, no telemetry endpoint.
The browser tab is the entire runtime. The only outbound request in the product is
`importScripts` fetching the Pyodide distribution from a CDN, which carries code in and no data out.

### Consequences

Positive, and they are large:

- The privacy claim is structural. It is checkable by a third party in an afternoon with DevTools
  and `grep`, which means it survives contact with a procurement security reviewer.
- There is no production infrastructure, so there is no infrastructure cost, no on-call rotation, no
  database to breach, and no data-residency conversation.
- The regulatory surface collapses. With no data processed on our systems, whole categories of
  obligation never attach.
- A customer can serve the built artifact from inside their own perimeter, air-gapped, and it works.

### Cost

This is the part that must be said out loud, because each of these is a deal we will lose.

- **No server-side scheduling.** Nothing can run when the user's tab is closed. No nightly refresh,
  no "email me the report on Monday", no alerting, no watched folder. Anything recurring requires a
  machine that is awake when the user is not, and we do not have one.
- **No dataset larger than browser memory.** There is no spilling to disk, no chunked server-side
  processing, no distributed compute. The ceiling is one tab's heap. `SCALING_LIMITS.md` covers
  where that lands.
- **No collaboration.** No shared workspaces, no comments, no multiplayer editing, no "send this
  dashboard to my team" that does not reduce to sending someone a file. Sharing state between two
  humans requires a third party to hold it, and we refuse to be that third party.
- **No telemetry, therefore no product analytics.** We cannot know which of the 17 statistical tests
  anyone uses, where users drop off, or what crashed. Every product decision is made without usage
  data. This is an ongoing, permanent tax on product judgement.
- **No server-side licence enforcement.** The app cannot check a subscription because it cannot make
  a request. Monetisation has to be offline activation or a self-hosted build.
- **No crash reporting.** When it breaks for a customer, we get whatever they can describe, and they
  cannot send us the data that triggered it.
- **Cross-device continuity is impossible.** Work started on a laptop does not exist on a phone.
- **The client is the attack surface and it is fully exposed.** All logic ships to the user. There is
  nothing proprietary that can be kept server-side, which matters if the algorithms ever become the
  moat.

### Reversal cost

Adding a backend later does not just cost engineering time, it costs the claim. The moment one
endpoint exists, every buyer's security review restarts from zero and the differentiator is gone.
Treat this as one-way.

---

## ADR-0002: Pyodide and Python for statistics, rather than a JavaScript statistics library

**Status:** Accepted
**Evidence:** `src/workers/prism.worker.js:15` pins
`https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`. `initializePyodide` loads `pandas` and `numpy` at
startup and `scipy` lazily on first statistical test (`prism.worker.js:1352`). The analytics engine
is `src/python/prism_core.py`, 657 lines, duplicated as an embedded template literal inside the
worker.

### Context

The product promises statistical analysis that a trained analyst will trust. The JavaScript
statistics ecosystem exists but is thin, unevenly maintained, and largely unvalidated against the
reference implementations analysts already believe. pandas, numpy, and scipy are the implementations
that textbooks and regulators are written against.

### Decision

Run CPython compiled to WebAssembly via Pyodide, inside a dedicated Web Worker, and implement the
analytics in Python against pandas, numpy, and scipy.

### Consequences

- The 17 statistical tests are computed by scipy, not by hand-rolled JavaScript. When a customer
  checks a p-value against R or SPSS, we are comparing implementations that agree by construction
  far more often than a bespoke JS implementation would.
- Credibility with a technical buyer. "It runs scipy" ends a conversation that "we implemented
  Welch's t-test in TypeScript" would start.
- The worker keeps heavy computation off the UI thread, so the interface stays responsive during
  analysis.
- Adding a statistical method is a Python change, which is the language the domain is written in.

### Cost

- **Cold start is severe and it is the first thing every new user experiences.** Before any
  analysis, the browser downloads the Pyodide runtime plus the pandas and numpy wheels, instantiates
  a WebAssembly CPython, and executes the analytics module. On a cold HTTP cache this is the
  dominant latency in the product, and it happens before the user sees a single number. The actual
  duration is unmeasured; see the measurement protocol in `SCALING_LIMITS.md`. Do not quote a figure
  until it is measured.
- **A hard external dependency on a CDN.** If `cdn.jsdelivr.net` is unreachable, blocked by a
  corporate proxy, or the pinned Pyodide version is withdrawn, PRISM does not degrade, it fails
  completely. For a product sold on working inside a locked-down perimeter, this is the sharpest
  irony in the architecture.
- **Payload size.** The Python runtime and scientific wheels dwarf the application bundle. Our 488 kB
  entry chunk is not the number that determines time to first result.
- **A double memory model.** Data lives in the JS heap and again in the WASM heap. Handing a CSV
  string to Python copies it. See ADR-0006 and `SCALING_LIMITS.md`.
- **wasm32 address space.** Pyodide 0.25.1 is a 32-bit WebAssembly build, so the Python heap is
  bounded by the 4 GiB wasm32 address space regardless of how much RAM the machine has. This is a
  property of the platform, not of our code, and no amount of optimisation moves it.
- **No SharedArrayBuffer on the current host.** GitHub Pages cannot set COOP and COEP headers, so
  the page is not cross-origin isolated, so WASM threading is unavailable. Pyodide runs
  single-threaded. That is a hosting consequence, addressable, and it is addressed in Month 3 of the
  strategy.
- **Two copies of the same Python source.** `src/python/prism_core.py` exists as a file, and a
  near-identical copy is embedded as a template literal inside `prism.worker.js`. Only the embedded
  copy actually executes. Two sources of truth for the statistical engine is a correctness hazard
  waiting to happen, and it is the kind of thing that produces a bug nobody can reproduce.
- **Debugging crosses three boundaries.** A failure can be in React, in the worker's JS, or in
  Python inside WASM. A Python traceback arrives as a string in a `postMessage` payload.

### Alternatives considered

A JavaScript statistics library would have removed the cold start and the CDN dependency entirely,
and cut payload by an order of magnitude. It was not chosen because the trust argument is the
product. That remains the right call, but the cold start is the price and it should be attacked
with prewarming and caching rather than pretended away.

---

## ADR-0003: Zustand for state, rather than Redux, Context, or a server cache library

**Status:** Accepted
**Evidence:** `src/stores/prismStore.ts`, 681 lines, a single `create<PrismState>` store holding
file state, processing progress, results, datasets, dataset links, accessibility preferences, and
the async actions that drive the worker.

### Context

With no backend there is no server cache to synchronise, which removes the main reason teams reach
for React Query or RTK Query. What remains is local UI state plus the lifecycle of an async worker,
for a single-maintainer codebase.

### Decision

Zustand, one store, actions colocated with state.

### Consequences

- Very little ceremony. No providers to wire, no action-type constants, no reducer indirection
  between an event and the state change it causes.
- Worker orchestration lives in the store next to the state it mutates, so the full
  validate, parse, post, receive, render path reads top to bottom in one file.
- The store can be read outside React, which matters for worker callbacks.
- Small bundle contribution. `vendor-utils` (zustand, dompurify, papaparse together) is 25,423
  bytes built.

### Cost

- **The store is a 681-line god object.** File state, processing state, results, multi-dataset
  management, dataset links, and accessibility settings are all one object with one update surface.
  It is already the hardest file in the codebase to change safely, and it is the file most in need
  of the tests that do not yet exist.
- **No enforced action discipline.** Any component can call `set` with a partial state. With no
  reducer boundary and no action log, a wrong state transition is found by reading, not by tooling.
- **No time-travel debugging or action history.** Redux DevTools would have made the async worker
  lifecycle observable. With no telemetry either (ADR-0001), reproducing a user's state is manual.
- **Module-level worker singleton.** `let worker: Worker | null` lives at module scope in the store
  file, outside the store. It is effectively a global. It also means `clearFile` calling
  `terminateWorker()` destroys the warm Pyodide runtime, so the next file pays the full cold start
  again. The cost of ADR-0002 is being paid repeatedly because of where this variable lives.
- **Testability.** Module-level singletons and a store this wide are harder to isolate in tests than
  the equivalent reducer would have been. The bill for that arrives with the test suite.

**Assessment:** correct choice for the stage, and the god-object problem is a refactor rather than a
rewrite. Split the store by domain (file, processing, results, datasets) once tests exist to catch
the split going wrong.

---

## ADR-0004: A classic Web Worker using importScripts, rather than an ES module worker

**Status:** Accepted, with a security implication that was probably not intended
**Evidence:** `src/stores/prismStore.ts:80` constructs the worker with `{ type: 'classic' }`, with
the comment "Use classic worker (not module) for importScripts compatibility".
`prism.worker.js:1128` calls `importScripts(\`${PYODIDE_CDN}pyodide.js\`)`. Note that
`vite.config.ts` sets `worker.format: 'es'`, which contradicts the call site.

### Context

Pyodide's loader is distributed in a form that `importScripts` handles cleanly. `importScripts` is
only available in classic workers, not module workers.

### Decision

Instantiate the analytics worker as a classic worker and pull Pyodide in with `importScripts`.

### Consequences

- Pyodide loads with its supported path and no bundler shimming.
- The worker is a plain `.js` file, so it is not type-checked. It is the file that contains all the
  data handling.

### Cost, including the part that matters most

- **The document CSP does not apply to this worker.** The CSP in `index.html` is a `<meta>` tag. A
  dedicated worker created from a same-origin script URL derives its own CSP from the HTTP response
  headers of that script, not from the parent document's meta policy. GitHub Pages sends no CSP
  response header. The worker therefore executes under no CSP at all.

  This is why `importScripts` to `cdn.jsdelivr.net` succeeds even though `connect-src` in the
  document policy would not obviously permit it.

  The zero-exfiltration property is still true, because the worker's source contains no network
  primitives and I verified that. But it is currently enforced by our code review rather than by the
  browser. We should describe it that way until the Month 3 hosting change puts a real CSP response
  header on the worker script. Anyone who reads the CSP in `index.html` and concludes the browser is
  stopping exfiltration from the worker has drawn a conclusion the deployment does not support.

- **`worker.format: 'es'` in `vite.config.ts` contradicts `{ type: 'classic' }` at the call site.**
  It builds today. It is a latent break on any Vite upgrade, and it is exactly the sort of
  contradiction that produces a production-only failure. Reconcile it.
- **No TypeScript in the file that handles all the data.** The worker is `.js`, the message protocol
  between store and worker is untyped on the worker side, and `src/types/index.ts` cannot help.
- **No SRI on the Pyodide import.** `importScripts` cannot carry an integrity attribute. The Pyodide
  URL is version-pinned, which is good, but pinning is not verification. Self-hosting the Pyodide
  distribution, as proposed in the strategy, is what actually closes this.

---

## ADR-0005: Recharts for visualisation

**Status:** Accepted, with a bundle cost that needs work
**Evidence:** `recharts` in dependencies, split as `vendor-charts` in `vite.config.ts`, built to
564,384 bytes at `dist/chunks/vendor-charts-CkhUdhnn.js`. Consumed by
`src/components/visualization/SmartChart/SmartChart.tsx` (601 lines).

### Context

Charts must render inside the tab with no external rendering service, since calling one would send
the data off the machine and end the product. The output should be accessible and inspectable.

### Decision

Recharts, a declarative React SVG charting library.

### Consequences

- SVG output, which means charts are DOM, which means they can carry ARIA attributes and be reached
  by assistive technology in a way a `<canvas>` chart cannot.
- SVG is also directly serialisable, which is what makes the Month 4 export path cheap to build:
  no headless renderer, no service.
- Declarative React composition fits the rest of the codebase.

### Cost

- **564,384 bytes, and it is currently eager.** That chunk is fetched by visitors who have not yet
  dropped a file. It is the largest single application asset and the most obviously fixable one.
- **SVG performance degrades with node count.** Every point is a DOM node. This is the real reason
  behind the hard caps in the chart data builders: scatter at 500 points, line previews at 100, bar
  charts at 15 categories, categorical breakdowns at 10. Those caps are a rendering constraint that
  has leaked into the analysis layer, and right now the user is not told that truncation happened.
- **Canvas or WebGL would scale further** but would have cost the accessibility story and the easy
  SVG export. For this product that trade is correct.

---

## ADR-0006: CSV strings as the boundary format between JavaScript and Python

**Status:** Accepted, and the most under-examined decision in the codebase
**Evidence:** `prismStore.ts` converts Excel with `XLSX.utils.sheet_to_csv(sheet)` and reads CSV and
XML with `file.text()`, then posts a string to the worker. The worker sets it as a Python global and
calls `analyze_csv(file_data, file_type)`. `merge_datasets` in `prism_core.py` joins DataFrames and
then returns `merged_df.to_csv(index=False)`, which is re-parsed downstream.

### Context

Something has to cross the JS-to-WASM boundary. A string is the simplest thing that works, and
pandas reads CSV well.

### Decision

Everything becomes a CSV string before Python sees it.

### Consequences

- Uniform input handling: one Python entry point for every supported format.
- Trivial to debug, since the boundary payload is human-readable.

### Cost

This decision quietly loses information, and the losses are invisible to the user.

- **Types are destroyed and re-guessed.** Excel knows a cell is a date, a currency, or a percentage.
  `sheet_to_csv` turns all of it into text, and `pd.read_csv` then infers types from the text. A
  column that Excel knew was a date can come back as a string, or worse, as the wrong date.
- **Only the first worksheet is read.** Both call sites take `workbook.SheetNames[0]`. A workbook
  with twelve monthly tabs analyses January and says nothing about the rest. This is the single most
  likely source of a silently wrong answer in the product today.
- **Formulas, formatting, merged cells, and multi-row headers are gone.** Whatever `sheet_to_csv`
  produces for a merged cell is what pandas sees.
- **Round-trip escaping risk.** Fields containing commas, quotes, or newlines survive only as well
  as the CSV escaping on both sides agrees.
- **Memory amplification.** The CSV string exists in the JS heap, is copied by structured clone into
  the worker, and is copied again into the WASM heap as a Python string before pandas allocates the
  DataFrame. `merge_datasets` makes this worse: it holds every source DataFrame, builds the merged
  one, and then serialises the whole merged result back to a CSV string, which is then parsed again.
  For a join of two large datasets, peak memory is several full copies of the data at once. See
  `SCALING_LIMITS.md`.
- **Transferable objects are left on the table.** A string cannot be transferred, only cloned. An
  `ArrayBuffer` could have moved across the boundary with zero copy.

**Recommendation:** this is the highest-value architectural revision available. Moving to
`ArrayBuffer` transfer, doing the Excel parse inside the worker, and preserving typed columns would
fix the correctness losses and one of the memory copies at the same time. The first-worksheet-only
behaviour should be surfaced in the UI immediately, ahead of any of that work, because it is a
correctness problem today.

---

## ADR-0007: Static hosting on GitHub Pages

**Status:** Accepted for now, and scheduled for replacement
**Evidence:** `.github/workflows/deploy.yml` uses `configure-pages`, `upload-pages-artifact` with
`path: ./dist`, and `deploy-pages`. `vite.config.ts` sets `base: '/PRISM/'`.

### Context

A product with no backend needs somewhere to serve static files. GitHub Pages is free, sits next to
the repository, and deploys from CI with no additional accounts.

### Decision

Build to `dist/` and publish to GitHub Pages from GitHub Actions.

### Consequences

- Zero hosting cost and zero hosting operations.
- Deployment is a push, and the artifact is exactly what CI built.
- HTTPS by default.

### Cost

- **No control over response headers.** This is not a minor inconvenience, it is the reason the
  worker runs without a CSP (ADR-0004). It also means `Cross-Origin-Opener-Policy` and
  `Cross-Origin-Embedder-Policy` cannot be set, so the page is not cross-origin isolated, so
  `SharedArrayBuffer` is unavailable, so Pyodide cannot use WASM threads. One hosting choice is
  costing us both the enforcement of our central claim and the concurrency of our compute engine.
- **A hardcoded base path.** `base: '/PRISM/'` is baked into the build, which complicates serving
  the same artifact from a customer's own domain or from a local file server.
- **The deployed origin is a github.io subdomain** unless a custom domain is configured, which is a
  weak signal to an enterprise buyer evaluating a security product.

**Decision to revisit:** yes, in Month 3. Any static host that supports a headers file resolves
this, and the migration is a CI change plus a headers file, not an architectural one.

---

## ADR-0008: Defence in depth on input, using magic bytes, pattern scanning, and DOMPurify

**Status:** Accepted
**Evidence:** `src/security/validator.ts` (375 lines) checks size, extension, MIME type, magic bytes
against a table of ZIP and XML signatures, and scans text content against a `DANGEROUS_PATTERNS`
list. `src/security/sanitizer.ts` (284 lines) configures DOMPurify with an explicit allowlist of
tags and attributes, and forbids all URI-bearing attributes.

### Context

Every byte PRISM processes is untrusted and arrives from the user's disk. Even with no server, a
malicious file can attack the tab it is opened in, and the tab is where the sensitive data lives.

### Decision

Validate before parsing, sanitise before rendering, and do not rely on a single control.

### Consequences

- Extension spoofing is caught by magic-byte checks rather than by trusting the filename.
- The DOMPurify configuration is an allowlist, not a denylist, and it explicitly forbids `href`,
  `src`, `action`, `formaction`, and `xlink:href`. Given `default-src 'none'` in the document
  policy, this is a coherent, layered posture.
- Accessibility attributes are deliberately preserved in the allowlist, so sanitisation does not
  quietly strip the ARIA the interface depends on.

### Cost

- **`DANGEROUS_PATTERNS` is a denylist, and denylists are the weakest control in the file.** It
  matches `<script`, `<iframe`, `javascript:`, event-handler attributes, and a few more. Encoding
  and obfuscation defeat pattern matching in general. This should be understood as a speed bump, and
  the allowlist sanitiser plus the CSP are the controls actually doing the work.
- **Scanning cost on large files.** Content security scanning runs over CSV and XML content before
  analysis, adding a pass over data that may already be near the memory ceiling.
- **Formula injection is not addressed.** A CSV cell beginning with `=`, `+`, `-`, or `@` is a
  spreadsheet-injection payload for whatever the user exports to next. It is not a threat to PRISM
  itself, which is why it was probably never considered, but it becomes one the moment the Month 4
  export path exists. Handle it as part of that work.
- **The size constant contradicts its own documentation.** `MAX_FILE_SIZE` is
  `500 * 1024 * 1024` with a doc comment immediately above stating 50MB. Nobody currently knows which
  was intended, and a security control that nobody can state the value of is not a control.
- **`ALLOW_DATA_ATTR: true`** sits inside a configuration that is otherwise strict. Probably
  deliberate, since the allowlist includes `data-testid`, `data-chart-index`, and
  `data-column-name`. Worth a comment saying so, since a reviewer will stop on it.
- **No tests.** Every claim in this ADR is an assertion about code with zero automated verification
  behind it. The security module is the first thing the test suite should cover.

---

## Cross-cutting: what this architecture can never do

Collected in one place so it can be handed to anyone writing a proposal.

| Cannot do | Root cause |
|---|---|
| Run analysis on a schedule or when the tab is closed | ADR-0001 |
| Handle a dataset larger than one tab's memory | ADR-0001, ADR-0002, ADR-0006 |
| Share a workspace, dashboard, or comment between two people | ADR-0001 |
| Report usage, errors, or crashes back to us | ADR-0001 |
| Enforce a subscription at runtime | ADR-0001 |
| Sync work across a user's devices | ADR-0001 |
| Work with no network on the very first load | ADR-0002 (Pyodide CDN) |
| Analyse more than the first worksheet of a workbook | ADR-0006 |
| Preserve Excel cell types, formulas, or formatting | ADR-0006 |
| Chart more points than SVG can hold | ADR-0005 |
| Use WASM threads on the current host | ADR-0002, ADR-0007 |

The first six are permanent while ADR-0001 stands, and ADR-0001 is the product. The last five are
engineering work with owners and months attached in `TECHNICAL_STRATEGY.md`.
