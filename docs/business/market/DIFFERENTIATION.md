# PRISM Differentiation: Where It Wins, Where It Loses, How It Dies

Companion to COMPETITIVE_LANDSCAPE.md
Date: 2026-09-13
Tone: deliberately unkind. A flattering version of this document would be worthless.

---

## 0. What PRISM actually is today, verified against the code

Before any positioning claim, the honest inventory. These are facts read from the repository on
2026-09-13, not aspirations:

- Roughly 6,100 lines across 20 files, 7 commits, last substantive work January 2026.
- Pre-revenue. No users.
- Zero tests exist today. A separate engineering effort is addressing this in parallel.
- `src/python/prism_core.py` is 657 lines and imports **pandas and numpy only**. No SciPy, no
  statsmodels, no scikit-learn.
- The analytical surface is: `load_csv`, `_detect_column_types`, `_infer_column_type`,
  `get_column_info`, `compute_statistics`, `recommend_visualizations`, `generate_insights`,
  `get_chart_data`, `analyze`, `analyze_csv`.
- Therefore PRISM performs **descriptive** statistics (mean, median, standard deviation, quartiles),
  plus type inference, chart recommendation, and heuristic insight generation for trends, outliers
  and correlations. It does **not** perform inferential statistics. There is no t-test, no ANOVA, no
  regression, no confidence interval, no hypothesis test of any kind in the current code.
- `xlsx@0.18.5` carries a HIGH severity prototype-pollution advisory with no npm-side fix. The
  remediation is the SheetJS CDN build, which the CSP already permits via cdn.sheetjs.com.
- The README asserts WCAG 2.2 Level AAA and ISO/IEC 27001:2022 compliance. Neither has verification
  behind it. Both are liabilities, not assets, until they do.
- LICENSE says PROPRIETARY, package.json says private, the README reads like an open source project.
  These three cannot all be true.
- Bundle: a 564 kB charts chunk, and xlsx is statically imported so it loads eagerly on first paint.

**Any positioning that requires PRISM to be a statistics platform is currently false.** PRISM is an
automated descriptive-analysis and charting tool with an unusually strong privacy architecture.
That is a smaller product than the README implies, and it is still a real one.

---

## 1. Where PRISM genuinely wins

Four claims survive scrutiny. Only four.

### 1.1 The privacy claim is architectural, not contractual. This is the whole company.

Every serious alternative offers a *promise*. PRISM offers a *property*.

