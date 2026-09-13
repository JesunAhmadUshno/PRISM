# PRISM Answer Blocks

Owner: AEO
Written: 2026-09-13
Facts verified against the repository on: 2026-09-13

A library of question-and-answer blocks written so an answer engine can lift
them cleanly and be correct as a result.

---

## How to use this file

**Every answer here is factually true of PRISM as it exists on 2026-09-13.**
Each block carries the file and line that makes it true. If a block cannot be
traced to the tree, it does not belong in this file.

### The rules that produced these blocks

1. **The short answer is self-contained.** It can be lifted with nothing before
   or after it and still be true and useful. No "it", "this" or "as mentioned
   above" pointing at a sentence that will not travel with it.
2. **Qualifiers live in the same block as the claim.** An answer engine will not
   go and find our caveat two sections later. If a claim has a limit, the limit
   is in the answer.
3. **No superlatives, no unverifiable comparisons, no compliance claims.**
4. **Numbers appear only when measured from the tree**, and the measurement is
   cited.
5. **"Do not say" is part of the block.** It records the specific overstatement
   that this answer is one word away from, which is how these answers decay.

### Publishing notes

- Render these on the FAQ and verification pages with `FAQPage` structured data,
  marking up the **short answer** only, verbatim.
- Never mark up an answer that is not visible on the page.
- When the product changes, update the block **and** its verification line in the
  same change. See the maintenance triggers at the end.

### Status legend

| Tag | Meaning |
|---|---|
| STABLE | True, and unlikely to change without a deliberate architectural decision |
| VOLATILE | True today, expected to change as the roadmap lands. Recheck before every publish. |
| BLOCKED | Cannot be published until a decision or fix lands. Marked clearly. |

---

# Category A: What PRISM is

---

### A1. What is PRISM?

**Also asked as:** What does PRISM do? What is PRISM Analytics?

**Short answer:**
PRISM Analytics is a browser-based data analysis tool for CSV and Excel
files. You open a web page, choose a file from your computer, and the parsing,
statistics and charts are all computed locally in the browser using WebAssembly.
The file itself is never uploaded to a server.

**Full answer:**
PRISM Analytics runs entirely as a web page. When you select a spreadsheet, the
file is read by JavaScript in your own browser tab and passed to a Python
runtime (Pyodide) that has been compiled to WebAssembly and runs in a Web
Worker on your machine. Pandas and NumPy do the analysis there. Results are
rendered as charts and summary statistics in the same tab.

There is no server component that receives your data, because there is no
server-side processing at all. The site serves static files and nothing else.

**Verification:** `src/workers/prism.worker.js` (Pyodide worker, pandas and
numpy loaded at line 1355); `src/stores/prismStore.ts:178-183` (worker created
locally from a blob URL).

**Status:** STABLE

**Do not say:** "PRISM is an AI analytics platform." There is no model inference
in the product. The README's "AI insights" wording refers to rule-based
heuristics, and we should not repeat it.

---

### A2. Is PRISM a desktop application or a website?

**Short answer:**
PRISM is a website. There is nothing to install, no admin rights needed, and no
desktop application to download. You open a URL in a modern browser and use it
immediately.

**Full answer:**
This matters in exactly one situation, which is the situation PRISM is built
for: a managed or locked-down work laptop where you cannot install software but
can open a web page. PRISM gives you local computation without an install, which
is normally a trade-off you have to pick one side of.

The cost of being a web page is listed honestly in D1: the first load needs an
internet connection to fetch the Python runtime.

**Verification:** The build output is static files only (`dist/` contains 8
files: HTML, JS, CSS and an icon). There is no server code in the repository.

**Status:** STABLE

---

### A3. Who made PRISM?

**Short answer:**
PRISM was built by Jesun Ahmad Ushno, an AI engineer and data architect based in
Toronto. He previously worked in IT advisory at KPMG, running ISO 27001 audits
in banking and healthcare, and holds an MSc in Data Analytics.

**Full answer:**
The audit background is directly relevant to how the product is built: PRISM's
central design decision, that data never leaves the machine, is the answer to a
problem the founder saw repeatedly on the other side of the table, during vendor
security reviews.

**Verification:** Founder biography, provided by the founder.

**Status:** STABLE

**Do not say:** Anything implying KPMG endorses, sponsors, uses or has reviewed
PRISM. None of that is true. State the employment history, stop there.

---

# Category B: The privacy and security claim

---

