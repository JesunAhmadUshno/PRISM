# PRISM Competitive Landscape

Author: competitive analysis, PRISM
Date of research: 2026-09-13
Method: live web search and direct page fetches. Every product below carries a URL.
Nothing here is written from memory. Where a number is not sourced it is labelled ASSUMPTION
with the reasoning shown.

---

## 1. The only axis that matters

PRISM's single claim is architectural: no bytes leave the machine. So this landscape is not sorted
by "BI tool" versus "spreadsheet". It is sorted by **where the compute happens**, because that is
the axis PRISM is betting the company on.

| Tier | Where compute happens | What the user must trust |
| --- | --- | --- |
| **A. Browser-local** | The user's own browser tab, via WebAssembly | The page's network behaviour, which is inspectable |
| **B. Local desktop** | The user's own machine, native binary | The binary, inspectable but it must be installed |
| **C. Hybrid** | Browser for data, server for AI or metadata | A vendor promise about which subset is sent |
| **D. Cloud** | Vendor infrastructure | A contract, a DPA and the vendor's security posture |

PRISM sits in Tier A. The uncomfortable finding of this research is that **Tier A is not empty, and
Tier B contains a free tool from a very widely distributed vendor that uses almost PRISM's exact
sentence.**

---

## 2. Tier A: browser-local, no upload. The real competitors.

### ExploreMyData
- URL: https://exploremydata.com/
- What it is: browser-based file analysis. Opens CSV, TSV, TXT, Parquet, JSON, JSONL, NDJSON,
  Excel (.xlsx and .xls), PDF, XML, Word, DuckDB, SQLite, Arrow, Feather, Avro and compressed
  archives. Exports CSV, TSV, Excel, JSON, JSONL, XML, Parquet, PDF, HTML, DuckDB.
- Its claim, verbatim from the site: *"Your browser reads the file and hands the bytes to DuckDB,
  compiled to WebAssembly and running in this tab."* and *"open the network panel, drop a file, and
  watch nothing go out."*
- Price: free, no account. The site states it is supported by display ads.
- Stated file ceiling: 1 GB.
- **Threat to PRISM: HIGH.** This is the closest direct competitor found anywhere in the research.
  It makes the same verifiability argument PRISM makes, in almost the same words, covers far more
  formats than PRISM's three, and costs nothing. Its weaknesses: it is a file and query tool rather
  than a statistics and insight tool, and it is ad supported, which is itself a privacy smell that
  a compliance-minded buyer will notice immediately.

### QueryVeil
- URL: https://www.queryveil.com/privacy-data-analytics
- What it is: AI-assisted analytics over CSV, Excel and JSON with in-browser processing.
- Its claim, verbatim: *"Process data entirely in the browser. The AI only sees schema metadata
  (column names and types), never raw data."*
- The nuance the site itself discloses: in Quick Query mode only schema metadata and the question
  are sent. In Agent Mode and Deep Analysis, capped query results of up to 100 rows **are
  transmitted** for multi-step reasoning. So once the AI features are used it is Tier C, not Tier A.
- Price: a pricing page exists; no figures were displayed at fetch time, so none are quoted here.
- **Threat to PRISM: HIGH on positioning, and simultaneously PRISM's best argument.** QueryVeil
  shows where the market is heading (AI over local data) and proves PRISM's point: the moment you
  add a genuinely useful LLM, rows start leaving. "Zero bytes, no asterisk" is a cleaner sentence
  to defend in a security review than "zero bytes except up to 100 rows in Agent Mode".

### Local Data Tools
- URL: https://www.localdatatools.com/
- Its claim, verbatim: *"Every tool here does its work locally: your files are read by JavaScript
  and WebAssembly inside the tab and never leave your machine."*
- Scope: CSV merge, diff, edit, filter, test data generation, format conversion, OCR,
  anonymisation, metadata stripping, hashing, compression, local AI chat.
- No statistical analysis and no charting were found on the site.
- Price: free, no sign-up. The site argues explicitly that because processing is on-device there
  are no server costs to recover through fees or data collection.
- **Threat to PRISM: MEDIUM.** Adjacent rather than overlapping. It owns "clean and convert
  locally"; PRISM would own "analyse locally". But it trains the same buyer on the same trust story
  at a price of zero.

