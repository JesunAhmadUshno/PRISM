# PRISM Scaling Limits

**Owner:** CTO
**Date:** 2026-09-13
**Purpose:** State where this architecture breaks, quantify what the code allows me to quantify, and
label everything else as unmeasured.

## How to read this document

Every figure is tagged:

- **MEASURED** means I read it out of the repository or the build output. It is a fact about the
  code as it stands on `army/prism-upgrade`.
- **PLATFORM** means it is a documented property of WebAssembly or the browser, not of our code.
- **ASSUMPTION** means it is my reasoning from the code, with the reasoning shown. It has not been
  benchmarked. Nobody may quote an ASSUMPTION figure to a customer.
- **UNMEASURED** means the code determines it, no benchmark exists, and Section 8 says how to get
  the number.

There are no benchmark results in this document because no benchmark has been run. Inventing one
would be worse than admitting that.

---

## 1. The pipeline, and where the copies are

This is the path a file takes today. It matters because the ceiling is set by peak simultaneous
memory, not by file size.

```
File on disk
  │
  ├─ [main thread] validateFile()            size, extension, MIME, magic bytes,
  │                                          then a regex content scan for CSV and XML
  │
  ├─ [main thread] Excel branch:  file.arrayBuffer()        → copy 1, binary
  │                               XLSX.read(buffer)         → copy 2, workbook object graph
  │                               XLSX.utils.sheet_to_csv() → copy 3, JS string (first sheet only)
  │
  ├─ [main thread] CSV/XML branch: file.text()              → copy 1, whole file as a JS string
  │
  ├─ postMessage(csvString)                  structured clone → copy 4, a second JS string
  │                                          (a string cannot be transferred, only cloned)
  │
  ├─ [worker] pyodide.globals.set()          → copy 5, Python str inside the WASM heap
  │
  ├─ [worker] pd.read_csv(StringIO(...))     → copy 6, the DataFrame
  │
  └─ [worker] results JSON → postMessage → main thread → React state
```

**MEASURED:** the Excel branch performs three materialisations on the main thread before the data
has even been sent to the worker (`src/stores/prismStore.ts`, `setFile` and `addDataset`).

**MEASURED:** the boundary payload is a string, so `postMessage` clones rather than transfers.

**ASSUMPTION:** at the moment `pd.read_csv` returns, an Excel file has roughly five live
representations of the same data spread across two heaps, and a CSV file roughly four. Reasoning:
nothing in the code releases the earlier representations before the later ones exist. The store
retains `file.content` in React state for the lifetime of the session, so copy 3 or copy 1 never
becomes garbage at all.

**ASSUMPTION:** the practical ceiling is therefore materially below what a naive "file size versus
available RAM" calculation suggests. I will not put a multiplier on it before Section 8 is run,
because the multiplier depends on the data's shape, not just its size. A file of many short strings
and a file of few long floats amplify very differently.

---

## 2. Hard ceilings

### 2.1 The validator's declared ceiling

**MEASURED:** `src/security/validator.ts`:

```
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
```

with a documentation block immediately above reading "Maximum file size: 50MB".

The constant and its documentation differ by a factor of ten. Both cannot be the intent. This is the
only size limit enforced anywhere in the product, so the product currently has no agreed maximum
input size. Until Section 8 has been run, treat the 500 MB value as a number nobody chose.

### 2.2 The WebAssembly address space

**PLATFORM:** Pyodide 0.25.1 (pinned at `src/workers/prism.worker.js:15`) is a wasm32 build. A
wasm32 module addresses memory with 32-bit pointers, so its linear memory cannot exceed 4 GiB no
matter how much RAM the machine has. Everything Python holds, the interpreter, pandas, numpy, scipy,
the CSV string, and the DataFrame, shares that one space.

This ceiling is not removable by optimisation. It moves only when Pyodide ships a memory64 build and
browsers support it broadly.

**PLATFORM:** browsers additionally impose their own per-tab and per-worker limits well below the
architectural 4 GiB, and these differ by browser, by platform, and by available system memory.

### 2.3 What happens at the ceiling