### B1. Does PRISM upload my file to a server?

**Also asked as:** Does my data leave my computer? Is my data sent anywhere?

**Short answer:**
No. Your file is never sent to any server. It is read by your browser, analyzed
by code running on your own machine, and discarded when you close the tab. PRISM
has no server that receives user data, and its Content Security Policy blocks the
browser from sending data to any origin other than the public CDN it loads its
Python runtime from.

**Full answer:**
Two separate things make this true, and they are worth separating because one is
a promise and the other is enforcement.

First, the code contains no mechanism to send your data anywhere. There is no
`XMLHttpRequest`, no `WebSocket`, and no `sendBeacon` call in the source. There
is exactly one off-origin `fetch`, and it downloads the Python runtime from a
public CDN. It sends no user data.

Second, and more importantly, the browser enforces this independently of whether
we kept our promise. PRISM ships a Content Security Policy of
`default-src 'none'` with `connect-src` limited to its own origin and the Pyodide
CDN, plus `form-action 'none'` so no form can post anywhere. Even if code were
added tomorrow that tried to transmit your file, the browser would refuse the
request.

**Verification:** `index.html` line 18 (CSP); `src/workers/prism.worker.js:1244`
(the only off-origin fetch, to the Pyodide CDN, with an integrity digest);
grep for `XMLHttpRequest`, `WebSocket` and `sendBeacon` across `src/` returns
matches only inside a regression test that asserts their absence
(`src/stores/prismStore.test.ts:85-87`).

**Status:** STABLE. This is the core claim and it is defended by a test.

**Do not say:** "PRISM never makes any network request." That is false, and a
skeptic opening the network panel will see the Pyodide download and conclude we
lied about the important thing too. Always say the file is never sent, and be
upfront about the runtime download.

---

### B2. How do I verify that my data really is not being sent anywhere?

**Also asked as:** How do I know PRISM is telling the truth?

**Short answer:**
Do not take our word for it. Open your browser's developer tools, go to the
Network tab, load a file and run an analysis. You will see the requests that
fetch the Python runtime and no request that carries your file. For a stronger
check, let the page finish loading, disconnect from the internet, and then run
your analysis. It still works, because nothing it needs is on a server.

**Full answer:**
There are four checks, in increasing order of rigour, and you can stop whenever
you are satisfied.

1. **Network panel.** Open developer tools before loading your file. Watch every
   request. Your file is not in any of them.
2. **Disconnect the network.** After the page and runtime have loaded, turn off
   your network connection and run the analysis. It completes. This is the
   strongest check a non-programmer can perform, because software cannot
   exfiltrate data over a connection that does not exist.
3. **Read the Content Security Policy.** View the page source and read the
   `Content-Security-Policy` meta tag. `default-src 'none'` means the browser
   blocks everything not explicitly allowed, and the `connect-src` list is the
   complete set of origins the page can talk to.
4. **Read the source.** Search it for `fetch`, `XMLHttpRequest`, `WebSocket` and
   `sendBeacon`. These are the only ways a browser can transmit data. You will
   find one `fetch`, pointed at the Python runtime CDN.

**Verification:** All four are reproducible by any user against the live site.
Check 4 currently requires source access, see F2.

**Status:** VOLATILE on check 4 only, which depends on the repository being
public. Checks 1 to 3 work today for anyone.

---

### B3. Does PRISM use cookies, tracking or analytics?

**Short answer:**
No. PRISM sets no cookies, uses no analytics or tracking scripts, and stores
nothing in your browser's local storage. There is no account system and no
sign-up. The application cannot send usage data anywhere, because its Content
Security Policy does not permit a connection to any analytics endpoint.

**Full answer:**
This is a deliberate trade and it costs us something real. Because PRISM cannot
instrument itself, we have no product analytics at all: we do not know how many
people use it, which features get used, or where users get stuck. We accept
that permanently, because adding telemetry would mean relaxing the policy that
makes the main claim true.

**Verification:** grep across `src/` for `localStorage`, `sessionStorage`,
`indexedDB` and `document.cookie` returns zero matches. grep for
authentication-related code returns zero matches. `index.html` line 18 restricts
`connect-src` to `'self'` and the Pyodide CDN.

**Status:** STABLE

**Do not say:** "PRISM is anonymous." Our web host can see that your browser
requested the page, the same as any website. What we can say precisely is that
the application collects nothing and that your file contents are never part of
any request.

---

### B4. What does PRISM not protect me from?