### The browser-utility swarm
A large, fragmented set of free single-purpose local-processing tools. Representative live pages:
- CSV Workbench, local CSV validation: https://csvworkbench.com/blog/local-csv-validation.html
- Refinata, 100+ browser file tools: https://refinata.com/
- CSV Sanitizer, local PII masking: https://sanitize-data.org/
- ClientSideTools, data analytics category: https://clientsidetools.com/categories/data-analytics/
- PlainBench CSV and Excel viewer: https://plainbench.com/tools/csv-excel-viewer
- **Threat to PRISM: LOW individually, MEDIUM in aggregate.** None of them does statistics.
  Collectively they have already commoditised the phrase "never leaves your browser" and eroded its
  ability to command a price. A buyer who has used three of these for free will not assume the
  fourth one costs money.

### DuckDB-Wasm and the DuckDB web shell
- URLs: https://duckdb.org/2021/10/29/duckdb-wasm and https://shell.duckdb.org
- What it is, from the announcement: *"an in-process analytical SQL database for the browser. It is
  powered by WebAssembly, speaks Arrow fluently, reads Parquet, CSV and JSON files."*
- Accuracy note: that post does **not** make an explicit no-data-leaves claim. The engine is
  in-process, but DuckDB-Wasm can also read over HTTP, so the privacy property depends on how an
  application uses it, not on the engine by itself.
- **Threat to PRISM: HIGH as an ingredient.** DuckDB-Wasm is the free engine that lets any
  competitor assemble an ExploreMyData clone quickly. It is the main reason PRISM's architecture is
  not scarce.

### JupyterLite, on Pyodide
- URLs: https://jupyterlite.readthedocs.io and https://pyodide.org
- A JupyterLab distribution that runs entirely in the browser on Pyodide and can be served as a
  static site. NumPy, pandas, matplotlib and SciPy are available in-browser, see
  https://pyodide.org/en/stable/project/related-projects.html
- Independent write-up of its real constraints (browser memory ceiling, no GPU, notebook state lost
  on tab close): https://www.zonca.dev/posts/2026-05-18-jupyterlite-no-server-needed.html
- **Threat to PRISM: MEDIUM.** Same runtime as PRISM, far more analytical power, zero cost, and it
  is the default answer any technical reviewer will raise. Its weakness is that it is a notebook: it
  demands Python fluency and offers no guided insight. PRISM's buyer is precisely the person who
  cannot write pandas.

### Perspective (FINOS, now OpenJS Foundation)
- URL: https://github.com/finos/perspective
- What it is: *"an interactive analytics and data visualization component for large, real-time and
  streaming datasets"*, with a C++ streaming query engine compiled to WebAssembly. Apache-2.0.
  11.2k GitHub stars at time of fetch. Originally developed at J.P. Morgan and open-sourced through
  the Fintech Open Source Foundation; the project is now a member of the OpenJS Foundation.
- Note: the canonical docs domain has moved. https://perspective.finos.org/ returns a 301 to
  https://perspective-dev.github.io/
- **Threat to PRISM: LOW as a product, HIGH as a component.** It is a library, so it competes for no
  end user directly. But it is exactly the grid and charting layer a competitor would drop in, and
  it already carries trust inside financial institutions, which is PRISM's most plausible vertical.

### Observable: Notebooks 2.0, Notebook Kit, Desktop
- URLs: https://observablehq.com/notebook-kit/ , https://observablehq.com/notebook-kit/desktop ,
  https://observablehq.com/blog/observable-2-0
- What changed: Observable shipped a technology preview of Notebook Kit, an open notebook file
  format with tooling to generate static sites, and Observable Desktop, a macOS application that
  edits notebooks as local files. Desktop currently requires macOS 15+ on Apple Silicon.
- Observable's own year-in-review points at Canvases as the 2026 focus:
  https://old.observablehq.com/blog/observable-2025-year-in-review
- **Threat to PRISM: MEDIUM and rising.** A funded company is moving from cloud notebooks toward
  local, file-over-app work, which walks directly into PRISM's positioning. It is aimed at
  developers and Desktop is Mac-only today, which buys PRISM time rather than safety.