**ASSUMPTION, from reading the error handling:** there are three distinct failure modes and none of
them currently produces a good message.

1. **WASM allocation failure.** Python raises inside the worker, the worker posts an `ERROR` message,
   and the UI shows the message text. Recoverable, but the text is a Python memory error, which is
   not useful to an analyst.
2. **JS heap exhaustion on the main thread.** Happens during the Excel branch or `file.text()`,
   before the worker is involved. The tab becomes unresponsive or the renderer is killed by the
   browser. No catchable error, no message.
3. **Operating-system or browser process kill.** The tab reloads or shows a crash page. Because
   there is no persistence anywhere in `src/` (no `localStorage`, `sessionStorage`, or `indexedDB`;
   verified by grep), everything the user did is gone, including the warm Pyodide runtime.

Failure modes 2 and 3 are the common ones for large files, and they are exactly the two the product
cannot explain to the user. Section 5 of `TECHNICAL_STRATEGY.md` turns this into a pre-flight check.

---

## 3. Cold start

**MEASURED:** `initializePyodide()` in `src/workers/prism.worker.js` performs, in order:

1. `importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js')`
2. `loadPyodide()`, which fetches and instantiates the CPython WebAssembly binary and its standard
   library
3. `loadPackage(['pandas', 'numpy'])`
4. `runPythonAsync(PRISM_CORE_PYTHON)`, executing the embedded 657-line analytics module

**MEASURED:** `scipy` is deliberately not loaded at startup. It is loaded lazily at
`prism.worker.js:1352`, on the first statistical test. This is a good decision and it means there
are **two** cold starts, not one: the first analysis, and then the first hypothesis test.

**UNMEASURED:** the wall-clock duration of either. It is dominated by network transfer of the
Pyodide distribution and the wheels, so it varies with connection, CDN edge, and cache state. No
figure has been benchmarked and none should be quoted.

**MEASURED, and this is a defect:** `clearFile()` in `prismStore.ts` calls `terminateWorker()`,
which destroys the worker and with it the initialised Pyodide runtime. A user who clears one file
and loads another pays the entire cold start a second time, in the same session, with a warm HTTP
cache but a cold interpreter. The runtime state is thrown away for no reason other than where the
teardown call sits.

**Mitigations available, none implemented today:**

- keep the worker alive and reset Python state instead of terminating (cheapest, largest win)
- start Pyodide initialisation when the app loads rather than when the first file arrives, so the
  download overlaps the user choosing a file
- self-host the Pyodide distribution, which removes third-party latency and the CDN dependency at
  once
- a service worker to cache the distribution across sessions, which requires care to keep the
  zero-egress story intelligible

---

## 4. Row and column ceilings

### 4.1 Analysis

**UNMEASURED.** Row capacity is a function of column count, column types, and string cardinality,
not of row count alone. Section 8 measures it on representative shapes.

**MEASURED constraint that will bite before memory does:** `analyze_csv` computes a full correlation
matrix across numeric columns. That work is quadratic in the number of numeric columns. A dataset
with several hundred numeric columns will spend a long time there regardless of how few rows it has.

### 4.2 Charts, where the real ceiling is much lower than anyone expects

**MEASURED**, from the chart data builders in `src/workers/prism.worker.js`:

| Chart type | Cap | Line |
|---|---|---|
| Scatter plot | first 500 rows after `dropna` | 961 |
| Scatter, secondary builders | first 100 rows | 939, 973 |
| Line and preview series | first 100 values | 954, 988 |
| Bar chart, categorical aggregate | first 15 categories | 915, 927 |
| Categorical value counts | first 10 values | 904 |

**These are `head(n)`, not a sample.** They take the first n rows in file order, which is not a
random sample and is not representative of anything unless the file happens to be randomly ordered.

**MEASURED:** the user is not told. A scatter plot of a 200,000-row dataset renders 500 points, in
file order, with no annotation.

This is the most serious finding in this document, and it is not a scaling problem, it is a
correctness problem that scaling exposed. A chart that silently shows the first 0.25% of the data in
file order will eventually put a wrong conclusion in front of a paying analyst. Every truncated
visual must state its rule, and a genuine random sample is a better default than `head`.