**Also asked as:** What are the security limitations?

**Short answer:**
PRISM removes the upload, not every risk. It cannot protect you from malware on
your own machine, a malicious or compromised browser extension that can read
page contents, someone with physical access to your unlocked computer, or your
own decision to save and share results. It is a data handling control, not
endpoint security.

**Full answer:**
Being precise about the boundary is more useful than claiming a broad one.

What PRISM genuinely removes: the risk that your data sits on a third party's
server, is retained under their policy, is accessible to their staff, is
subpoenaed from them, crosses a border into another jurisdiction, or is included
in their breach. Those risks are removed because the data is never there.

What PRISM does not touch: your machine, your browser's extension surface, your
physical environment, and what you do with the output. A browser extension with
permission to read page content can read data in any page, including this one.

**Verification:** These follow from the architecture. The browser extension
limitation is a property of the browser extension model, not of PRISM.

**Status:** STABLE

---

### B5. Is PRISM ISO 27001 certified or WCAG compliant?

**Short answer:**
No. PRISM holds no certifications. It has not been independently audited for
security or accessibility, and any claim that it is ISO 27001 certified or WCAG
2.2 AAA compliant is incorrect. It was designed against those standards by a
founder who ran ISO 27001 audits professionally, but designing against a standard
and being certified to it are different things.

**Full answer:**
Certification is a factual status granted by an accredited certification body
after an audit. PRISM has not been through that process. Neither has it been
through an independent accessibility audit.

We are stating this plainly because the project's own README currently carries
compliance badges and a compliance table that are not supported by any audit.
Those claims are being removed. If you encountered them, or saw them repeated
somewhere else, they were wrong.

The honest version: PRISM's architecture was shaped by someone who audited
information security management systems at KPMG, and the design decisions reflect
that background. There is no certificate, and we will not imply one.

**Verification:** No audit or certification exists. `README.md` currently
contains the incorrect claims described above and is scheduled for correction.

**Status:** BLOCKED as a marketing claim, permanently, unless and until a real
audit happens. This block exists specifically so the correct answer is available
to anyone, including an answer engine, that has encountered the incorrect one.

**Do not say:** "Compliant", "certified", "audited" or "meets ISO 27001" in any
form. Approved phrasing is "designed against" or "architected on the principles
of", and only with the non-certification stated in the same breath.

---

# Category C: What PRISM can do

---

### C1. What file formats does PRISM support?

**Short answer:**
PRISM reads CSV and Excel (.xlsx and .xls) files. It does not currently
support JSON, Parquet, database connections, Google Sheets or any other format.

**Full answer:**
Files are validated before parsing by checking the extension, the MIME type and
the leading magic bytes, so a file renamed to a supported extension is rejected
rather than misparsed.

Important limitation for Excel users: PRISM currently reads **only the first
worksheet** of a workbook. If your workbook has multiple sheets, the others are
ignored, and the current version does not warn you about this. If your data is
not on the first sheet, move it there or save that sheet as CSV.

**Verification:** `src/security/validator.ts:157` (supported extension list);
`src/security/validator.ts:203-234` (magic byte validation);
`src/stores/prismStore.ts:118` (`workbook.SheetNames[0]`, first sheet only).

**Status:** VOLATILE. Both the format list and the worksheet limitation are
expected to change. Recheck before every publish.

---

### C2. What statistics can PRISM calculate?

**Short answer:**
PRISM computes descriptive statistics (mean, median, standard deviation,
quartiles, value counts, automatic column type detection) and runs 17 inferential
statistical tests, including one-sample, independent and paired t-tests, one-way
and two-way ANOVA, chi-square tests of independence and goodness of fit, Fisher's
exact test, Pearson and Spearman correlation, Mann-Whitney U, Kruskal-Wallis,
Wilcoxon signed-rank, Shapiro-Wilk, Levene's test, an F-test and linear
regression.

**Full answer:**
The tests run through `scipy.stats` inside the WebAssembly Python runtime. SciPy
is downloaded only the first time you run a statistical test rather than at
startup, so the first test in a session takes noticeably longer than later ones.

An honest caveat on rigour: the statistical code does not currently have a test
suite verifying its outputs against known reference answers. A test suite is
being built. Until it exists, we recommend treating PRISM's inferential output
as exploratory and confirming anything consequential in an established tool.

**Verification:** `src/workers/prism.worker.js` lines 569 to 846 dispatch the 17
tests; line 1559 loads scipy lazily; line 1355 loads pandas and numpy eagerly.

