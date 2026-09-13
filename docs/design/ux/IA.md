# PRISM Information Architecture and Navigation

Owner: UX architecture
Date written: 2026-09-13
Status: sections 1 to 3 describe the code as built. Sections 4 onward are proposals.

---

## 0. Method

Structure was read out of `src/App.tsx`, `src/components/**`, `src/stores/prismStore.ts`
and `index.html` on the date above. Every `file:line` is a real location in the
tree. No structure in section 1 is inferred from documentation.

---

## 1. The information architecture as built

### 1.1 The full tree

```
PRISM (single page, no router, no URL state, nothing persisted)
|
+-- header                                        App.tsx:160-215   role=banner
|     +-- PrismLogo + "PRISM" (h1) + "Secure Analytics Platform"
|     +-- Font size select: A / A+ / A++          App.tsx:178-188
|     +-- Theme toggle (light and dark only)      App.tsx:191-206
|
+-- main                                          App.tsx:209-628   role=main
|     +-- h2 "Data Analysis Dashboard"            sr-only, App.tsx:218
|     +-- Security banner "Zero-Trust Mode Active" App.tsx:223-237  role=status
|     |
|     +-- IF no results ------------------------------------------- App.tsx:238
|     |     +-- Hero h3 "Analyze your data with complete privacy"
|     |     +-- TABLIST 1 "Analysis mode"          App.tsx:205 area
|     |     |     +-- tab "Single File"   -> tabpanel single-file-panel
|     |     |     +-- tab "Link Datasets" -> tabpanel multi-dataset-panel
|     |     |
|     |     +-- tabpanel: FileUploader             FileUploader.tsx
|     |     |     +-- dropzone (role=button)
|     |     |     +-- "Select File" button
|     |     |     +-- sr-only live region
|     |     |
|     |     +-- tabpanel: DatasetManager           DatasetManager.tsx
|     |     |     +-- h3 "Dataset Manager"
|     |     |     +-- "Link Datasets" button (>= 2 datasets)
|     |     |     +-- add zone (no role, no label)
|     |     |     +-- h4 "Loaded Datasets (n)" -> DatasetCard grid
|     |     |     +-- LinkBuilder (inline, not a dialog)
|     |     |     +-- h4 "Dataset Links (n)" -> LinkDisplay rows
|     |     |     +-- "Analyze n Datasets" button
|     |     |     +-- tip line
|     |     |
|     |     +-- Progress card (while processing)   App.tsx:320-355
|     |     +-- Error block                        App.tsx:357-380
|     |     +-- Feature grid: Private / Fast / Accessible  App.tsx:382-397
|     |
|     +-- IF results ---------------------------------------------- App.tsx:399
|           +-- h3 "Analysis Complete" + file name
|           +-- "New Analysis" button
|           +-- TABLIST 2 "Results view mode"      App.tsx:425-456
|           |     +-- tab "Quick Summary"          no id, no aria-controls
|           |     +-- tab "Analytics Workspace"    no id, no aria-controls
|           |
|           +-- Quick Summary view                 App.tsx:458-554
|           |     +-- 4 stat cards: Rows, Columns, Insights, Processing Time
|           |     +-- h3 "AI-Generated Insights" -> InsightCard grid
|           |     +-- h3 "Recommended Visualizations" -> SmartChart list
|           |     |     +-- each SmartChart: h3 title, summary, chart,
|           |     |         sr-only data table, sonification controls
|           |     +-- h3 "Column Statistics" -> 7 column table
|           |
|           +-- Analytics Workspace view           AnalyticsWorkspace.tsx
|                 +-- TABLIST 3 "Analytics sections"  :728
|                 |     +-- Data Overview
|                 |     +-- Visualize
|                 |     +-- Preprocess
|                 |     +-- Statistics
|                 |     +-- Analytics        (static content only)
|                 |     +-- ML Models        (static content only)
|                 |
|                 +-- Data Overview  :776   4 stat cards, column table,
|                 |                         3 canned recommendation cards
|                 +-- Visualize      :893   column checkboxes | 8 chart types |
|                 |                         title field, run button, result
|                 +-- Preprocess     :1061  10 operations | column checkboxes,
|                 |                         data quality list, result
|                 +-- Statistics     :1210  column chips, recommended tests,
|                 |                         17 tests by category, details, result
|                 +-- Analytics      :1450  4 method cards, 4 tool cards,
|                 |                         2 reference lists.  NO BEHAVIOUR
|                 +-- ML Models      :1560  7 model cards, 5 step diagram,
|                                           metrics reference.  NO BEHAVIOUR
|
+-- footer                                        App.tsx:604-628   role=contentinfo
      +-- logo + "PRISM"
      +-- "ISO 27001" | "WCAG 2.2 AAA" | "Zero Data Exfiltration"
      +-- copyright line
```