### 4.3 Statistical tests

**MEASURED:** `shapiro_wilk` subsamples to 5,000 rows when the column is larger
(`prism.worker.js:484`). Subsampling for Shapiro-Wilk is statistically defensible. Doing it silently
is not: the reported p-value belongs to a 5,000-row sample and the user believes it belongs to their
dataset.

**MEASURED:** `independent_t` uses `df[group_col].dropna().unique()[:2]`. With three or more groups
it compares the first two encountered and reports the result as if that were the analysis requested.

**MEASURED:** `paired_t` truncates both columns to `min_len` and pairs them by position. A null in
either column shifts every subsequent pair.

**MEASURED:** `chi_square_ind` builds `pd.crosstab(df[col_a], df[col_b])`. Two high-cardinality
columns produce a contingency table whose size is the product of their cardinalities. Two columns
with ten thousand distinct values each is a hundred million cells, which will exhaust the WASM heap
long before the underlying data would have.

---

## 5. Multi-dataset joins

**MEASURED:** `merge_datasets` in `src/python/prism_core.py` (and its embedded twin in the worker)
does the following:

1. receives every dataset as a separate CSV string, all sent in one `postMessage`
   (`prismStore.ts`, `processLinkedDatasets`)
2. parses each into its own DataFrame, holding all of them simultaneously
3. `pd.merge`s them into a merged DataFrame, held alongside the sources
4. serialises the merged result with `merged_df.to_csv(index=False)`
5. returns that string, which is then parsed again downstream

**ASSUMPTION:** peak memory for a join is therefore the sum of all source DataFrames, plus the
merged DataFrame, plus a full CSV serialisation of the merged result, plus the original CSV strings
for every source, all live at the same moment. Reasoning: nothing in the function releases any
earlier stage, and the store retains every dataset's `content` for the session.

**Consequence:** joins hit the ceiling at a fraction of the per-dataset size limit. **ASSUMPTION:**
the usable per-dataset size when joining is meaningfully smaller than when analysing a single file.
No multiplier until Section 8.

**MEASURED:** a many-to-many join can also produce a merged row count far larger than either input,
which is a data property rather than an architectural one, but there is no guard against it and no
warning before it happens.

**Fixable without touching the architecture:** stop round-tripping the merged DataFrame through CSV.
It stays in Python; the CSV serialisation exists only because the downstream entry point takes a CSV
string. That is an interface decision (ADR-0006) and it is costing a full copy of the largest object
in the pipeline.

---

## 6. Mobile

**UNMEASURED, and currently unaddressed.**

**PLATFORM:** mobile browsers, iOS Safari in particular, enforce per-tab memory limits substantially
tighter than desktop, and a tab that exceeds them is killed by the operating system. The page
reloads. There is no JavaScript error, no `onerror`, and nothing for the application to catch or
report.

**MEASURED consequences specific to PRISM:**

- with no persistence in `src/`, a killed tab loses the dataset, the results, and the warm runtime
- the Pyodide cold start runs over a mobile connection, and the payload is the Python scientific
  stack, not a web bundle
- the built entry chunk is 488,502 bytes and the charts chunk 564,384 bytes, and neither is lazily
  loaded today
- SVG charts with hundreds of nodes are considerably more expensive on a mobile GPU
- `AnalyticsWorkspace.tsx` is 1,586 lines of dense tabbed layout; whether it is usable at phone
  width is untested

**Position to take:** any of "supported", "degraded, with a stated row limit", or "desktop only" is
defensible. Saying nothing is not. Right now a mobile user gets no warning and, at the ceiling, no
explanation. Decide in Month 5 of the strategy and put the answer in the UI.

---

## 7. What does not scale at all, by construction

These are not tuning problems. They follow from ADR-0001 and no amount of engineering moves them.

| Limit | Why |
|---|---|
| One dataset per tab, one tab per user | No shared state, no server |
| No dataset larger than one tab's memory | No spilling, no chunked server compute, no distributed execution |
| No scheduled or background analysis | Nothing runs when the tab is closed |
| No concurrent users on the same analysis | No shared state to be concurrent about |
| No incremental or streaming analysis over time | No storage between sessions (until the opt-in IndexedDB work in Month 4) |
| No horizontal scaling of compute | The only compute is the user's device |
| Single-threaded Python | No cross-origin isolation on the current host, so no `SharedArrayBuffer`, so no WASM threads (ADR-0002, ADR-0007) |