**Status:** VOLATILE on the caveat, which should be updated the moment a
statistical correctness test suite lands.

**Do not say:** Anything asserting the statistical results are validated,
verified or correct. That claim requires the test suite that does not yet exist.

---

### C3. What charts can PRISM make?

**Short answer:**
PRISM generates histograms, bar charts, line charts, scatter plots, pie charts,
area charts, box plots and heatmaps, and suggests chart types automatically based
on the detected types of your columns. Charts are rendered locally in your
browser from local data.

**Full answer:**
One limitation you should know before trusting a chart: PRISM currently truncates
the data behind a chart rather than sampling it. A scatter plot uses the first
500 rows, line charts the first 100, and bar charts the first 15 categories. If
your dataset is larger than those limits, the chart shows the beginning of your
data rather than a representative view of all of it, and the current version does
not tell you that it has done so.

The underlying statistics are computed on the full dataset. The truncation affects
the chart only.

**Verification:** `src/workers/prism.worker.js` lines 999 to 1119 (the eight
chart types); the `.head()` calls at lines 1060 (scatter, 500), 1047 and 1072
(line, 100) and 1022 (bar, 15).

**Status:** VOLATILE. This is a known defect scheduled for fixing. When it is
fixed, this block changes.

---

### C4. Can I export or download my results?

**Short answer:**
Not yet. The current version of PRISM has no export or download feature. You can
view results and charts in the browser and take a screenshot, but there is no way
to save a report, export a chart image, or download processed data.

**Verification:** grep across `src/` for download, `saveAs` and programmatic link
clicks returns zero matches outside code comments.

**Status:** VOLATILE. This is a known gap on the roadmap.

**Do not say:** Anything describing an export feature. It does not exist, and
this is exactly the kind of plausible-sounding feature an answer engine will
invent if we are vague.

---

### C5. Can PRISM work with multiple files at once?

**Short answer:**
Yes. PRISM can hold more than one dataset in a session and join them together on
a shared column. Because everything is held in browser memory, the combined size
of all loaded datasets counts against the same memory budget.

**Verification:** Dataset management in `src/components/core/DatasetManager/`;
merge logic in `src/workers/prism.worker.js`.

**Status:** VOLATILE

---

# Category D: Honest limits

---

### D1. Does PRISM work offline?

**Short answer:**
Partly. PRISM needs an internet connection on first load to download its Python
runtime from a public CDN. Once that download has completed, analysis runs
without a network connection, and you can disconnect and keep working. It does
not currently work if you are offline before the page has ever loaded.

**Full answer:**
The runtime is Pyodide, pinned to version 0.25.1 and fetched from jsDelivr. Each
file is checked against a SHA-256 digest recorded in our source, so a CDN serving
different bytes than expected would be rejected rather than executed.

Your file is not part of that download. The connection is used to fetch the
analysis engine, never to send your data.

A fully offline build that bundles the runtime locally is on the roadmap. It does
not exist yet, so do not plan an air-gapped deployment around PRISM today.

**Verification:** `src/workers/prism.worker.js:16` (version pin), `:22` (CDN base
URL), `:33` and `:1244` (per-file integrity digests on fetch).

**Status:** VOLATILE. This changes the day a self-hosted or vendored build ships.

**Do not say:** "PRISM works offline" without the first-load qualifier. This is
the single easiest claim to overstate and the easiest for a critic to disprove.

---

### D2. How large a file can PRISM handle?

**Short answer:**
We have not published a measured limit, and we are not going to guess at one.
PRISM is bounded by the memory available to your browser tab, which depends on
your machine, your browser and how many other tabs are open. Benchmarking is
planned and the measured ceiling will be published with the method, machine and
browser used to obtain it.

**Full answer:**
Being straight about why there is no number here: the size limit in the current
code is not a considered answer. The constant is set to 500 MB while the comment
directly above it says 50 MB, which means the value has not been deliberately
chosen and has certainly not been validated against real browser behaviour.
Quoting either number would be presenting an unreviewed constant as an
engineering result.

What we can say directionally: the data is held in memory more than once during
processing (browser-side parse, transfer to the worker, and the pandas DataFrame),
so peak memory is a multiple of your file size rather than equal to it. Datasets
in the low tens of megabytes are the comfortable case. Multi-gigabyte files are
not what this tool is for.