### 1.2 Navigation depth

A user who wants to run a t-test traverses four levels, three of which are tab
bars:

```
Level 0   the page
Level 1   mode tabs         Single File / Link Datasets
Level 2   results tabs      Quick Summary / Analytics Workspace
Level 3   workspace tabs    Overview / Visualize / Preprocess / Statistics / ...
Level 4   within Statistics select columns, then select a test, then run
```

Three tab bars, each with a different visual treatment of the same idea, none of
which can be reached by URL, none of which survive a refresh.

---

## 2. What is wrong with it

### P1. Three tab bars are three answers to three different questions, styled as one thing

Level 1 answers "how many files". Level 2 answers "how much detail". Level 3
answers "what am I doing". These are genuinely different axes, and presenting all
three as gradient-filled pill tabs teaches the user that a tab means nothing in
particular. By level 3 the user cannot predict whether pressing a tab changes the
data, the depth, or the tool.

### P2. Quick Summary and Data Overview are the same page

| Quick Summary (`App.tsx:458`) | Data Overview (`AnalyticsWorkspace.tsx:784`) |
| --- | --- |
| Stat cards: Rows, Columns, Insights, Processing Time | Stat cards: Total Rows, Total Columns, Numeric Columns, Categorical Columns |
| "Column Statistics" table: Column, Type, Count, Nulls, Unique, Mean, Std Dev | "Column Details" table: Column, Type, Unique, Missing, Mean, Std Dev |
| "AI-Generated Insights" cards | "Quick Insights" recommendation cards |

Two tables of the same data with different column sets and different labels for
the same concept (`Nulls` versus `Missing`). A user who switches views to find
something and lands on a near-identical screen learns that the navigation does
not mean anything.

### P3. The workspace tab order contradicts the workflow

`TAB_ORDER` at `AnalyticsWorkspace.tsx:192` is
`overview, visualize, preprocess, statistics, analytics, models`.

The actual analytical sequence is: look at the data, clean it, then analyse it,
then draw it. Preprocess sits *after* Visualize, so the default left to right
reading order tells the user to chart data before cleaning it. Compounding this,
preprocessing results are not applied to any later step
(`AnalyticsWorkspace.tsx:658`, and see `USER_FLOWS.md` section 9), so a user
following the tabs in order gets charts from raw data, then cleans the data, then
gets statistics from raw data again.

### P4. Two of the six tabs are documentation wearing a tool's clothes

Analytics (`:1458`) and ML Models (`:1568`) contain reference material: what
descriptive analytics is, what RMSE means, a five step diagram of how one would
build a model. It is not bad content. It is in the wrong place. It sits in a
navigation whose other four entries do work, and it carries fifteen buttons that
do nothing (`:1502`, `:1522`, `:1610`).

### P5. Nothing is addressable and nothing survives a refresh

There is no router. There is no `location.hash` handling. Nothing is written to
`localStorage`, `sessionStorage` or IndexedDB anywhere in `src/`. Consequences:

