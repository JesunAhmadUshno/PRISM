# 03. Architecture: a Jarvis with zero egress, and what the pivot does to the code

Author role: Architect. Status: proposal for founding-team review.
Repository read in full on 2026-09-13: every file under `src/`, `tests/`, `.github/`, `index.html`, `vite.config.ts`, `package.json`, `requirements-dev.txt`.

House rules observed: no em dashes, no invented numbers (every figure is measured, cited, or marked ASSUMPTION), every bold idea carries a NOW / NEXT / RESEARCH tag, and this file is the only thing edited.

---

## 0. The two answers, in one screen

**Question 1. How does a conversational Jarvis run with zero egress?**

It runs as a deterministic detective first and a language model never-as-a-source-of-truth second.

- **Layer 0, the Interrogator (NOW).** Detectors written in pandas/numpy produce structured `Finding` objects with row-level evidence. A deterministic conversation engine turns those into English through templates, proposes the next questions the data can actually answer, and runs them on request. Everything it says is traceable to a computed field. This is v1 and it works on every browser PRISM already supports, with no model download.
- **Layer 1, the Narrator (NEXT).** An optional small language model running in the browser over WebGPU (WebLLM or transformers.js), gated behind a "number firewall": it may reword, summarise for an audience, and route a free-text question to an engine query, but it can never emit a number the engine did not compute. If it tries, its output is discarded and the template answer is shown. It is off by default and the product must be complete without it.
- **Layer 2, a bigger local model (RESEARCH).** A desktop wrapper or a localhost runtime (Ollama-class) for enterprises whose IT is willing to run one. Same firewall. Not in scope for the first two releases.

**Question 2. What does the pivot do to the codebase?**

About 40 percent of the source survives untouched, and it is the 40 percent that took the most engineering: the worker host, the integrity-pinned Pyodide loader, the blob-worker CSP inheritance, the validator and sanitizer, the vendored SheetJS, the CI gates, and the known-answer test discipline. The engine's parsing, type inference and statistics primitives survive as a library. The 17-test menu, the chart builder tabs, the mocked ML tab, the four-way analytics taxonomy, and the general N-way dataset linker are deleted as user-facing surfaces. The engine moves out of a JavaScript template literal into real `.py` files that pytest imports directly. Findings cross the Python/JS boundary as a versioned JSON schema of evidence, never as prose.

Sizing, in the founder's requested vocabulary:

| Work | Size |
| :--- | :--- |
| Extract the Python engine to real files and delete `extract_engine.py`'s template-literal parser | a weekend |
| Finding schema, TS types generated from it, pytest validation of every detector's output | a weekend |
| First five numpy-only detectors with row evidence | two weeks |
| Interrogator (templates, follow-up grammar, state machine) and the Case File UI replacing `App.tsx` + `AnalyticsWorkspace.tsx` | four to six weeks |
| Two-file reconciliation (summary vs detail, period vs period) with fan-out guard | three weeks |
| Vendoring Pyodide same-origin so `connect-src` becomes `'self'` alone | one week, mostly CI and Pages plumbing |
| Local narrator behind the number firewall, Chrome-first | a quarter, and it is optional |

---

## 1. What exists, with evidence

Everything in this section was verified by reading the file named. Line numbers refer to the current tree.

### 1.1 The security layer is real and is worth more than the product built on it

- `index.html` carries a meta CSP with `default-src 'none'`, `connect-src 'self' https://cdn.jsdelivr.net/pyodide/`, `form-action 'none'`, `frame-src 'none'`. `src/test/security/csp.test.ts` asserts `connect-src` equals exactly `['self', 'https://cdn.jsdelivr.net/pyodide/']`, so adding an origin fails CI. That test is the product's promise expressed as code.
- `src/stores/prismStore.ts:205-224` constructs the worker from a `blob:` URL built from `prism.worker.js?raw` so that it inherits the document's policy container. The comment explains why: a worker fetched from an `https:` URL takes its CSP from response headers, and GitHub Pages sends none.
- `src/workers/prism.worker.js:1416-1489`: `fetchVerified` fetches `pyodide.js`, `pyodide.asm.js` and the runtime assets with browser-enforced SHA-384 `integrity`, `runVerifiedScript` executes them through a blob `importScripts`, and `installPyodideFetchGuard` wraps `self.fetch` so any request under `PYODIDE_BASE` without a pinned digest or a lock-file digest is rejected. Package wheels are pinned transitively through `pyodide-lock.json`'s SHA-256 entries.
- `src/security/validator.ts` (390 lines) and `sanitizer.ts` (284 lines) with five test files under `src/test/security/`.
- `src/lib/sheetjs-loader.ts`: SheetJS 0.20.3 vendored in `public/vendor/`, loaded on demand with a locally computed SRI hash, after the frozen npm `xlsx@0.18.5` (two unfixable advisories) was removed. `npm audit --audit-level=high` is a hard gate in `.github/workflows/ci.yml`.

**An honest correction to "zero bytes leave the machine".** What is verified today is zero *data* egress: no user-derived byte can leave, because no origin is reachable except a fixed CDN path, and the guard refuses unpinned paths. But the runtime itself is still fetched from `cdn.jsdelivr.net` at startup, and `index.html` has a `preconnect` to it. `LEDGER.md` item 2 already recommends vendoring Pyodide same-origin; section 3.7 below makes it part of this pivot, because a trust product should be able to say "'self' is the only origin in the policy" and mean it literally.

### 1.2 Measured runtime payload (not the "~25 MB" in the store comment)

Downloaded once each from `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/` on 2026-09-13 and measured by received bytes:

| Artifact | Bytes | MiB |
| :--- | ---: | ---: |
| pyodide.asm.wasm | 9,002,149 | 8.6 |
| pyodide.asm.js | 1,130,465 | 1.1 |
| python_stdlib.zip | 2,323,181 | 2.2 |
| numpy-1.26.4 wheel | 12,547,221 | 12.0 |
| pandas-1.5.3 wheel | 21,545,128 | 20.5 |
| scipy-1.11.2 wheel | 42,661,491 | 40.7 |
| openblas-0.3.23.zip (scipy dependency) | 5,920,280 | 5.6 |