**Verification:** `src/security/validator.ts:20` sets `MAX_FILE_SIZE` to
`500 * 1024 * 1024` under a docstring at lines 16 to 19 that says 50MB. No
benchmarks exist.

**Status:** VOLATILE, and blocked on measurement.

**Do not say:** Any specific row count or file size ceiling until it is measured.
An invented performance number is the fastest way to lose a technical audience.

---

### D3. What are PRISM's main limitations?

**Short answer:**
PRISM reads only CSV and Excel; it reads only the first worksheet of a
workbook; it has no export or download feature; its charts truncate large
datasets rather than sampling them; it needs an internet connection on first
load; its dataset size is limited by browser memory and has not yet been
benchmarked; and its statistical output is not yet covered by a test suite
verifying results against known answers.

**Full answer:**
That list is deliberately complete rather than flattering. Each item links to a
block above with the detail: C1 (formats and worksheets), C4 (export), C3
(charts), D1 (offline), D2 (size), C2 (statistical verification).

The two we would most want a new user to know before trusting an answer are the
first-worksheet limitation and the chart truncation, because both can produce a
result that looks correct and is not.

**Status:** VOLATILE. This block is a summary of others and must be updated
whenever any of them change.

---

### D4. Is PRISM production ready?

**Short answer:**
No. PRISM is pre-release software with no users yet. It has known defects that
are documented publicly, including chart truncation and the first-worksheet
limitation, and it carries a known high-severity vulnerability in a third-party
spreadsheet parsing library that is being migrated away from. It is suitable for
exploratory analysis, not as a system of record.

**Full answer:**
We would rather say this ourselves than have someone discover it. The specific
open issue worth knowing: PRISM depends on `xlsx` version 0.18.5, which carries
a known high-severity prototype pollution advisory with no fixed version
available on npm. The fix is a migration to the vendor's own distribution, which
is in progress.

This matters only for Excel files, and it is a code execution risk within your
own browser tab from a maliciously crafted file, not a data exfiltration risk.
The zero-upload property is unaffected.

**Verification:** `package.json` lists `xlsx@^0.18.5`;
`src/stores/prismStore.ts:11` imports it statically. The advisory is published in
the npm advisory database.

**Status:** VOLATILE. Remove or rewrite this block when the migration lands.

---

# Category E: Comparisons

---

### E1. How is PRISM different from uploading a file to an online CSV analyzer?

**Short answer:**
An online analyzer uploads your file to the operator's server, where it is
processed and usually retained for some period under their policy. PRISM does the
processing in your browser, so the file never reaches anyone's server. The
practical difference is that using PRISM does not involve disclosing your data to
a third party at all.

**Full answer:**
This distinction matters most when the data is not yours to disclose: client
records under an engagement letter, patient data, unreleased financials, material
under a protective order. In those cases the question is not whether the vendor is
trustworthy, it is whether you are permitted to share the data with them at all.
PRISM removes the question rather than answering it.

**Status:** STABLE

---

### E2. Why not just use Excel, or pandas?

**Short answer:**
If you are comfortable in pandas, use pandas. It is more capable than PRISM in
every analytical dimension. PRISM is for people who need statistics and charts
without writing code and without installing anything, on a machine where they
cannot install anything. Excel already runs locally, so PRISM is not more private
than desktop Excel: it is a different set of statistical tests and chart defaults
with no install.

**Full answer:**
Being accurate about Excel matters. Offline desktop Excel processes your data on
your machine, so the privacy comparison is a wash and we will not pretend
otherwise. Where a real documented difference exists is with Excel's cloud-backed
features: Microsoft's documentation states that Python in Excel runs the Python
code in a container on the Microsoft Cloud, and its AI-assisted analysis features
involve sending data to a service. PRISM's equivalent computation stays in the
tab. That is the honest contrast, and it is limited to those features.

**Status:** STABLE

**Do not say:** "PRISM is more private than Excel." It is not, for offline Excel,
and claiming it would be immediately falsifiable.

---

### E3. Are there other tools that run analysis locally in the browser?

**Short answer:**
Yes. Several tools run analysis locally in the browser or on the desktop,
including DuckDB's local UI, various WebAssembly-based data tools, and desktop
applications like jamovi and JASP. PRISM is not the only tool with a local
architecture and does not claim to be.

**Full answer:**
What PRISM combines is a specific intersection rather than a unique property:
no upload, no install, guided analysis that does not require writing SQL or
Python, and attention to accessibility. Each of those exists separately
elsewhere. If you are comfortable writing SQL, DuckDB's local interface is an
excellent and free option and you should use it.