- A user cannot send a colleague a link to "the Statistics tab".
- Browser Back does not go back. It leaves the application.
- A refresh discards the file, the results, the datasets, the links, the tab
  position and the accessibility settings.
- The font size and theme a user sets in the header are lost on every reload.

The data must not persist. That is the product. **The preferences and the
navigation position are not data and there is no reason to discard them.**

### P6. The results-view tab bar is a broken ARIA tabs pattern

`App.tsx:425-456`. Both buttons carry `role="tab"` and `aria-selected`, but
neither has an `id` or `aria-controls`, and neither of the two views is marked
`role="tabpanel"`. A screen reader is told "tab, selected, 1 of 2" and then given
no relationship to any panel. The mode tab bar at level 1 does this correctly
(`App.tsx:207-282` with panels at `:285` and `:300`), so the codebase contains
both the right pattern and the wrong one.

Neither of the two `App.tsx` tab bars implements arrow key navigation or roving
`tabIndex`. The workspace tab bar does implement both
(`AnalyticsWorkspace.tsx:688-716` and `:234`), so keyboard behaviour changes
depending on which of the three tab bars has focus.

### P7. The heading outline is flat

The document has one `h1` ("PRISM", `App.tsx:161`), one `h2` which is `sr-only`
("Data Analysis Dashboard", `App.tsx:218`), and then a long flat run of `h3`
elements: the hero, "Analysis Complete", "AI-Generated Insights", "Recommended
Visualizations", "Column Statistics", every `SmartChart` title
(`SmartChart.tsx:531`), "Dataset Manager", and every workspace panel section.

A screen reader user navigating by heading gets one unhelpful `h2` and then a
flat list in which a chart's title and the section containing charts are the same
level. There is no structural signal for "you are now in the results" or "you are
now in the workspace".

### P8. Labels are inconsistent across the surfaces that share concepts

| Concept | Label A | Label B | Label C |
| --- | --- | --- | --- |
| Null cells | "Nulls" (`App.tsx:546`) | "Missing" (`AnalyticsWorkspace.tsx:831`) | "missing" (`:1157`) |
| Loading a file | "Upload" (hero, `App.tsx:255`) | "Add datasets" (`DatasetManager.tsx:423`) | "Select File" (`FileUploader.tsx:242`) |
| Starting over | "New Analysis" (`App.tsx:419`) | "Try again with a different file" (`App.tsx:373`) | both call `clearFile` |
| The analysis surface | "Analytics Workspace" (`App.tsx:452`) | "Analytics" tab inside it (`:759`) | |

"Upload" is the most damaging of these. PRISM's entire positioning is that
nothing is uploaded, and the product's primary verb is "upload".

---

## 3. The organising principle the current IA lacks

Every screen in PRISM answers one of exactly four questions, and the current
navigation does not separate them:

1. **Can I trust this?** (before any data)
2. **What is in my file?** (structure, quality, shape)
3. **What can I learn from it?** (charts, tests, transforms)
4. **How do I get the answer out?** (export, which does not exist)

The proposal in section 4 maps the navigation onto those four questions and
nothing else.

---

## 4. Proposed information architecture