- ChatGPT Advanced Data Analysis offers a contract: Enterprise includes data isolation and a
  commitment that inputs are not used for training
  (https://help.openai.com/en/articles/8437071-advanced-data-analysis-chatgpt-enterprise-version).
  The file is still uploaded. The guarantee is legal.
- Python in Excel is explicit that *"Python in Excel runs the Python code used by Excel in a secure
  container on the Microsoft Cloud"*
  (https://support.microsoft.com/en-us/office/data-security-and-python-in-excel-33cc88a4-4a87-485e-9ff9-f35958278327).
  The guarantee is operational.
- Excel's Analyze Data warns in Microsoft's own words: *"Because Analyze Data analyzes your data with
  artificial intelligence services, you might be concerned about your data security"*
  (https://support.microsoft.com/en-us/office/analyze-data-in-excel-3223aab8-f543-4fda-85ed-76bb0295ffc4).
- Tableau Public is blunt: *"Workbooks and data published to your Tableau Public profile are not
  private and are freely accessible to anyone"*
  (https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm).

PRISM's guarantee is different in kind. `default-src 'none'`, `form-action 'none'`, a connect-src
restricted to the runtime CDN, and no fetch, XMLHttpRequest, WebSocket or sendBeacon anywhere in
`src/`. A reviewer verifies it with a network panel in under sixty seconds, and the browser enforces
it whether or not PRISM is trustworthy. **That is the only genuinely rare thing PRISM owns.**

Concrete consequence, which is the actual sales line: a user can open a competitor's financials,
patient records or an unreleased earnings sheet, and no server sees a byte. The cloud tools
structurally cannot say this.

### 1.2 Zero install is a real constraint-breaker, and it eliminates the strongest local rivals

The most capable local competitors all fail the same test. DuckDB Local UI requires a binary and a
terminal (`duckdb -ui`, https://duckdb.org/2025/03/12/duckdb-ui.html). Rill Developer requires
`rill start` (https://docs.rilldata.com/). Evidence requires Node and a CLI (https://evidence.dev/).
jamovi and JASP require desktop installs (https://www.jamovi.org/ , https://jasp-stats.org/).
Observable Desktop requires macOS 15+ on Apple Silicon
(https://observablehq.com/notebook-kit/desktop).

In a locked-down bank, hospital or government department, "install this binary" is a multi-week
change request and often a flat no. A URL is not. PRISM is the only tool in the research that is
simultaneously zero-upload and zero-install for a non-technical user on a managed Windows laptop.

### 1.3 The guided path, for a user who cannot write code

JupyterLite gives a blank notebook. The DuckDB web shell gives a SQL prompt. Perspective gives a
component a developer must integrate. All three assume competence PRISM's target user does not have.
PRISM's `recommend_visualizations` and `generate_insights` produce an answer from a dropped file
without a single line typed. That is a genuine difference from the technically superior Tier A tools.

Caveat, stated so nobody oversells it: RATH (https://github.com/Kanaries/Rath) already does
automated exploratory analysis, open source and free, and does it more deeply. PRISM's advantage over
RATH is deployment model and the explicit zero-egress guarantee, not insight quality.

### 1.4 Accessibility as a design goal, in a category that ignores it entirely

Not one competitor examined in the landscape research foregrounds accessibility. PRISM's codebase
includes screen-reader data-table fallbacks, sonification, keyboard navigation and high-contrast
support. For a public-sector buyer with a procurement accessibility requirement, that is a
disqualifying criterion applied to everyone else.

**The rule for this one is absolute: write "designed against WCAG 2.2" or "architected toward AAA
criteria". Never "WCAG 2.2 AAA compliant" until an audit exists.** An unverified accessibility claim
to a public-sector buyer is not merely embarrassing, it is the kind of misstatement that ends a
procurement and, in some jurisdictions, invites a complaint. The same applies to ISO/IEC 27001:2022:
PRISM may say it was architected against 27001 control families, having been built by someone who
ran 27001 audits at KPMG. It may not say it is certified. It is not.

---

## 2. Where PRISM genuinely loses

### 2.1 The architecture is not scarce, and the words are already taken

This is the single most important finding of the research and it should be uncomfortable.

DuckDB, free, with enormous distribution, publishes: *"The DuckDB UI runs all your queries locally:
your queries and data never leave your computer"* (https://duckdb.org/2025/03/12/duckdb-ui.html).
ExploreMyData, free, publishes: *"open the network panel, drop a file, and watch nothing go out"*
(https://exploremydata.com/). Local Data Tools, free, publishes: *"your files are read by JavaScript
and WebAssembly inside the tab and never leave your machine"* (https://www.localdatatools.com/).

PRISM's headline is not a differentiator. It is table stakes for a category that already exists,
sells at zero, and got there first. PRISM's actual differentiation has to be the *combination* in
section 1, and a combination is a much weaker moat than a property.

### 2.2 Capability gap versus every serious alternative

Blunt list of what PRISM cannot do that its competitors can:

- **No inferential statistics.** pandas and numpy only. jamovi and JASP do hypothesis testing,
  Bayesian analysis and APA output, for free. JupyterLite has SciPy and scikit-learn available
  (https://pyodide.org/en/stable/project/related-projects.html). PRISM has quartiles.
- **No SQL, no joins, no multi-file work.** DuckDB-Wasm gives all of it free
  (https://duckdb.org/2021/10/29/duckdb-wasm).
- **Three formats.** ExploreMyData opens CSV, TSV, TXT, Parquet, JSON, JSONL, NDJSON, Excel, PDF,
  XML, Word, DuckDB, SQLite, Arrow, Feather, Avro and archives, up to 1 GB.
- **No persistence and no sharing.** Which is the direct cost of the privacy architecture, and it is
  the first question every real user asks: "how do I send this to my manager?"
- **Browser memory ceiling.** A documented constraint of the whole Pyodide-in-browser approach
  (https://www.zonca.dev/posts/2026-05-18-jupyterlite-no-server-needed.html). PRISM will lose on any
  dataset that a warehouse handles trivially.
- **Cold start.** Pyodide plus pandas and numpy is a multi-megabyte download before anything
  computes, and reducing it is a long-standing tracked problem upstream
  (https://github.com/pyodide/pyodide/issues/1365). Combined with a 564 kB charts chunk and an
  eagerly imported xlsx, PRISM's first impression is a wait. Competitors that ship a native binary or
  a server do not have this problem. No specific second count is quoted here because none was
  measured on this build; measure it before ever putting a number in a deck.

### 2.3 The credibility gap, which is self-inflicted and the fastest to close

7 commits. Zero tests. No users. A HIGH severity dependency CVE. A LICENSE, a package.json and a
README that contradict each other. Two compliance claims with nothing behind them.

Any technical buyer who performs ten minutes of diligence finds all of this. The privacy claim is
real, but it is being delivered by a repository whose surface signals say "unfinished". The gap
between a genuinely rigorous architecture and an unserious-looking repository is PRISM's most
expensive problem, and unlike the capability gap it costs almost nothing to fix.

The compliance claims are worse than useless. They invert the founder's own advantage: the credible
version of this pitch is "built by someone who ran ISO 27001 audits at KPMG for banks and
healthcare, and who therefore refuses to claim a certification the product does not hold". That
sentence is both true and more persuasive than the badge.

### 2.4 No distribution, and the category's price is zero

Every Tier A competitor is free. Two are explicitly ad-supported or cost-free-by-architecture.
Metabase anchors capable analytics at $0 for self-hosted open source
(https://www.metabase.com/pricing). PRISM has no distribution channel, no community, no design
partner and no reason for anyone to find it. A superior product with no distribution loses to an
inferior product with distribution every single time.

---

## 3. Moat assessment: thin

Graded honestly, on what exists today.

| Candidate moat | Real? | Durability | Verdict |
| --- | --- | --- | --- |
| Zero-egress architecture | Yes | Low | Real but reproducible in weeks. DuckDB and ExploreMyData already claim it. |
| Zero install plus zero upload | Yes | Low to medium | The genuine gap today, closable by any Tier A competitor adding stats. |
| Guided insight for non-coders | Partly | Low | RATH already does it, deeper and open source. |
| Accessibility depth | Yes, in intent | Medium | Nobody else is trying. Worthless until audited, defensible once it is. |
| Compliance-auditor framing | Yes | Medium to high | Founder credibility is not copyable. Product credibility is not there yet. |
| Data, network or switching costs | No | None | PRISM stores nothing by design. There is no lock-in, ever. |
| Brand or distribution | No | None | Zero users. |

**Plain statement: PRISM has no durable technical moat.** The architecture is a few weeks of work for
a competent team using freely available components, and the phrase is already in use by better
funded projects. What PRISM has is a *position*, an intersection of four constraints nobody else
currently satisfies at once, plus a founder whose background makes the trust argument credible in
exactly the regulated verticals where the position matters.

A position is defensible only by moving faster than the people who can copy it, or by converting it
into something that is genuinely hard to copy: an audited accessibility posture, a real third-party
security attestation of the zero-egress claim, and reference customers in a regulated vertical. None
of those three exists today. All three are achievable. That is the honest strategic picture.

---

## 4. How a well-funded competitor kills PRISM

Five scenarios, most likely first. All cost and timeline figures are labelled ASSUMPTION with the
reasoning shown, because no real figure exists for any of them.

### Scenario 1: ExploreMyData adds descriptive statistics and charts
**Likelihood: high. Time to kill: weeks.**
It already parses more formats than PRISM, already runs DuckDB-Wasm in the tab, and already makes the
verifiability argument in its own words. Adding summary statistics and a chart panel is incremental
work on an existing product with existing traffic.
ASSUMPTION on effort: a small number of engineer-weeks, reasoning that the hard parts (parsing,
WASM engine, the local-only architecture, the audience) are already built and shipped.
**PRISM's only counter:** be the one with guided interpretation, accessibility and an audit story,
not merely the one with numbers.

### Scenario 2: DuckDB or MotherDuck ships a browser-hosted local UI
**Likelihood: medium. Time to kill: months. Severity: highest.**
The Local UI already publishes PRISM's sentence and the MotherDuck relationship is already explicit
and opt-in (https://duckdb.org/2025/03/12/duckdb-ui.html). DuckDB-Wasm already exists. If the same
experience appears at a URL with no install, PRISM's zero-install advantage evaporates against a
vastly better engine, for free, with enormous developer mindshare.
**PRISM's only counter:** the non-programmer. DuckDB's centre of gravity is SQL, and SQL is a wall
for PRISM's buyer. That is a narrow ledge to stand on, and it is the one PRISM is standing on.

### Scenario 3: Microsoft moves Analyze Data on-device
**Likelihood: low to medium. Time to kill: instant on announcement. Severity: extinction-level.**
PRISM's Excel wedge depends entirely on Microsoft's own documented statement that Python in Excel
runs in the Microsoft Cloud. Local model inference on client hardware is an active industry
direction. If Microsoft ships a local mode for Analyze Data, PRISM's contrast with the world's
default spreadsheet disappears overnight, and PRISM will not hear about it in advance.
**PRISM's only counter:** none technically. Only being established in a vertical Microsoft serves
poorly before it happens. Treat this as an unhedgeable risk and plan for the scenario rather than
against it.

### Scenario 4: an AI analytics vendor adds a credible "local mode"
**Likelihood: medium to high. Time to kill: months.**
QueryVeil already demonstrates the hybrid shape: process in the browser, send only schema metadata,
with the honest disclosure that Agent Mode transmits capped result rows
(https://www.queryveil.com/privacy-data-analytics). A funded vendor could ship a strictly
schema-only mode with a third-party attestation, and take PRISM's entire trust argument while
offering AI quality PRISM cannot match locally.
**PRISM's counter, and it is a real one:** "schema only" is still an asterisk. Column names alone can
be sensitive (a column named `layoff_date_q3` leaks strategy). PRISM's zero is a harder number than
their small number, and the difference is exactly what a security reviewer is paid to notice.

### Scenario 5: nobody attacks and PRISM dies of irrelevance
**Likelihood: highest of all five.**
The most probable outcome is not assassination. It is that PRISM is never found, because free
competitors occupy every search result for "analyse CSV without uploading", the repository's surface
signals do not survive diligence, and nobody was ever recruited to use it. Zero users and 7 commits
is not a competitive problem. It is an existential one, and it is the only one on this list fully
within the founder's control.

---

## 5. The narrow position worth defending

Not "browser analytics". Not "privacy-first BI". Both are taken and both sell at zero. The position
that survives contact with the landscape:

> **The analysis tool for data that is not allowed to leave the room, used by the person who is not
> allowed to install software and cannot write code.**

Why each word earns its place:
- "Not allowed to leave the room" is a compliance constraint, not a preference, so it has a budget
  behind it in a way that consumer privacy does not.
- "Not allowed to install" eliminates DuckDB Local UI, Rill, Evidence, jamovi, JASP and Observable
  Desktop in one clause.
- "Cannot write code" eliminates JupyterLite, the DuckDB shell and Perspective.
- Together they select for regulated verticals, which happens to be precisely where the founder's
  KPMG background in ISO 27001 audits for banking and healthcare is verifiable and load-bearing.

The three things that would convert that position into an actual moat, in priority order:

1. **A third-party attestation of the zero-egress claim.** Not a self-assertion. A named reviewer's
   statement, published, with the method described. This is the one asset in the whole plan that a
   competitor cannot copy by writing code, and it converts a marketing sentence into evidence.
2. **A real WCAG audit,** with the result published whatever it says. AAA is not required. An honest
   audited AA with documented AAA-targeted features beats an unaudited AAA claim in every procurement
   PRISM would ever enter, and it removes a live liability.
3. **Three named users in one regulated vertical.** Not a pipeline number. Three people who opened a
   file they could not have uploaded anywhere else.

Until at least the first and third exist, PRISM should be described internally as a strong
architectural prototype with an unproven market, not as a platform. Every document this company
produces should hold that line, because the moment one of them does not, the compliance buyer who
would have been the first customer stops believing the one claim that was actually true.

---

## Sources

- https://exploremydata.com/
- https://www.queryveil.com/privacy-data-analytics
- https://www.localdatatools.com/
- https://duckdb.org/2025/03/12/duckdb-ui.html
- https://duckdb.org/2021/10/29/duckdb-wasm
- https://docs.rilldata.com/
- https://evidence.dev/
- https://www.jamovi.org/
- https://jasp-stats.org/
- https://github.com/Kanaries/Rath
- https://github.com/finos/perspective
- https://observablehq.com/notebook-kit/desktop
- https://pyodide.org/en/stable/project/related-projects.html
- https://github.com/pyodide/pyodide/issues/1365
- https://www.zonca.dev/posts/2026-05-18-jupyterlite-no-server-needed.html
- https://support.microsoft.com/en-us/office/data-security-and-python-in-excel-33cc88a4-4a87-485e-9ff9-f35958278327
- https://support.microsoft.com/en-us/office/analyze-data-in-excel-3223aab8-f543-4fda-85ed-76bb0295ffc4
- https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm
- https://help.openai.com/en/articles/8437071-advanced-data-analysis-chatgpt-enterprise-version
- https://www.metabase.com/pricing