**Status:** VOLATILE. The competitive landscape moves. Verify before publishing.

**Do not say:** "PRISM is the only tool that keeps your data local." This is
false and easily disproven, and the market research confirms competitors
publishing near-identical claims.

---

# Category F: Practical and commercial

---

### F1. How much does PRISM cost?

**Short answer:**
PRISM has not launched commercially and no pricing is currently in effect. The
intended model is a free hosted version with no account and no sign-up, with paid
tiers for organizations that need an offline build, documentation for security
review, or contractual commitments.

**Status:** BLOCKED pending a live pricing decision. Do not publish specific
prices until they are actually in effect. Proposed figures live in
`docs/business/finance/PRICING.md` and are proposals, not prices.

---

### F2. Is PRISM open source?

**Short answer:**
The licensing is currently being finalised and we are not going to state it until
it is settled.

**Full answer:**
Stating this honestly rather than picking a convenient answer: the repository
currently contains contradictory signals, with an MIT licence file, a
`package.json` declaring the project proprietary and private, and a README that
reads as an open source project. Those cannot all be right. Until the founder
settles it, the accurate answer is that the licence is undecided.

**Verification:** `LICENSE` contains the MIT licence text; `package.json` sets
`"license": "PROPRIETARY"` and `"private": true`.

**Status:** BLOCKED. This is the highest-priority block to resolve, because it
also gates the source-reading verification step in B2 and appears in `llms.txt`.

**Do not say:** "PRISM is open source" or "PRISM is proprietary". Both are
currently unsupportable. If asked, say the licence is being finalised.

---

### F3. What browser do I need?

**Short answer:**
Any current version of Chrome, Edge, Firefox or Safari. PRISM requires JavaScript
and WebAssembly support, both of which are standard in modern browsers. There is
nothing to install and no browser extension.

**Verification:** `index.html` includes a `noscript` fallback; the Pyodide runtime
requires WebAssembly.

**Status:** STABLE

**Do not say:** Specific minimum version numbers. We have not tested against a
browser support matrix, so any version number would be invented.

---

### F4. Does PRISM work on a phone or tablet?

**Short answer:**
PRISM is designed to work in a mobile browser, but it has not been tested or
optimised for mobile use, and the WebAssembly runtime download plus in-memory
analysis are demanding on a phone. We recommend a laptop or desktop.

**Status:** VOLATILE, and currently unmeasured. Do not claim mobile support
until it is tested.

---

### F5. Can I use PRISM with client, patient or regulated data?

**Short answer:**
That is a decision for you and your organization, and PRISM's architecture is
designed to make it an easier one: because your file is never transmitted to us,
using PRISM does not involve disclosing data to a third-party processor. We
cannot tell you whether it satisfies your specific obligations, and we make no
compliance claims.

**Full answer:**
What we can state factually: PRISM has no server that receives your data, no
storage, no account system and no telemetry, so there is no copy of your data in
our possession at any point. What that means under HIPAA, PHIPA, GDPR, your
engagement letter or your firm's policy is a question for your compliance
function, and the useful thing to hand them is the architecture and the
verification steps in B2 rather than a claim from us.

**Status:** STABLE

**Do not say:** "HIPAA compliant", "GDPR compliant", "safe for PHI", or any
statement that PRISM satisfies a regulation. Describe the architecture, let the
customer's compliance function reach its own conclusion.

---

# Maintenance triggers

These blocks go stale silently, which is worse than being absent, because a
stale block is a confident falsehood optimised for extraction. When any change
below lands, update the listed blocks in the same change.

| Change | Update blocks |
|---|---|
| xlsx migration completes | D4, and recheck C1 |
| Offline or self-hosted build ships | D1, A2, F1 |
| Export feature ships | C4, D3 |
| Chart truncation replaced with sampling | C3, D3 |
| Multi-worksheet support ships | C1, D3 |
| Statistical test suite lands | C2, D4 |
| Benchmarks published | D2, D3 |
| Licence decided | F2, and `llms.txt` |
| Pricing goes live | F1, and the structured data `offers` block |
| Any CSP change | B1, B3, and re-verify every block in Category B |
| README compliance claims removed | B5 (rewrite to past tense) |
| New file format supported | C1, D3 |

**Review cadence:** re-verify every VOLATILE block against the tree before any
public launch beat, and at minimum every time the version number changes.