```
PRISM
|
+-- header (persistent)
|     +-- PRISM wordmark                       -> home, and reset if data loaded
|     +-- Engine status line                   -> the CDN disclosure, ONBOARDING.md s6
|     +-- Verify                               -> verification panel, ONBOARDING.md s8
|     +-- Display                              -> theme, text size, contrast, motion,
|                                                 sonification, in one popover
|
+-- 1. START  (no data loaded)                 Question: can I trust this?
|     +-- Headline + subhead
|     +-- Try a sample file            (primary)
|     +-- Open your own file           (primary, equal weight)
|     |     +-- one file       (default)
|     |     +-- several files  (progressive: revealed when a second file is added)
|     +-- Check it yourself            (link into the verification panel)
|     +-- Prove it offline             (the connection box, ONBOARDING.md s7)
|
+-- 2. DATA  (file loaded)                     Question: what is in my file?
|     +-- Source strip (persistent once loaded, see 5.2)
|     |     file name | sheet | rows | columns | [change file] [clear]
|     +-- Columns            table, one row per column, type, missing, unique,
|     |                      distribution sparkline, and a select control
|     +-- Quality            missing values, duplicates, type ambiguity,
|     |                      anything detected that would change an answer
|     +-- Clean              the ten preprocessing operations, WITH an explicit
|                            applied state and an undo
|
+-- 3. ANALYZE (file loaded)                   Question: what can I learn?
|     +-- Charts             column selection, chart type, the truncation notice
|     +-- Tests              variable selection, recommended tests, all tests,
|                            result with interpretation and assumptions
|
+-- 4. EXPORT  (results exist)                 Question: how do I get it out?
|     +-- Statistics as CSV
|     +-- Chart as PNG
|     +-- Session as JSON        (the workpaper: inputs, outputs, truncations)
|     +-- Printable report
|
+-- REFERENCE  (footer link, not a tab)
      +-- Which test should I use
      +-- What the automated checks look for
      +-- What PRISM does not do          <- the non-goals, stated to the user
```

### 4.1 What changed and why

| Change | Reason |
| --- | --- |
| Three tab bars become one primary nav of four sections | One axis, one control. Sections map to the four questions in section 3 |
| Quick Summary and Data Overview merge into **Data** | They were the same page (P2) |
| Clean moves ahead of Charts and Tests | Matches the real workflow and stops the tab order from recommending a wrong sequence (P3) |
| Analytics and ML Models leave the navigation entirely | They are reference, not tools (P4). Their genuinely useful content moves to **Reference** and the fifteen dead buttons are deleted, not disabled |
| **Export** becomes a first class section | It is the missing half of the job (`USER_FLOWS.md` section 8) and it earns a nav slot the moment it exists |
| Single file and multi file stop being a mode chosen up front | Asking "how many files" before the user has any file is asking them to make a decision they cannot yet have an opinion about. Adding a second file is the action that reveals joining |
| Accessibility controls consolidate into one popover | Today there are two controls in the header for six settings in the type, four of which have no UI at all (`prismStore.ts:33-39`) |
| A persistent source strip | The user should never have to remember which file, and once a sheet chooser exists, which sheet |

### 4.2 What deliberately stays out

- **No dashboard.** PRISM analyses one dataset at a time in a tab. A saved,
  arranged, refreshing dashboard is a different product and it needs a server.
- **No project or workspace concept.** Nothing persists by design. A "recent
  files" list would be a list of file names, which is metadata about sensitive
  files, stored on disk. Do not build it.
- **No settings page.** Six preferences fit in a popover.
- **No onboarding tour or coach marks.** The product must be legible without a
  narrator. A tour is what you build when the IA failed.

---

## 5. Navigation model

### 5.1 Primary navigation

A single horizontal bar directly under the header, four items, with a disabled
state that explains itself rather than going grey and silent:

```
[ Start ]   [ Data ]   [ Analyze ]   [ Export ]
```

- **Start** is always available. Selecting it with data loaded does not clear the
  data; it shows the start content with the source strip still visible.
- **Data** and **Analyze** are unavailable with no file. Their unavailable state
  reads "Open a file first", not a grey pill.
- **Export** is unavailable until results exist. Its unavailable state reads
  "Run an analysis first".

Implemented with the ARIA tabs pattern once, correctly, in one component:
`role="tablist"`, each tab with an `id` and `aria-controls`, each panel with
`role="tabpanel"` and `aria-labelledby`, roving `tabIndex`, arrow and Home and
End keys. The existing implementation at `AnalyticsWorkspace.tsx:688-716` and
`:226-246` is correct and should be extracted into a shared `Tabs` component so
there is exactly one implementation in the codebase rather than three.

### 5.2 The source strip

Persistent below the primary nav whenever a file is loaded. It answers "what am I
looking at", which today requires remembering.