So the path the worker takes today at startup (core + numpy + pandas, `prism.worker.js:1535`) is about **44.4 MiB**, and the first statistical test adds another **46.3 MiB** for SciPy plus OpenBLAS (`prism.worker.js:1739`). The `prismStore.ts:231` comment saying "~25 MB" is wrong by nearly a factor of two. This matters for section 3.4: detectors that need SciPy cost the user a second 46 MiB download, so the first wave of detectors should be numpy-only.

**A version-skew finding.** Pyodide 0.25.1's lock file pins `pandas 1.5.3`, `numpy 1.26.4`, `scipy 1.11.2` (Python 3.11.3, read from the lock file's `info` block). `requirements-dev.txt` pins `pandas 2.3.3`, `numpy 2.4.2`, `scipy 1.17.1`. The known-answer suite therefore proves the engine's numbers on a different pandas major version than the one the browser runs. The published reference values are version independent, but any behavioural difference between pandas 1.5 and 2.3 (for example `read_csv` inference or `groupby` defaults) is invisible to CI. Resolution is in section 3.4.

### 1.3 The engine, and why it is unreachable

- The live engine is a **1,300-line Python string** inside a JavaScript template literal (`prism.worker.js:44` to roughly `:1347`). `src/python/prism_core.py` is a 687-line older draft that nothing imports; its own docstring says so and records that the two have diverged (22 function definitions vs 12).
- `tests/python/extract_engine.py` (a 300-line harness) carves the Python back out of the template literal by re-implementing JavaScript escape decoding, then `exec`s it. `tests/python/test_statistics.py` has 40 known-answer tests against Student (1908), Fisher's tea table, closed-form chi-square, and hand-derived values. `.github/workflows/stats.yml` runs them. This is excellent discipline built on top of an indefensible layout, and the team already knows it: the harness's own error text says "Do NOT skip the statistics suite to get green".
- The "AI insights" (`generate_insights`, `prism.worker.js:310-352`) are exactly what the brief describes: one data-quality row-count summary with `confidence: 1.0`, plus a `np.polyfit` straight line on the first two numeric columns with `confidence: 0.8` hardcoded.
- `merge_datasets` (`:468-558`) contains this fallback at the point where schemas differ: `# Different schemas - just use first dataset`. The user asked to merge two files and silently receives an analysis of one. That is precisely the category of misleading result this product is being pivoted to catch. It goes.

### 1.4 The UI

- `App.tsx` (661 lines): a landing page, two mode tabs (single file / multi dataset), a results area with summary/insight cards, three recommended charts, a statistics table, then `<AnalyticsWorkspace />`.
- `AnalyticsWorkspace.tsx` (1,697 lines): six tabs. `statistics` renders the 17-test menu grouped by category. `analytics` renders four paragraphs of taxonomy (descriptive/diagnostic/predictive/prescriptive) with technique name lists such as "5 Whys Method" and "Neural Networks" that the engine does not implement. `models` renders seven ML model cards whose "Configure Model" button (`:1616-1618`) has no handler and a five-step "Model Building Workflow" with emoji. `CustomAnalysisConfig.type` includes `'ml_model'` (`types/index.ts`) but `run_custom_analysis` has no branch for it.
- `DatasetManager.tsx` (505 lines) with a `LinkBuilder` for arbitrary N-way joins on user-chosen keys.
- `SmartChart.tsx` (601 lines) on Recharts (the 441 kB `vendor-charts` chunk noted in `ci.yml`), `InsightCard.tsx` (121 lines).

The engineering quality is uniformly high. The product surface is a statistician's toolbox with a fake ML wing attached.

---

## 2. Question 1: a conversational Jarvis with zero egress

### 2.1 Define egress precisely, or the constraint cannot be enforced

For this document, **egress** means any byte derived from user data reaching a network origin other than the page's own. Under that definition:

1. Downloading a fixed, content-addressed artifact (a wasm binary, a wheel, a model weight shard) from an allowlisted origin is not egress. It is inbound code.
2. But every allowlisted origin is a *channel*. A URL query string can carry data. A crafted filename can carry data. So the rule the codebase already follows must become explicit doctrine: an allowlisted origin may be contacted only at a fixed path whose digest is pinned, and the fetch guard rejects everything else. `installPyodideFetchGuard` does exactly this for Pyodide. Anything the narrator layer adds must pass the same test, or better, add no origin at all.
3. `localhost` is a network origin. A model served by a separate process on the same machine (Ollama, LM Studio) is reachable only by adding `http://localhost:PORT` to `connect-src`, which `csp.test.ts` would correctly fail. It is not cloud egress, but it is data leaving the browser's sandbox into a process the user did not audit. It belongs in Layer 2 behind an explicit, per-session opt-in, never on by default.

The consequence that shapes everything below: **the deterministic engine must be the whole product, and any model must be an accessory that can be removed without loss of truth.** The constraint is not an obstacle; it is what forces the honest design.

### 2.2 Layer 0: the deterministic Interrogator. Tag: NOW

Jarvis says "Sir, you should see this." A deterministic system can do this better than a model can, because "this" is a computed finding with rows attached, and the sentence is a function of the finding.

**What it is.** Four pieces, all in Python inside the existing worker, all pytest-testable:

1. **Detectors** (`src/python/prism/detectors/*.py`). Each is a pure function `DataFrame -> list[Finding]`. Examples that need only numpy and pandas, so they ship in the 44 MiB base and not the 91 MiB SciPy tier: duplicated rows and near-duplicates; subtotals that do not reconcile with their parts; period gaps and duplicated periods in a date column; values that exceed a column's own historical spread (median absolute deviation, not the std-dev rule that outliers themselves distort); Benford first-digit deviation on amount columns where it is applicable (the detector must check applicability, which is a known result and a common misuse); ratio drift (a margin column that no longer equals revenue minus cost); category relabelling between rows or files; hardcoded-looking values (identical figures repeated where variation is expected); rounding clusters. The detector catalogue proper belongs to the detection document, not this one; the architectural point is that a detector is a function with a fixed output schema, and that schema is the contract for everything downstream.
2. **The Case File** (`evidence.py`). Findings are ranked by a fixed rubric (severity class, magnitude, how many rows, whether it touches a column that looks like money or a key), and the top items open the conversation. Every finding carries the row indices that prove it, so the UI can say "here are the 14 rows" without asking a model whether they exist.
3. **The Interrogator** (`interrogator.py`). A state machine over the Case File. Its output is a `Turn`: a templated sentence set (title, what was observed, why it matters, what it could mean as a closed list of hypothesis keys) and a closed set of **grounded follow-ups**, each of which is a concrete engine query the user can run with one click: "Show me the 14 rows", "Compare with the other months", "Does this repeat in the other file?", "Which department do they belong to?". Follow-ups are generated from the finding type and the schema, so they are always answerable.
4. **A free-text intake that is honest about its limits.** Users will type. Layer 0 handles typed questions with a closed intent set matched by keyword and column-name matching (a question containing a column name and one of "total", "sum", "by", "trend", "compare", "duplicates", "missing" maps to an engine query). When it cannot map a question, it says so and shows the list of questions it can answer about these columns. That admission is a feature: the user learns what the tool is, and the product never fakes comprehension.

**Why the deterministic version is the strong version, not the fallback.** The founder's audit background is the argument. An audit working paper does not say "I feel this looks off". It says "sample of 25 items, 3 exceptions, listed at Appendix B". A banking or hospital client who is handed a finding wants to know it will be the same finding tomorrow, produced the same way, on the same data. Templated language from computed fields is reproducible, testable in pytest, translatable, and auditable line by line. A model's paraphrase is none of those. Layer 0 is the product; Layer 1 is polish.

**Where it is weaker, honestly.** Templated prose is repetitive across findings, cannot adapt register (board member vs analyst) without a template per register, and cannot answer a question outside its intent set. Those three gaps are exactly the jobs Layer 1 is allowed to do.

**Feasibility.** NOW. Everything is pandas and numpy in a Web Worker, which is the current stack. The Interrogator is pure Python with no dependencies.

### 2.3 Layer 1: a local language model in the browser. Tag: NEXT

Real facts first, then a judgment.

**WebGPU availability (the hardware gate).** Per web.dev's announcement of 2025-11-25 (https://web.dev/blog/webgpu-supported-major-browsers): Chrome and Edge ship WebGPU on Windows (Direct3D 12), macOS and ChromeOS, with Android since Chrome 121 on Android 12 or later; Firefox ships it on Windows since 141 and on macOS Tahoe 26 ARM64 machines since 145, with Linux, Android and Intel Macs "in progress"; Safari 26 ships it on macOS Tahoe 26, iOS 26, iPadOS 26 and visionOS 26. The gpuweb implementation status page (https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) is the primary tracker. Practical reading for this product: a finance director on a corporate Windows laptop with Chrome or Edge is covered; a macOS user is covered only if on Tahoe 26 or later (Safari) or an Apple Silicon Mac (Firefox), or on Chrome; Linux desktops and older macOS are not. Layer 1 must feature-detect `navigator.gpu` and degrade to Layer 0 silently.

**Model sizes (the download gate).** Read directly from WebLLM's prebuilt model registry (https://raw.githubusercontent.com/mlc-ai/web-llm/main/src/config.ts), field `vram_required_MB`, which is the GPU memory the engine reports needing including KV cache at a 4096 context:

| Model (WebLLM id, q4f16_1 unless noted) | VRAM required (MB) | low_resource flag |
| :--- | ---: | :---: |
| SmolLM2-135M-Instruct-q0f16 | 359.69 | true |
| SmolLM2-360M-Instruct | 376.06 | true |
| Llama-3.2-1B-Instruct | 879.04 | true |
| Qwen2.5-0.5B-Instruct | 944.62 | true |
| Qwen3-0.6B | 1403.34 | true |
| Qwen2.5-1.5B-Instruct | 1629.75 | true |
| SmolLM2-1.7B-Instruct | 1774.19 | true |
| gemma-2-2b-it | 1895.30 | false |
| Qwen3-1.7B | 2036.66 | true |
| Llama-3.2-3B-Instruct | 2263.69 | true |
| Qwen2.5-3B-Instruct | 2504.76 | true |
| Phi-3.5-mini-instruct (and Phi-3-mini-4k) | 3672.07 | false |
| Phi-3.5-mini-instruct, 1k context variant | 2520.07 | true |

ASSUMPTION on download size: the registry publishes VRAM need, not shard bytes. A 4-bit weight file for a 1.5B-parameter model is on the order of 1 GB (parameters times roughly half a byte plus embeddings and metadata); the VRAM figure above is larger because it includes activations and cache. Treat "about 1 GB on the wire for a 1.5B model, about 2 GB for Phi-3.5-mini" as the planning number until measured from the actual shards.

**Where weights come from.** The same registry sets the model base to `https://huggingface.co/mlc-ai/` and the compiled kernel libraries to `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/`. Using WebLLM as shipped therefore means adding two new origins to `connect-src`. `csp.test.ts` will fail, and it should. See "the origin problem" below.