The correct response to a prospect whose data does not fit is that they are not our customer yet.
The wrong response is a backend.

---

## 8. Measurement protocol

Nothing in Sections 2, 3, 4.1, or 6 becomes a number we can say out loud until this has been run.
Run it before any customer-facing size claim, and re-run it each quarter, because browser memory
behaviour changes underneath us.

**Fixtures.** Generate deterministically, record the generator script alongside the results:

- *narrow and long*: 5 numeric columns, at 10k / 100k / 1M / 5M rows
- *wide and short*: 200 columns mixed numeric and categorical, at 1k / 10k / 100k rows
- *string heavy*: 20 columns of high-cardinality text, at 10k / 100k rows
- *Excel*: the same shapes as `.xlsx`, plus one multi-sheet workbook to confirm the
  first-sheet-only behaviour is visible in the output
- *join*: two datasets of 100k rows each with a shared key, at low and high key cardinality

**Environments.** Chrome, Firefox, and Safari on desktop; one mid-range Android device; one iPhone.
Record browser version, OS, and physical RAM for every run. Run each with a cold HTTP cache and
again warm.

**For each fixture and environment, record:**

- time to first byte of the Pyodide payload, and time to `isInitialized`
- additional time for the lazy `scipy` load on the first statistical test
- time from file drop to rendered result
- peak JS heap (Chrome DevTools Memory) and peak WASM heap (`WebAssembly.Memory.buffer.byteLength`)
- pass, degraded, or killed, and which of the three failure modes from Section 2.3 occurred
- for joins, the same figures, plus merged row count

**Publish:** a single table of the largest fixture that passes in each environment, and the failure
mode of the first fixture that does not. That table is what we quote. Nothing else.

---

## 9. Summary of every limit in this document

| # | Limit | Value | Tag |
|---|---|---|---|
| 1 | Validator maximum file size | 500 MB in code, 50 MB in the comment above it | MEASURED, contradictory |
| 2 | Python heap address space | 4 GiB, wasm32 | PLATFORM |
| 3 | Live copies of the data at peak, Excel path | about five, across two heaps | ASSUMPTION |
| 4 | Live copies of the data at peak, CSV path | about four | ASSUMPTION |
| 5 | Pyodide cold start | not benchmarked | UNMEASURED |
| 6 | Second cold start on first statistical test (scipy) | not benchmarked | UNMEASURED |
| 7 | Cold start repeats after `clearFile` | yes, worker is terminated | MEASURED, defect |
| 8 | Scatter plot points rendered | 500, taken as `head`, unlabelled | MEASURED |
| 9 | Line and preview series points | 100, taken as `head`, unlabelled | MEASURED |
| 10 | Bar chart categories | 15, unlabelled | MEASURED |
| 11 | Categorical value counts | 10, unlabelled | MEASURED |
| 12 | Shapiro-Wilk sample | 5,000 rows, unlabelled | MEASURED |
| 13 | Independent t-test groups | first two encountered, silently | MEASURED, defect |
| 14 | Paired t-test pairing | by row position, not by key | MEASURED, defect |
| 15 | Chi-square table size | product of both columns' cardinalities | MEASURED |
| 16 | Excel worksheets read | the first one only | MEASURED |
| 17 | Join peak memory | all sources plus merged plus a CSV of the merged result | MEASURED path, ASSUMPTION on size |
| 18 | Persistence across refresh | none | MEASURED |
| 19 | Mobile ceiling | not benchmarked, tab killed with no catchable error | UNMEASURED |
| 20 | Concurrent users, scheduling, distributed compute | zero, by construction | MEASURED |

Items 7, 8 through 14, and 16 are all fixable inside the current architecture. Items 13, 14, and 16
are the ones most likely to put a wrong number in front of a paying customer, and they should be
fixed before anything on this list is optimised for speed.