```
 sales_2025.xlsx  ·  Sheet: Q4 Detail  ·  48,210 rows  ·  17 columns    [change] [clear]
```

- The sheet segment appears only for workbooks, and exists only once the sheet
  chooser proposed in `USER_FLOWS.md` section 4.3 is built. Until then, the strip
  must say **"Sheet 1 of n"** so the current first-sheet-only behaviour is at
  least visible.
- `clear` is the only control that destroys data, and it confirms.
- `change` swaps the file and keeps the warm runtime, unlike today's `clearFile`
  (`prismStore.ts:331`).

### 5.3 Secondary navigation

Within **Data** and **Analyze**, sub-sections are a segmented control, visually
distinct from the primary bar. Different level, different treatment. That is the
fix for P1: a user should be able to tell the level of a control by looking at
it.

### 5.4 Tertiary

Within a sub-section, there is no further navigation. If a screen needs a fourth
level, it is two screens.

---

## 6. Labels

One name per concept, everywhere.

| Concept | Current labels | Proposed | Why |
| --- | --- | --- | --- |
| Bringing a file in | Upload / Add datasets / Select File | **Open** | "Upload" contradicts the product's core claim. "Open" is what a desktop application does, which is the mental model we want |
| The drop area | "Drag & drop your data file" | "Drop a file here, or browse" | Shorter, and "browse" names the alternative |
| Empty cells | Nulls / Missing / missing | **Missing** | Plain English. "Null" is a database word |
| Starting over | New Analysis / Try again with a different file | **Change file** and **Clear everything** | Two different actions were sharing one implementation. Separate them |
| The analysis surface | Analytics Workspace | **Analyze** | Verb, matches the other nav items |
| Derived observations | AI-Generated Insights / Quick Insights | **Automated checks** | There is no model. `prism_core.py` imports pandas and numpy |
| Statistical procedures | Statistical Tests | **Tests** | In context, unambiguous |
| Data transforms | Preprocessing | **Clean** | "Preprocessing" is a pipeline word. The user is cleaning data |
| The security banner | Zero-Trust Mode Active | **Analysis engine: ready** | Says a true thing instead of misusing a term of art |
| Chart data volume | "n data points" | "Showing n of N rows" | The current label states the truncated count as if it were the whole |

---

## 7. Addressability and persistence

### 7.1 URL

Adopt hash routing. It needs no server configuration, works on static hosting,
and adds no dependency the CSP has to accommodate.

```
#/start
#/data/columns
#/data/quality
#/data/clean
#/analyze/charts
#/analyze/tests
#/export
#/verify            (opens the verification panel over whatever is beneath)
```

The URL carries **position only**. It never carries a column name, a file name, a
value, a filter, or anything derived from the user's data. A URL is the single
most likely thing a user pastes into a chat window, and PRISM must never let a
paste leak a column name.

Effects:

- Back and Forward work.
- A colleague can be sent "open PRISM and go to #/analyze/tests".
- A refresh lands on the same section, with the file gone and an honest empty
  state explaining why (see 8.1).

### 7.2 Persistence rules

Three tiers, and the boundary is the whole product.

| Tier | Contents | Storage | Survives refresh | Survives tab close |
| --- | --- | --- | --- | --- |
| **Never stored** | File bytes, parsed content, column names, values, statistics, results, chart data, dataset contents, join keys | Memory only | No | No |
| **Session only** | Current section, selected columns, selected chart type, selected test | Memory, or `sessionStorage` if a refresh-survival case is made | Optional | No |
| **Stored** | Theme, text size, contrast, reduced motion, sonification, "I have seen the verification panel" | `localStorage` | Yes | Yes |

The "never stored" tier is not a preference. It is the product, and it should be
enforced by a test that fails if anything from that tier appears in any storage
API, not by reviewer discipline.

The stored tier is six booleans and two enums. Storing them costs nothing and
fixes the current behaviour where a user who needs 150 percent text size has to
set it again on every visit (`prismStore.ts:33-39`, and `App.tsx:136-150` applies
but never saves).