### RATH by Kanaries
- URLs: https://kanaries.net/rath , https://github.com/Kanaries/Rath , https://docs.kanaries.net/rath
- Open source automated exploratory data analysis with an augmented analytics engine, data painter,
  dashboards and causal analysis. AGPL licensed. The client can be deployed locally, with the docs
  describing a local deployment on localhost:3000
  (https://docs.kanaries.net/rath/deployment).
- Accuracy note: RATH is self-hostable and locally deployable, but the research did not find an
  explicit "your data never leaves the browser" guarantee of the kind ExploreMyData or the DuckDB
  UI publish. Treat it as local-capable, not as a verified zero-egress product.
- **Threat to PRISM: MEDIUM.** It is the closest competitor on *ambition*: automated insight
  generation from a dropped dataset, which is exactly PRISM's "AI insights" feature, already built,
  already open source, and considerably deeper.

---

## 3. Tier B: local but not in the browser. The most dangerous quote in this document.

### DuckDB Local UI
- URL: https://duckdb.org/2025/03/12/duckdb-ui.html
- Launched with `duckdb -ui` or `CALL start_ui();`. Described as a full-featured local web UI that
  runs locally on your computer.
- Its claim, verbatim: ***"The DuckDB UI runs all your queries locally: your queries and data never
  leave your computer."***
- Optional, explicitly opt-in MotherDuck sign-in for cloud persistence. Built as a collaboration
  between DuckLabs and MotherDuck.
- **Threat to PRISM: CRITICAL for messaging.** This is functionally PRISM's headline sentence,
  published by a project with enormous developer distribution, for free, over a vastly more capable
  engine. PRISM cannot win the argument "we are the local one". PRISM can only win "we are the local
  one that needs no install, no terminal and no SQL".

### Rill Developer
- URLs: https://docs.rilldata.com/ and
  https://www.rilldata.com/blog/building-an-agent-friendly-local-first-analytics-stack-with-motherduck-and-rill
- The docs describe Rill Developer as *"a local application that makes it easy to build end-to-end
  analytics pipelines"*, started with `rill start`. Rill Cloud is *"a fully managed service where
  your team can explore dashboards, ask questions with AI Chat, set up alerts, and schedule reports
  ... no local setup required for consumers."*
- **Threat to PRISM: LOW direct, MEDIUM strategic.** Local authoring, cloud sharing. It illustrates
  the business-model gravity PRISM will feel the instant a user asks "how do I send this to my boss".

### Evidence
- URL: https://evidence.dev/
- BI as code: SQL plus Markdown, a CLI for local preview and validation, Git-based deploy, a cloud
  editor, branch previews and rollback. Distributed on npm. It positions itself as a platform with
  scheduled emails, page-level access control and usage analytics rather than a pure static site
  generator.
- **Threat to PRISM: LOW.** A different buyer entirely: analytics engineers who already have a
  warehouse and a Git workflow.

### jamovi and JASP
- URLs: https://www.jamovi.org/ and https://jasp-stats.org/
- Free, open source desktop statistics packages, both widely positioned as SPSS alternatives.
  jamovi is R-backed with an SPSS-like interface; JASP comes out of the University of Amsterdam and
  emits APA-formatted output tables. Both read SPSS .sav files. Independent comparison:
  https://casrai.org/guides/jamovi-vs-jasp
- **Threat to PRISM: HIGH in the research and academic segment.** If PRISM's pitch is "statistical
  analysis without sending data anywhere", these already do that, free, offline, with far deeper
  statistics and institutional credibility PRISM does not have. PRISM's only edge over them is zero
  install and a browser-native workflow.

### Microsoft Excel, desktop
The largest competitor by user count and the one most often ignored in decks like this. Excel on
the desktop already computes locally. **PRISM is not more private than offline Excel.** Saying
otherwise would be the kind of claim that collapses in the first technical review.

Where the real wedge is, from Microsoft's own documentation:
- Python in Excel: *"Python in Excel runs the Python code used by Excel in a secure container on the
  Microsoft Cloud."*
  https://support.microsoft.com/en-us/office/data-security-and-python-in-excel-33cc88a4-4a87-485e-9ff9-f35958278327
- Analyze Data: *"Because Analyze Data analyzes your data with artificial intelligence services, you
  might be concerned about your data security."* The same page states: *"Analyze Data doesn't
  currently support analyzing datasets over 1.5 million cells."*
  https://support.microsoft.com/en-us/office/analyze-data-in-excel-3223aab8-f543-4fda-85ed-76bb0295ffc4

**Threat to PRISM: CRITICAL as the default choice, but this is also PRISM's sharpest true claim.**
The moment an Excel user wants modern analysis (Python, or AI-generated insight), Microsoft's own
documentation says the compute moves to the Microsoft Cloud. PRISM does that analysis and keeps the
compute in the tab. That contrast is real, vendor-documented and defensible.

---

## 4. Tier D: cloud analytics. Where the budget is, and where PRISM is disqualified on day one.

### Tableau Public
- URL: https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm
- Verbatim: *"Workbooks and data published to your Tableau Public profile are not private and are
  freely accessible to anyone."* Anyone can interact with the views, or download the workbooks and
  data sources.
- **Threat to PRISM: LOW.** It is the perfect negative example for PRISM's narrative, stated in
  Tableau's own documentation rather than in PRISM's marketing.

### Google Looker Studio
- URL: https://lookerstudio.google.com
- Cloud only, requires a Google account, connects through Google and third-party connectors.
- **Threat to PRISM: LOW direct.** Free and ubiquitous, and structurally incapable of PRISM's claim.

### Metabase
- URL: https://www.metabase.com/pricing
- The Open Source tier is free and self-hosted with unlimited users. Paid tiers at time of fetch:
  Starter $90/month including the first 5 users, Pro $517.50/month including the first 10 users,
  Enterprise custom pricing starting at $20,000/year.
- Self-hosting keeps data inside your own infrastructure, but it still requires a server and a
  database. It is not a no-install browser tool, and it queries databases rather than dropped files.
- **Threat to PRISM: LOW direct, HIGH as a pricing anchor.** Metabase's free tier sets the buyer's
  expectation that capable analytics costs nothing until a team needs governance features.

### ChatGPT Advanced Data Analysis
- URL: https://help.openai.com/en/articles/8437071-advanced-data-analysis-chatgpt-enterprise-version
- A sandboxed Python environment where the user uploads the file. The Enterprise tier adds single
  sign-on, admin audit logging, data isolation and a contractual commitment that customer inputs are
  not used for model training.
- **Threat to PRISM: CRITICAL on capability, and PRISM's strongest contrast on architecture.** It is
  dramatically more capable at analysis than PRISM is or will be. But the file is uploaded, and the
  guarantee is contractual rather than architectural. A contract is exactly the artefact an IT
  auditor knows how to interrogate. This is the comparison PRISM should deliberately pick.

---

## 5. Scoreboard

Threat is scored against PRISM's *actual current product*: drop an Excel or CSV file, receive
descriptive statistics, generated insights and charts, entirely inside the tab.

| Product | Tier | Explicit no-upload claim | Statistics | Charts | Price | Threat |
| --- | --- | --- | --- | --- | --- | --- |
| ExploreMyData | A | Yes, verbatim | No | Limited | Free, ad supported | HIGH |
| QueryVeil | A / C | Yes, with disclosed exceptions | AI-assisted | Yes | Not published at fetch | HIGH |
| Local Data Tools | A | Yes, verbatim | No | No | Free | MEDIUM |
| Utility swarm | A | Yes, individually | No | No | Free | MEDIUM in aggregate |
| DuckDB-Wasm, web shell | A | Not stated explicitly | SQL only | No | Free | HIGH as ingredient |
| JupyterLite | A | Implicit in architecture | Full, via SciPy | Yes | Free | MEDIUM |
| Perspective | A | Not applicable, a library | Pivot and aggregate | Yes | Free, Apache-2.0 | HIGH as component |
| RATH | A / B | Not verified | Auto-EDA, causal | Yes | Free, AGPL | MEDIUM |
| Observable Desktop | A / B | Local files, macOS only | Via JS libraries | Yes | See Observable pricing | MEDIUM, rising |
| DuckDB Local UI | B | Yes, verbatim | SQL only | Some | Free | CRITICAL on messaging |
| Rill Developer | B | Local application | Metrics layer | Yes | Cloud tiers vary | LOW |
| Evidence | B | Local CLI, cloud deploy | SQL | Yes | Free, Team, Pro | LOW |
| jamovi, JASP | B | Desktop, offline | Deep inferential | Yes | Free | HIGH in research |
| Excel desktop | B | Local by default | Deep | Yes | M365 subscription | CRITICAL as default |
| Python in Excel | D | No, runs in Microsoft Cloud | Deep | Yes | M365 | Contrast opportunity |
| Tableau Public | D | The opposite, explicitly public | Some | Yes | Free | LOW |
| Looker Studio | D | No | Basic | Yes | Free with Google account | LOW |
| Metabase | C / D | Self-host is private | Basic | Yes | Free to $20,000+/yr | Pricing anchor |
| ChatGPT ADA | D | No, the file is uploaded | Deep | Yes | Subscription | CRITICAL on capability |

---

## 6. What the research did not find

Stated plainly, because absence of evidence is still a finding.

1. **No funded pure-play browser-local analytics company surfaced.** Searches for local-first and
   client-side analytics startups with 2025 or 2026 funding returned general analytics directories
   (https://topstartups.io/?industries=Analytics and
   https://ycombinator.com/companies/industry/analytics) and no company whose entire pitch is
   browser-local analytics. This is not proof that none exists. It does suggest the category has no
   capitalised owner yet, which is both the opportunity and the warning.
2. **No competitor found combines all four of:** zero install, zero upload, guided statistics for a
   non-programmer, and accessibility treated as a first-class design goal. ExploreMyData has the
   first two and not the second two. jamovi and JASP have the statistics and not the zero install.
   JupyterLite has the runtime and not the guidance.
3. **No market size figure is quoted in this document.** Every browser-analytics or embedded-
   analytics TAM number encountered during research sat on a vendor page or an SEO blog with no
   traceable primary source. A missing number is better than a fabricated one. If a figure is needed
   later, derive it bottom-up from a real, named seat count in a named vertical and show the
   arithmetic in full.

---

## 7. The gap PRISM could actually occupy

Reading the whole board, the unclaimed square is narrow but real:

> The non-programmer with a sensitive spreadsheet who needs a defensible answer today, cannot
> install software, and cannot upload the file.

Each clause eliminates a tier:

- **"Cannot upload"** removes Tableau Public, Looker Studio, ChatGPT ADA, Python in Excel and
  Metabase Cloud.
- **"Cannot install"** removes DuckDB Local UI, Rill, Evidence, jamovi, JASP and Observable Desktop.
- **"Non-programmer"** removes JupyterLite, the DuckDB web shell and Perspective.
- **"Defensible answer"**, meaning a stated methodology and an accessible, shareable output, removes
  the free utility swarm and, arguably, ExploreMyData.

That intersection is real. It is also small, and every one of those four constraints is a constraint
on the *user*, not a capability of PRISM. DIFFERENTIATION.md is about how quickly that square could
be taken away.

---

## Sources

- https://exploremydata.com/
- https://www.queryveil.com/privacy-data-analytics
- https://www.localdatatools.com/
- https://csvworkbench.com/blog/local-csv-validation.html
- https://refinata.com/
- https://sanitize-data.org/
- https://clientsidetools.com/categories/data-analytics/
- https://plainbench.com/tools/csv-excel-viewer
- https://duckdb.org/2021/10/29/duckdb-wasm
- https://shell.duckdb.org
- https://duckdb.org/2025/03/12/duckdb-ui.html
- https://duckdb.org/2024/10/02/pyodide
- https://jupyterlite.readthedocs.io
- https://pyodide.org
- https://pyodide.org/en/stable/project/related-projects.html
- https://www.zonca.dev/posts/2026-05-18-jupyterlite-no-server-needed.html
- https://github.com/finos/perspective
- https://perspective-dev.github.io/
- https://observablehq.com/notebook-kit/
- https://observablehq.com/notebook-kit/desktop
- https://observablehq.com/blog/observable-2-0
- https://old.observablehq.com/blog/observable-2025-year-in-review
- https://kanaries.net/rath
- https://github.com/Kanaries/Rath
- https://docs.kanaries.net/rath
- https://docs.kanaries.net/rath/deployment
- https://docs.rilldata.com/
- https://www.rilldata.com/blog/building-an-agent-friendly-local-first-analytics-stack-with-motherduck-and-rill
- https://evidence.dev/
- https://www.jamovi.org/
- https://jasp-stats.org/
- https://casrai.org/guides/jamovi-vs-jasp
- https://support.microsoft.com/en-us/office/data-security-and-python-in-excel-33cc88a4-4a87-485e-9ff9-f35958278327
- https://support.microsoft.com/en-us/office/analyze-data-in-excel-3223aab8-f543-4fda-85ed-76bb0295ffc4
- https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm
- https://lookerstudio.google.com
- https://www.metabase.com/pricing
- https://help.openai.com/en/articles/8437071-advanced-data-analysis-chatgpt-enterprise-version
- https://topstartups.io/?industries=Analytics
- https://ycombinator.com/companies/industry/analytics