**Speed.** The WebLLM paper (arXiv 2412.15803, https://arxiv.org/abs/2412.15803, first submitted 2024-12-20, revised 2026-04-13) claims the engine "can retain up to 80% native performance on the same device" relative to MLC-LLM. Secondary write-ups report decode throughput in the range of 20 to 60 tokens per second on consumer hardware for small models (for example https://tinyweights.dev/posts/run-llm-in-browser-webllm/); treat the range as indicative, not measured by us. For this product's use (rewording a finding of 60 to 120 words) that is a two- to six-second response after a one-time model load, which is acceptable for an optional narrator and unacceptable as the primary path.

**Quality at reasoning about tabular findings.** Published benchmark figures for the candidate sizes: Qwen2.5-1.5B scores 60.9 on MMLU per the Qwen team's release post (https://qwenlm.github.io/blog/qwen2.5-llm/); the SmolLM2 paper (https://arxiv.org/pdf/2502.02737) places SmolLM2-1.7B near Qwen2.5-1.5B, ahead on MMLU-Pro and behind on GSM8K; a secondary comparison (https://www.generalcompute.com/blog/small-models-showdown-qwen-2-5-3b-llama-3-2-3b-phi-3-5-mini-gemma-2-2b) reports Gemma-2-2B at 24.3 on GSM8K and Phi-3.5-mini at 86.2. GSM8K is grade-school arithmetic word problems. A model that gets a quarter to three quarters of grade-school arithmetic wrong, running in a product whose entire promise is that the numbers are right, must never be allowed to produce a number. That is not a caveat; it is the design.

**Storage for caching weights.** MDN's quota page (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) and web.dev (https://web.dev/articles/storage-for-the-web): Chromium allows an origin up to about 60 percent of disk; Firefox best-effort storage is 10 percent of disk with an eTLD+1 group cap of 2 GB; Safari allows around 1 GB before prompting the user, then raises in 200 MB steps. A 1.6 GB model is within Chrome's quota, at the edge of Firefox's group cap, and past Safari's first prompt. This is the second reason Layer 1 is Chrome/Edge-first.

**Two alternatives that are not WebLLM.**

- *transformers.js v3* (https://huggingface.co/blog/transformersjs-v3, shipped October 2024) runs ONNX models on WebGPU via ONNX Runtime Web and caches in IndexedDB. Same origin problem (weights from huggingface.co), broadly similar model range, arguably simpler integration for small encoder models, which matters for section 2.4's intent classifier. Candidate, not decided.
- *Chrome's built-in Prompt API (Gemini Nano)* (https://developer.chrome.com/docs/ai/prompt-api). Available in stable Chrome from 138; requires Windows 10/11, macOS 13+, Linux or ChromeOS; "at least 22 GB of free space"; a GPU with "strictly more than 4 GB of VRAM" or a CPU path with 16 GB RAM and 4 cores; not on Android or iOS. The model is downloaded and updated by Chrome itself, so it adds nothing to our CSP and nothing to our bundle. Two disqualifying properties for a trust product: it is Chrome-only, and the model changes underneath us without notice, so a narration that passed review last month may read differently today. Usable as one adapter behind the same firewall; never the default. Tag: RESEARCH.

**The origin problem, and the original answer to it.** WebLLM as shipped wants `huggingface.co` and `raw.githubusercontent.com` in `connect-src`. There are three ways to avoid that, in order of preference:

1. **Bring your own model (NEXT).** The user (or their IT department) drops a model folder onto the page, or picks it with the File System Access API where available, and the weights are read as local files, exactly as the spreadsheet is. Zero new origins, zero download from us, works offline, and an enterprise can pre-approve one specific model build and distribute it internally. The weights are cached in the origin's storage after the first pick. This is the only option that lets the CSP remain exactly what `csp.test.ts` asserts today. It also fits the user: the same person who will not upload board financials is the person whose IT department would rather hand them an approved file than let a browser fetch 1 GB from a model hub.
2. **Same-origin vendoring (NEXT, after 3.7).** If Pyodide is vendored same-origin, a small model can follow. GitHub Pages limits apply (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): a published site should be no larger than 1 GB and individual files are capped at 100 MB by the repository limits, so shards must be split and the smallest useful model (SmolLM2-360M or Qwen2.5-0.5B class) is the realistic ceiling on Pages. A different host removes the ceiling but that is a deployment decision, not an architecture one.
3. **A pinned CDN path (acceptable but last).** Add exactly one fixed path under an origin already trusted, with per-shard SHA-384 digests in the same style as `PYODIDE_INTEGRITY`, guarded by the same fetch wrapper. It works, but it is a second CDN dependency for a product that should be moving to zero.

**Feasibility.** NEXT. WebLLM and transformers.js are production libraries; the engineering is in the firewall (2.4), the local-file loading path, and the graceful degradation, not in inference. A quarter for a careful first release, Chrome/Edge on Windows first.

### 2.4 The hybrid boundary: the number firewall. Tag: NEXT (design NOW)

The model may never touch a number the engine did not compute. Here is the mechanism, not the slogan.

**Input side: the model sees tokens, not numbers.**

The Interrogator produces a `Turn` whose numeric fields are already rendered as strings by the engine (with units, rounding and thousands separators decided in Python, where they are tested). Before anything reaches the model, every such string is replaced by an opaque token, and a lookup table is kept on the JavaScript side:

```
Finding (engine):   "Row total 1,248,300.00 differs from stated total 1,262,300.00 by 14,000.00 (1.1 percent)"
Model prompt:       "Row total {{n1}} differs from stated total {{n2}} by {{n3}} ({{n4}} percent)"
Table (JS only):    n1 = "1,248,300.00", n2 = "1,262,300.00", n3 = "14,000.00", n4 = "1.1"
```

The model is asked to reword for an audience, to summarise several turns, or to explain a hypothesis key in plainer words. It is not given the raw rows by default: the rows stay in the worker, and the model gets aggregates, which also keeps prompts inside a 4k context window.

**Output side: validation before display.**

The post-processor applies three checks to the model's text and rejects the whole output on any failure, falling back to the Layer 0 template:

1. Every `{{nK}}` token that appears must exist in the table. Unknown tokens: reject.
2. Any digit sequence in the output that is not inside a known token is a number the model produced itself: reject. (Ordinal words like "second" and column names containing digits are whitelisted from the schema.)
3. Every column name mentioned must exist in the dataset schema, and every finding id mentioned must exist in the Case File: reject otherwise.

Only after all three pass are the tokens substituted back with the engine's strings. The user never sees a model-generated figure, because one cannot survive the substitution step.

**Routing free text: the model proposes, the engine disposes.**

For typed questions that Layer 0's keyword intake cannot map, the model is used as a classifier, not an oracle. It receives the schema (column names and types), the closed list of engine queries with their parameter types, and the question; it must return a JSON object naming one query and its parameters. The JavaScript side validates that the query exists and that every parameter is a real column of an allowed type, then sends it to the worker. The engine runs it and the result is displayed through the normal Finding path. If the model returns anything else, the user sees Layer 0's "here is what I can answer" list. Nothing the model says is displayed; only what the engine computed in response.

**Fields the model cannot alter.** `severity`, `confidence`, `row_indices`, `detector`, `detector_version`, `reproduce` (the Python that recomputes the finding) are engine-owned and rendered by the UI directly from the Finding, never from model text.

**Labelling.** Every sentence on screen is marked as one of two provenances: *Computed* (engine template) or *Worded by the local model* (Layer 1 narration that passed the firewall). Toggling the narrator off removes the second class and the page still makes sense. This is the product's answer to overclaiming: it never asks the user to trust the model, only to read what it computed.

**Regression discipline.** A golden test set of Findings with their Layer 0 turns. For each, the narrated output must pass the firewall and, after substitution, contain the identical set of numbers and column references. Any model upgrade that fails a golden case does not ship. This is testable in vitest against recorded model outputs and against a live model in a manual pre-release run.

**Why this is the right boundary and not a weaker one.** A "system prompt asking the model to be careful" is not a boundary. A "confidence score from the model" is not a boundary. A boundary is a mechanism where the failure mode of the model is *invisible to the user* because the wrong output cannot render. The number firewall has that property. It also has a cost: the model cannot do arithmetic for the user even when it would be right, and cannot mention a figure the engine did not surface. That is a cost the product should pay proudly.

### 2.5 Recommendation

| Layer | What | Tag | Ships in |
| :--- | :--- | :---: | :--- |
| 0 | Detectors, Case File, Interrogator with templates and grounded follow-ups, keyword intake | NOW | v1, mandatory, all supported browsers |
| 1 | Local narrator via WebGPU, bring-your-own-model first, number firewall, provenance labels, off by default | NEXT | v2, Chrome/Edge on Windows first, then Safari 26 and Firefox on supported platforms |
| 1b | Chrome Prompt API adapter behind the same firewall | RESEARCH | only if a customer asks and accepts Chrome-only |
| 2 | Localhost runtime or desktop wrapper for larger models, explicit per-session opt-in, CSP change gated by a test that names the opt-in | RESEARCH | not before v3 |

The deterministic system is not the fallback for when the model is unavailable. The model is an accessory for when the deterministic system is already right.

---

## 3. Question 2: what the pivot does to the codebase

### 3.1 Keep, untouched or nearly so

| Component | File(s) | Why it stays |
| :--- | :--- | :--- |
| Worker host layer | `prism.worker.js:1353-1560` (message plumbing, `fetchVerified`, `runVerifiedScript`, `installPyodideFetchGuard`, `initializePyodide`) | This is the security boundary and it is correct. Only the message vocabulary changes. |
| Blob-worker construction | `prismStore.ts:205-224` | CSP inheritance depends on it; `csp.test.ts` pins the coupling. |
| CSP and its tests | `index.html`, `src/test/security/csp.test.ts` | The product's promise as executable assertions. Tightened in 3.7, never loosened. |
| Validator and sanitizer | `src/security/*`, `src/test/security/*` | File and content validation is the same job for a detector product. |
| SheetJS loader and vendored build | `src/lib/sheetjs-loader.ts`, `public/vendor/` | Excel ingestion with same-origin, integrity-checked parsing. |
| Engine primitives | `parse_csv`, `_json_safe`, `_finite_or_none`, `_infer_column_type`, `compute_statistics`, the 17 test implementations, `run_preprocessing` | They become the library the detectors call. The 17 tests stop being a menu and become functions a detector may invoke (for example `levene` inside a "variance changed between periods" detector). |
| Known-answer tests | `tests/python/test_statistics.py` (40 tests) | Kept and expanded; only the import changes (see 3.4). |
| CI | `.github/workflows/ci.yml`, `stats.yml`, `deploy.yml` | The gates are right. `stats.yml` loses its extraction step. |
| Accessibility harness | `vitest.a11y.config.ts`, `src/test/setup.ts`, axe tests | New components get the same treatment. |
| Design tokens | `docs/design/ui/tokens.css`, `tailwind.config.js` | The Refraction language survives; the components under it do not. |

### 3.2 Delete

| Component | Lines | Reason |
| :--- | ---: | :--- |
| `AnalyticsWorkspace.tsx` | 1,697 | All six tabs. The `statistics` tab is the 17-test menu that the founder could not use. The `analytics` tab is a taxonomy with unimplemented technique names. The `models` tab is a mock: seven cards, a dead "Configure Model" button, an emoji workflow. The `preprocess` and `visualize` tabs are a toolbox with no question behind it. |
| `DatasetManager.tsx` and `LinkBuilder` | 505 | General N-way joins on user-chosen keys, with a silent "use first dataset" fallback in the engine. Replaced by two named reconciliation shapes (3.6). |
| `merge_datasets` | ~90 | The silent fallback and the sequential unchecked joins. Replaced by `reconcile.py` with a fan-out guard. |
| `src/python/prism_core.py` | 687 | Dead draft. Its path is reused for the real engine package. |
| `tests/python/extract_engine.py` | ~300 | Its only job is parsing a template literal that will no longer exist. `to_csv` and the call helpers move to a small `tests/python/helpers.py`. |
| `generate_insights`, `recommend_visualizations` | ~80 | Row count with confidence 1.0 and a straight-line fit. Replaced by detectors. |
| `'ml_model'` in `CustomAnalysisConfig`, `ML_MODELS`, `ANALYTICS_METHODS`, `modelMetrics` | | Types for features that do not exist. |
| `preconnect` to jsDelivr in `index.html` | 1 | Goes with 3.7. |

Recharts and `SmartChart.tsx` are a judgment call. A chart in the new product is *evidence attached to a finding* (a bar of stated total against computed total; a line of a ratio with the drifted segment highlighted), not something the user builds. Keep Recharts for v1 to avoid a rewrite in the critical path, but reduce `SmartChart` to a fixed set of evidence chart types driven by the Finding's `chart_spec`, and revisit the 441 kB dependency once the finding types are stable. The sonification and hidden data-table fallbacks in `SmartChart` are worth keeping; they are rare and real accessibility work.

### 3.3 Rewrite

| Component | From | To |
| :--- | :--- | :--- |
| `App.tsx` | Landing + mode tabs + results + workspace | The Case File: a single column of Finding cards in rubric order, one open at a time, with the Interrogator's turn and grounded follow-ups beneath the open card. The founder's complaint "the output is cramped" is answered by showing one finding at full width with its evidence, not twelve panels. |
| `InsightCard.tsx` | Title, description, confidence badge | `FindingCard`: claim, evidence drawer (rows on demand from the worker), "what this could mean" hypothesis list, "reproduce" disclosure showing the Python that recomputed it, provenance labels. |
| `prismStore.ts` | File + results + custom analysis | Case state machine: `datasets`, `findings`, `open_finding`, `turns`, `pending_query`. Same worker lifecycle code. |
| `types/index.ts` | Hand-written | Generated from `schema/finding.schema.json` (3.5). |
| Worker message vocabulary | `PROCESS_FILE`, `PROCESS_LINKED_DATASETS`, `CUSTOM_ANALYSIS` | `LOAD_DATASET`, `RUN_DETECTORS`, `GET_ROWS(finding_id, offset, limit)`, `RUN_QUERY(query_id, params)`, `RECONCILE(shape, params)`. Rows are pulled by the UI on demand; the main thread never holds the whole table for display purposes. |

### 3.4 Where the engine lives: real `.py` files, imported by pytest, loaded by the worker

**Target layout**

```
src/python/prism/
  __init__.py
  io.py             parse_csv, type inference, _json_safe (moved, unchanged)
  profile.py        compute_statistics and schema description
  stats.py          the 17 test implementations as plain functions
  detectors/
    __init__.py     registry: DETECTORS = [...] with name, version, requires_scipy
    duplicates.py
    reconcile_totals.py
    period_gaps.py
    spread.py
    benford.py
    ...
  evidence.py       Finding dataclass, rubric, serialisation with schema validation
  interrogator.py   Turn, templates, follow-up grammar, keyword intake
  reconcile.py      two-file shapes (3.6)
schema/
  finding.schema.json
  turn.schema.json
```

**How it reaches the browser without a template literal.** Vite already imports the worker source with `?raw`. The same mechanism imports every `.py` file as a string at build time (`import.meta.glob('../python/prism/**/*.py', { query: '?raw', eager: true })`), and the worker writes them into Pyodide's in-memory filesystem (`pyodide.FS.writeFile`) under `/prism/` then `import prism`. Nothing is fetched at runtime that is not fetched today; the Python is inside the built JavaScript bundle exactly as now, just not authored inside it. Pyodide 0.25 supports this without extra packages.

**What pytest gains.** `import prism` with `sys.path` pointing at `src/python`. Every detector is a function taking a DataFrame; every one gets a known-answer test on a fixture where the planted defect is known (a total that is off by a known amount, a duplicated invoice, a gap of exactly one month). `extract_engine.py`'s escape-decoding parser is deleted, and `stats.yml`'s "verify the engine can still be extracted" step becomes "verify every detector's output validates against `finding.schema.json`".

**A guard so it never regresses.** A vitest assertion that `prism.worker.js` contains no line starting with `def ` or `import pandas`. Cheap and permanent.

**Fixing the version skew from 1.2.** Two options, choose one in the first week: (a) pin `requirements-dev.txt` to the versions in Pyodide 0.25.1's lock (`pandas==1.5.3`, `numpy==1.26.4`, `scipy==1.11.2`) so CI proves what the browser runs; or (b) upgrade Pyodide to a release whose lock matches modern pandas 2.x, re-pin the SHA-384 digests in `PYODIDE_INTEGRITY`, and re-run the 40 known-answer tests. Option (b) is the better end state (pandas 1.5 is out of support) but costs a Pyodide upgrade with its own digest work; option (a) is an afternoon. Do (a) immediately and schedule (b).

**SciPy is a second tier, by design.** The first wave of detectors uses numpy and pandas only, so a user sees findings after the 44 MiB base load, not after 91 MiB. Detectors with `requires_scipy = True` are registered but run only after `loadPackage(['scipy'])` completes in the background, and the Case File shows "3 more checks running" while it does. The registry field makes this a one-line property per detector, and a pytest asserts that no detector without the flag imports scipy.

Size: the move itself is a weekend. The detector wave is weeks, covered in 3.8.

### 3.5 Findings flow as structured evidence, never prose

**The schema.** One JSON Schema file, `schema/finding.schema.json`, is the source of truth. TypeScript types are generated from it (`json-schema-to-typescript` at build) and Python validates against it in tests (`jsonschema` in `requirements-dev.txt`). The shape, abbreviated:

```json
{
  "id": "f_7c2a",
  "detector": "reconcile_totals",
  "detector_version": "1.0.0",
  "severity": "high",
  "confidence": "rule",
  "title_key": "totals.mismatch",
  "slots": { "column": "Amount", "stated": "1,262,300.00", "computed": "1,248,300.00", "diff": "14,000.00", "pct": "1.1" },
  "evidence": {
    "row_indices": [4, 17, 88, 203],
    "row_count": 4,
    "columns": ["Amount", "Department"],
    "aggregates": { "stated_total": 1262300.0, "computed_total": 1248300.0 },
    "chart_spec": { "kind": "stated_vs_computed", "series": ["stated_total", "computed_total"] }
  },
  "hypotheses": ["totals.manual_override", "totals.hidden_rows", "totals.stale_formula"],
  "follow_ups": [
    { "query": "show_rows", "params": { "finding_id": "f_7c2a" } },
    { "query": "group_diff", "params": { "column": "Amount", "by": "Department" } }
  ],
  "reproduce": "df['Amount'].sum() vs df.loc[df['Row'] == 'Total', 'Amount'].iloc[0]"
}
```

Three deliberate choices in that shape:

- `confidence` is an enum (`rule`, `statistical`, `heuristic`), not a float. The current engine's `1.0` and `0.8` are exactly the kind of decoration that invites the user to trust a number nobody computed. A rule either fired or did not; a statistical detector carries its p-value or effect size in `aggregates` where it can be read for what it is; a heuristic says so.
- Numbers appear twice: as engine-formatted strings in `slots` (what the user sees, and what the firewall tokenises) and as raw values in `aggregates` (for charts and tests). Formatting lives in Python where it is tested once.
- `row_indices`, not rows. The UI requests rows through `GET_ROWS` when the evidence drawer opens. The worker is the only place the whole table lives, which is already the security stance, and it keeps a finding on a million-row file to a few hundred bytes.

**The Turn** (`turn.schema.json`) is the Interrogator's output: `finding_id`, `sentences` (each with `provenance: "computed"` and a `template_key`), `follow_ups` (the same grounded queries), and `can_answer` (the list shown when intake fails). Layer 1 narration adds sentences with `provenance: "model"` and never modifies the computed ones.

**The wire.** Python returns `json.dumps(_json_safe(finding_list), allow_nan=False)` exactly as today; the worker forwards it under `RUN_DETECTORS_RESULT`; the store validates it against the generated type guard before it enters state. Invalid payloads are an error the user sees ("a detector returned malformed evidence and was skipped"), never a silent drop, in keeping with the `parseAnalysisJson` philosophy already in the worker.

### 3.6 The multi-file question: what joining buys, and what it costs

**What it enables.** In audit terms, reconciliation is the move. One file can be internally inconsistent; two files can *disagree*, and disagreement between sources is where steering happens. Concretely, with two files the engine can detect:

- **Summary vs detail.** The board deck's totals against the ledger export. Totals that do not reconcile, categories present in one and absent in the other, a department that exists in the detail but was folded into "Other" in the summary.
- **Period vs period.** Same report, last month and this month. Rows that vanished, rows that appeared, categories silently relabelled, a metric whose definition changed (the ratio that used to equal A over B and now equals A over C).
- **Source vs source.** CRM revenue against finance revenue by customer. Orphan keys (customers in one system only), duplicated keys, magnitude disagreements per key.
- **Master vs transactions.** Cost centre list against expense lines: charges to cost centres that do not exist, or that were closed.

Each of those is a detector over a *named relationship*, and each produces the same Finding shape with row indices into both files.

**What it costs.**

1. *Key inference is unreliable and wrong joins are confident nonsense.* If the user picks the wrong key, or a key that is not unique on one side, `pd.merge` fans rows out and every downstream total is silently inflated. The current `LinkBuilder` lets a user join anything to anything. The fix is architectural: the engine checks key uniqueness on each side before joining and reports the cardinality (one-to-one, one-to-many, many-to-many); a many-to-many join is itself a *Finding* ("joining on Customer multiplies 1,204 rows to 9,880; this key is not unique on either side"), not a merged table.
2. *Memory and serialisation.* `merge_datasets` today round-trips the merged frame through a CSV string (`merged_csv`) back to the JavaScript side and then back into Python. With the worker holding all frames, reconciliation should never leave Python; only Findings cross.
3. *UI surface.* A general join builder is a data-engineering tool, and this user is not a data engineer. Two named shapes with a guided key confirmation ("these two columns have the same 312 distinct values, is this how the files connect?") is what a decision maker can operate.
4. *Detection complexity grows with file count.* N files means N choose 2 relationships. v1 caps at two files. "One or more" in the founder's words is honoured as one or two.

**Recommendation.** Delete general linking. Ship `reconcile.py` with exactly two shapes in v1: *same shape, different period* (schema alignment, then diff detectors) and *summary plus detail* (key confirmation with cardinality check, then total reconciliation and orphan detectors). Source-vs-source is the summary/detail machinery with a different template set and arrives in the second wave. Tag: NOW for the engine (pandas does all of it), three weeks including the guided key confirmation UI.

### 3.7 Egress hardening to ship with the pivot: `'self'` becomes the only origin. Tag: NOW

`LEDGER.md` item 2 already argues for vendoring Pyodide. The measured sizes in 1.2 make it concrete: 44.4 MiB for the base tier and 90.7 MiB with SciPy, largest single file 40.7 MiB, all under GitHub Pages' per-file limit and far under its 1 GB site limit (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). The `pyodide` npm package ships byte-identical files (the worker comment at `prism.worker.js:18-21` says so and the digests were verified against both), so `deploy.yml` copies them into `dist/pyodide/`, `PYODIDE_BASE` becomes `${BASE_URL}pyodide/`, the digests stay, `connect-src` becomes `'self'`, `script-src` drops the CDN entry, the `preconnect` goes, and `csp.test.ts`'s expectation tightens to `["'self'"]`.

After this, the sentence "the only origin in the policy is the page itself" is literally true, the app works offline after first load, and the trust argument to a bank's security team becomes one line. A week, most of it Pages plumbing and cache headers.

### 3.8 Sizing, all of it

| Item | Depends on | Size | Tag |
| :--- | :--- | :--- | :---: |
| Move Python to `src/python/prism/`, load via `?raw` glob + `FS.writeFile`, delete `extract_engine.py`, add no-Python-in-worker guard | nothing | weekend | NOW |
| Pin `requirements-dev.txt` to Pyodide 0.25.1's versions | nothing | afternoon | NOW |
| `finding.schema.json` + `turn.schema.json`, TS generation, pytest validation | move | weekend | NOW |
| Detector registry with `requires_scipy`, first five numpy-only detectors with planted-defect fixtures | schema | two weeks | NOW |
| Interrogator: templates, hypothesis keys, follow-up grammar, keyword intake, `can_answer` | schema | two weeks | NOW |
| Case File UI: `App.tsx` rewrite, `FindingCard`, evidence drawer with `GET_ROWS`, provenance labels, a11y tests | schema, interrogator | three to four weeks | NOW |
| Delete `AnalyticsWorkspace`, `DatasetManager`, mocks, dead types | Case File UI | two days | NOW |
| Vendor Pyodide same-origin, tighten CSP to `'self'` | nothing | one week | NOW |
| `reconcile.py` two shapes + cardinality guard + guided key confirmation | detectors, Case File | three weeks | NOW |
| SciPy-tier detectors (distribution shift, variance change, association between categories) reusing `stats.py` | registry | two weeks | NOW |
| Upgrade Pyodide to a pandas 2.x lock, re-pin digests, re-run known-answer suite | vendoring | one week | NEXT |
| Number firewall (tokeniser, validator, golden tests), narrator adapter interface | interrogator | three weeks | NEXT |
| Bring-your-own-model loading (drop folder / File System Access), WebGPU detection, WebLLM or transformers.js adapter, Chrome/Edge first | firewall | six to eight weeks | NEXT |
| Free-text routing via model-as-classifier with parameter validation | narrator | two weeks | NEXT |
| Chrome Prompt API adapter | firewall | two weeks, if ever | RESEARCH |
| Localhost runtime tier with per-session opt-in and its own CSP test | firewall | unknown, needs a customer | RESEARCH |

Critical path to a demo the founder can run without explanation: move, schema, five detectors, interrogator, Case File. Roughly eight to ten weeks of one focused engineer, with the reconciliation shapes making it a quarter. ASSUMPTION: one engineer at full time; the estimates are the architect's judgment from the line counts and coupling read above, not measured velocity.

---

## 4. Risks and open questions

1. **Detector false positives are the product's failure mode, not model hallucination.** A deterministic detector that fires on legitimate data (a real month-end adjustment flagged as a manual override) erodes trust exactly as a wrong model would. Mitigation is in the schema: `confidence: "heuristic"` is rendered differently from `"rule"`, hypotheses are offered as a list rather than a verdict, and every finding shows its rows so the user can dismiss it in ten seconds. The detection document should set a target on the planted-defect fixtures for precision, and it must be measured, not asserted.
2. **Excel is where the lies live, and CSV loses them.** Today SheetJS converts the first sheet to CSV before Python sees it (`load_csv` docstring: "Excel files are pre-converted to CSV in JavaScript"). Formulas, hidden rows, hidden sheets, hardcoded values overwriting formulas, and cell comments are all lost in that conversion, and every one of them is an audit signal. Whether SheetJS's cell-level output (formula strings, hidden flags) should be passed to Python alongside the values is a decision for the detection document, but architecturally it means `LOAD_DATASET` carries an optional `workbook_meta` object and the schema gains `evidence.cells`. Tag: NEXT, and probably the single most valuable detector input after the two-file shapes.
3. **Pyodide's own supply chain remains a trust dependency** even when vendored: the digests pin what we ship, not what upstream compiled. This is the same posture every Python shop has and it should be stated plainly in the security notes rather than hidden behind "zero egress".
4. **Firefox and Safari storage quotas may make Layer 1 impractical outside Chromium** for any model above about 1 GB. The bring-your-own-model path partly sidesteps this (the file can be re-picked rather than cached) but the user experience differs by browser. Accept it and say so.
5. **Who writes the templates.** The Interrogator's voice is the product's voice. Templates should be authored against `docs/business/brand/VOICE.md` and reviewed like copy, not like code, and they must obey the same rule this document does: no claim that cannot be traced to a field.
6. **The `web/` marketing site and README** currently promise "AI Insights: Automated trend, outlier, and correlation detection". They should describe what ships, in the vocabulary of findings and evidence, the day the Case File replaces the workspace. Out of scope for this file, flagged for whoever owns positioning.

---

## 5. Sources

Measured in-session (2026-09-13): artifact byte counts from `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`; Pyodide lock file `info` block and package versions from `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide-lock.json`; all code facts from the repository at `C:/Users/Jesun/PRISM`.

- WebGPU browser support announcement, web.dev, 2025-11-25: https://web.dev/blog/webgpu-supported-major-browsers
- WebGPU implementation status (gpuweb wiki): https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
- WebLLM prebuilt model registry (model ids, `vram_required_MB`, `low_resource_required`, model and library base URLs): https://raw.githubusercontent.com/mlc-ai/web-llm/main/src/config.ts
- WebLLM paper, arXiv 2412.15803 ("retain up to 80% native performance"): https://arxiv.org/abs/2412.15803
- Indicative WebLLM throughput write-up (secondary): https://tinyweights.dev/posts/run-llm-in-browser-webllm/
- transformers.js v3 with WebGPU: https://huggingface.co/blog/transformersjs-v3
- Chrome Prompt API hardware requirements and availability: https://developer.chrome.com/docs/ai/prompt-api
- Qwen2.5 release post (Qwen2.5-1.5B MMLU 60.9): https://qwenlm.github.io/blog/qwen2.5-llm/
- SmolLM2 paper: https://arxiv.org/pdf/2502.02737
- Small-model comparison including Gemma-2-2B GSM8K 24.3 and Phi-3.5-mini GSM8K 86.2 (secondary): https://www.generalcompute.com/blog/small-models-showdown-qwen-2-5-3b-llama-3-2-3b-phi-3-5-mini-gemma-2-2b
- Browser storage quotas and eviction (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Storage for the web (web.dev): https://web.dev/articles/storage-for-the-web
- GitHub Pages usage limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