One rule for the stored tier: it must be visible and clearable. A line in the
Display popover reading "PRISM remembers your display settings on this device.
[Forget them]" costs one control and removes any surprise.

---

## 8. State inventory per surface

Every screen needs four states specified, and today most have one.

### 8.1 Empty states

| Surface | Today | Proposed |
| --- | --- | --- |
| Start, no file | Hero, tabs, dropzone, feature grid | Hero, sample, open, verify, offline box |
| Data, no file | Not reachable | "No file open. [Open a file] or [Try the sample]" |
| Analyze, no file | Not reachable | Same, with "Analysis needs a file first" |
| Export, no results | Does not exist | "Nothing to export yet. Run an analysis" |
| Datasets list, none added | Nothing rendered (`DatasetManager.tsx:433`) | "No files added yet. Drop one above" |
| Links list, none | Nothing rendered (`:462`) | Explain what a link does and what it needs (two files, a shared column) |
| Charts, no columns selected | Suggestion box says "Select columns to get visualization recommendations" only after a selection exists (`:1019`) | Show guidance before selection, not after |
| Test results, none run | Nothing rendered | "Pick your variables, then a test" |
| **After a refresh** | Blank start screen, no explanation | "Your data was cleared when the page reloaded. PRISM never stores it. [Open a file]" |

That last row is important and is currently a silent failure. Because nothing
persists, a refresh looks identical to a first visit, and the user is left
wondering whether they imagined the analysis. Naming it turns a confusing loss
into a demonstration of the core claim.

### 8.2 Loading states

Two distinct waits exist and the UI conflates them (`USER_FLOWS.md` section 5.1).

| Wait | Where it belongs | Copy |
| --- | --- | --- |
| Engine download, once per session | Header status line, never blocking | "Analysis engine: downloading. First visit only." |
| Analysis of the user's data | In place, in the section that triggered it | "Analyzing 48,210 rows..." |

The engine wait must never render as a progress bar inside the analysis flow,
because a bar that reaches 100 percent and then restarts at 20 is worse than no
bar. See `USER_FLOWS.md` defect F3-a.

### 8.3 Error states

One component, one contract, per `USER_FLOWS.md` section 7.3. It renders inline
in the section that failed, never in a region that can unmount, which is the bug
at `App.tsx:238` to `:399`.

### 8.4 Partial and degraded states

The state nobody specified and the one PRISM most needs, because truncation is
everywhere in the worker (`worker:1003`, `:1014`, `:1026`, `:1038`, `:1053`,
`:1060`, `:1072`, `:1087`).

Every surface built on a subset of the data renders a notice in the same visual
language, adjacent to the result and not in a footnote:

```
 !  Showing the first 500 of 1,284,309 rows, in file order.
    This is not a random sample. [Why?]
```

This is an IA requirement, not a copy preference: **a partial result is a
different kind of object from a complete one and the interface must have a place
to say so.** If there is no slot for that notice, the notice will not get
written, and the product will keep presenting subsets as totals.

---

## 9. Landmark and heading map

### 9.1 Landmarks

Present today: `banner` (`App.tsx:162`), `main` (`App.tsx:211`), `contentinfo`
(`App.tsx:606`). Two skip links exist (`index.html:123-124`), one of which points
at `#file-upload`, an id that only exists while no results are loaded
(`App.tsx:240`). After an analysis, the second skip link points at nothing.

Proposed:

| Landmark | Element | Label |
| --- | --- | --- |
| `banner` | header | |
| `navigation` | primary nav | "Sections" |
| `main` | main | |
| `complementary` | verification panel | "Verify PRISM" |
| `contentinfo` | footer | |

Skip links become: "Skip to main content" and "Skip to section navigation". Both
targets exist in every state, which is the fix for the dangling `#file-upload`.

### 9.2 Heading outline

Proposed, replacing the flat run described in P7:

```
h1  PRISM                                   (visible in the header)
  h2  Start | Data | Analyze | Export       (the active section, visible)
    h3  Columns | Quality | Clean | Charts | Tests    (sub-section)
      h4  individual chart title, individual test result, individual card
```

Rules:

- Exactly one `h1`, and it is visible. The current `sr-only` `h2` at
  `App.tsx:218` is a workaround for a missing visible structure and goes away.
- A `SmartChart` title becomes `h4`, not `h3` (`SmartChart.tsx:531`), so it nests
  under the section containing it instead of sitting beside it.
- No level is skipped. A screen reader user navigating by heading gets the same
  outline as the sighted user gets from the navigation, which is the point of a
  heading outline.

### 9.3 Live regions

Currently six live regions exist or are implied: the file uploader's sr-only
status (`FileUploader.tsx:246`), the security banner marked `role="status"`
(`App.tsx:225`), the progress card (`App.tsx:324`), and three result panels in
the workspace (`:1027`, `:1175`, `:1395`).

Two problems:

- The security banner is static content marked as a live region. A `role="status"`
  on text that never changes gives screen readers a reason to announce a marketing
  sentence. It should be a plain element.
- The progress card announces the visible message, the percentage and an `sr-only`
  `accessibleMessage` on every update (`App.tsx:325-353`). Three overlapping
  announcements per progress tick.

Proposed rule: **one polite live region for status, one assertive for errors, per
section.** Everything else is static.

---

## 10. Responsive behaviour

Nothing in the current code targets a small screen beyond Tailwind's default
breakpoints, and two pieces of structure will not survive one.

| Element | Problem at narrow width | Proposed |
| --- | --- | --- |
| Workspace tab bar, six items | `AnalyticsWorkspace.tsx:244` hides every tab label below `sm`, leaving six unlabelled icons | Four primary items with labels always visible, wrapping to two rows if needed. An icon-only tab bar is a guessing game |
| Column statistics table, seven columns | Horizontal scroll inside `overflow-x-auto` (`App.tsx:539`) | Below the breakpoint, one card per column instead of one row per column |
| Visualize tab, three column grid | Columns, chart types and configuration stack into a long scroll with the run button far from the selection | Stack in the order selection, type, run, with the run control pinned |
| Chart plus sonification panel | Every chart carries an audio control row (`SmartChart.tsx:577`) | Sonification becomes opt in, per section 6 of `USER_FLOWS.md` |
| Header, two controls | Font select plus theme toggle | One "Display" popover, which also makes room for the four accessibility settings that currently have no UI |

Mobile is explicitly not a target for the first release. The requirement here is
narrower and achievable: **the product must not become unusable on a laptop at a
small window size or at 150 percent browser zoom**, both of which are ordinary
conditions for the target user and both of which are currently untested.

---

## 11. Migration order

The IA changes are large. This order keeps the product working at every step.

| Step | Change | Depends on |
| --- | --- | --- |
| 1 | Extract one correct `Tabs` component, replace all three tab bars with it | Nothing. Fixes P6 immediately |
| 2 | Delete the Analytics and ML Models tabs and their fifteen dead buttons | Nothing. Fixes P4 |
| 3 | Merge Quick Summary into the workspace Data Overview, drop the level 2 tab bar | 1. Fixes P2 and removes one of the three bars |
| 4 | Reorder to Data, Clean, Charts, Tests | 3. Fixes P3 |
| 5 | Add the persistent source strip | 3 |
| 6 | Add hash routing | 1 |
| 7 | Persist display preferences only | Nothing |
| 8 | Add the partial-result notice component and wire it to every truncation site | Worker returns the pre-truncation count |
| 9 | Add the Export section | Export exists |
| 10 | Rebuild Start per `ONBOARDING.md` | Removal of the unsupported claims |

Steps 1 and 2 are the highest ratio of credibility recovered to work done in the
entire document. Neither requires a design decision from anyone.
