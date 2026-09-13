# PRISM User Flows

Owner: UX architecture
Date written: 2026-09-13
Status: describes the code as it exists on branch `army/prism-upgrade` at the date above

## 0. Method and reading key

Every "as built" statement in this document was read out of the source tree, not
inferred from the README or from the technical design document. Files read in full:

| File | Lines | Why |
| --- | --- | --- |
| `src/App.tsx` | 637 | Top level flow, view switching, error surface, footer |
| `src/components/core/FileUploader/FileUploader.tsx` | 258 | Single file entry point |
| `src/components/core/DatasetManager/DatasetManager.tsx` | 505 | Multi dataset entry point |
| `src/components/analytics/AnalyticsWorkspace/AnalyticsWorkspace.tsx` | 1694 | Six tab analysis surface |
| `src/components/visualization/SmartChart/SmartChart.tsx` | 601 | Chart rendering and sonification |
| `src/components/visualization/InsightCard/InsightCard.tsx` | 121 | Insight presentation |
| `src/stores/prismStore.ts` | 777 | The actual state machine |
| `src/security/validator.ts` | 375 | What rejects a file and with what message |
| `src/workers/prism.worker.js` | 1683 | Progress messages, cold start, truncation |
| `index.html` | 147 | CSP, skip links, no script fallback |
| `src/styles/index.css` | 452 | Focus, touch target, high contrast rules |

Reading key used throughout:

- **AS BUILT** means verified in the source at the cited `file:line`.
- **DEFECT** means the flow as built produces an outcome the user did not ask for.
  Each one has a matching entry in `USABILITY_ISSUES.md`.
- **SHOULD BE** is a design proposal. It is not in the code.
- **NOT BUILT** means the flow does not exist at all. No stub, no dead button.

Nothing in this document asserts a compliance status, a performance number, or a
user count. Where a duration matters, the document says what governs it rather
than guessing a figure.

---

## 1. Flow inventory

There are five flows a user can start today and one they cannot.

| # | Flow | Entry point | Status |
| --- | --- | --- | --- |
| F1 | First run | Page load | AS BUILT, with a trust gap covered in `ONBOARDING.md` |
| F2 | Single file upload | `FileUploader` tab | AS BUILT |
| F3 | Analysis | Auto after F2, then two views | AS BUILT |
| F4 | Multi dataset link and analyse | `DatasetManager` tab | AS BUILT, fragile |
| F5 | Error recovery | Any failure | AS BUILT, partial |
| F6 | Export | None | **NOT BUILT** |

F6 is the largest single gap in the product. Section 8 covers it.

---

## 2. The state machine as built

The store is the real router. There is no URL router, no history, and no
persistence: `src/stores/prismStore.ts:237` creates a plain Zustand store and
nothing writes to `localStorage`, `sessionStorage` or IndexedDB anywhere in
`src/`.

Two booleans in `src/App.tsx` decide everything the user sees:

```
src/App.tsx:155  isProcessing = status is not 'idle' and not 'complete' and not 'error'
src/App.tsx:156  hasResults   = results.summary is not null
```

That gives four rendered states, not six:

```
                 hasResults = false            hasResults = true
             +---------------------------+---------------------------+
isProcessing |  A. Upload screen with    |  C. Results screen        |
  = false    |     hero, tabs, features  |     (progress card is     |
             |     Error block visible   |      not rendered here)   |
             |     here and only here    |     Error block NOT       |
             |                           |     rendered here         |
             +---------------------------+---------------------------+
isProcessing |  B. Upload screen with    |  D. Unreachable in the    |
  = true     |     progress card below   |     single file flow;     |
             |     the dropzone          |     reachable from the    |
             |                           |     Workspace             |
             +---------------------------+---------------------------+
```

The important structural fact: the error block lives inside the
`{!hasResults && (...)}` branch that opens at `src/App.tsx:238` and closes before
`src/App.tsx:399`. **Once a first analysis has succeeded, the application level
error surface is gone for the rest of the session.** Every later failure has to
be reported by whichever child component happens to own it, and the
`DatasetManager` owns none.

### Underlying processing statuses

The store's `ProcessingProgress.status` takes more values than the UI
distinguishes: `idle`, `validating`, `parsing`, `analyzing`, `generating-insights`,
`complete`, `error`. The UI collapses the five working states into one spinner
and one percentage, so the progress card tells the user a number but never tells
them which of two very different things is happening: downloading a Python
runtime, or computing over their rows. Those have different expectations attached
and only one of them recurs per session.

---

## 3. F1: First run

### 3.1 As built, in order

1. `index.html` ships with `class="dark"` hardcoded on `<html>` (`index.html:2`)
   and a critical inline stylesheet, so the page paints dark before React runs.
2. `index.html:129` renders "Loading PRISM Analytics Engine..." inside the root.
3. `src/main.tsx:13` mounts `App` in `React.StrictMode`.
4. Importing the store runs `warmUpWorker()` at module scope
   (`src/stores/prismStore.ts:231`). This creates the Web Worker and posts `INIT`
   before the user has done anything.
5. The worker calls `fetch` against `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`, pinned by a
   SHA-384 digest (`src/workers/prism.worker.js:22`, `:33`, `:1244`), then
   `loadPyodide()`, then `loadPackage(['pandas', 'numpy'])` (`:1355`).
6. The user sees: a header, a green banner reading "Zero-Trust Mode Active"
   (`src/App.tsx:231`), a hero, two mode tabs, a dropzone, and a three card
   feature grid whose third card reads "WCAG 2.2 AAA compliant"
   (`src/App.tsx:386`).
7. The footer asserts "ISO 27001", "WCAG 2.2 AAA" and "Zero Data Exfiltration"
   (`src/App.tsx:619` to `:624`).

### 3.2 Defects in F1

- **DEFECT F1-a. The warm up is invisible and the progress it emits is
  orphaned.** `warmUpWorker` deliberately attaches no `onmessage` handler
  (`src/stores/prismStore.ts:197` to `:216`). The worker's `INIT` progress
  messages therefore land nowhere until some later action installs a handler. A
  user who arrives on a cold cache has a multi megabyte runtime download running
  with zero indication, and no way to know whether waiting before dropping a file
  would help.

- **DEFECT F1-b. The orphaned progress can later hijack a real analysis.**
  `processData` installs `prismWorker.onmessage` at `src/stores/prismStore.ts:369`.
  If the warm up is still in flight at that moment, the warm up's remaining
  `PROGRESS` messages are delivered to the analysis handler. The last one carries
  `status: 'complete'`, `progress: 100`, `message: 'Ready for analysis'`
  (`src/workers/prism.worker.js:1369` to `:1374`). At that instant `isProcessing`
  flips to false while `hasResults` is still false, so the progress card unmounts
  and the user is returned to the upload screen while their analysis is still
  running. The screen reader hears "System ready. You can now upload a file."
  in the middle of the file they already uploaded.

- **DEFECT F1-c. Two concurrent Pyodide initialisations are possible.**
  `initializePyodide` guards on `isInitialized`, which is only set at
  `src/workers/prism.worker.js:1367`, after everything has loaded. There is no
  in flight promise. A `PROCESS_FILE` that arrives while `INIT` is still running
  takes the `if (!pyodide || !isInitialized)` branch at `:1387` and starts a
  second full initialisation.

- **DEFECT F1-d. The theme control's first click does nothing visible.** The
  store's initial `colorScheme` is `'system'` (`src/stores/prismStore.ts:35`).
  The effect at `src/App.tsx:137` to `:144` only branches on `'dark'`, `'light'`
  and `'high-contrast'`, so `'system'` changes no class and `index.html:2` leaves
  the page dark. The toggle at `src/App.tsx:204` shows the moon icon and is
  labelled "Switch to dark mode" while the page is already dark. Clicking it sets
  `'dark'`, which adds a class that is already present. Nothing moves.

- **DEFECT F1-e. The first screen is entirely assertion.** Three of the four
  trust signals on the page are badges. Two of them name standards the repository
  cannot currently evidence. This is the subject of `ONBOARDING.md` and is not
  re-argued here.

### 3.3 SHOULD BE

```
T+0    Paint. Dark or light per the user's OS, not per a hardcoded class.
T+0    A single status line under the header, honest and specific:
         "Analysis engine: downloading (first visit only)."
         then "Analysis engine: ready. Nothing has been sent anywhere."
T+0    Below the dropzone, a "Try it without your data" control that loads a
       bundled sample file. See ONBOARDING.md section 5.
T+0    A "How to verify this yourself" control that opens the verification
       panel. See ONBOARDING.md section 8.
T+n    When the engine is ready, the status line changes and the sample
       button becomes the fastest path to a result.
```

Two rules for the first screen:

1. **No badge may claim a status the repository cannot evidence.** Replace with
   what is true and checkable. "Designed against" is honest. "Compliant" is not.
2. **Every claim on the first screen must have a control next to it that lets
   the user check the claim.** A claim with no check is decoration.

---

## 4. F2: Single file upload

### 4.1 As built

```
User drops or picks a file
  |
  v
react-dropzone filter               FileUploader.tsx:103-118
  accept: csv, xlsx, xls, xml
  maxSize: MAX_FILE_SIZE
  |
  +-- rejected ---> onDropRejected   FileUploader.tsx:81-93
  |                   sets a string into an sr-only live region ONLY
  |                   (FileUploader.tsx:246-253). Nothing visible appears.
  |                   FLOW ENDS SILENTLY for a sighted user.
  |
  v accepted
onFileSelect -> store.setFile        prismStore.ts:243
  |
  v
state reset, status 'validating', progress 10
  |
  v
validateFile(file)                   validator.ts:80
  1 size          10 bytes to MAX_FILE_SIZE
  2 extension     csv | xlsx | xls | xml
  3 mime type     with extension fallback
  4 magic bytes   xlsx and xml only
  5 content scan  csv and xml only, regex list at validator.ts:61-70
  |
  +-- invalid ---> error VALIDATION_ERROR, recoverable true
  |
  v valid
readFileContent(file)                prismStore.ts:144
  Excel -> XLSX.read, first sheet only, sheet_to_csv  prismStore.ts:111-136
  CSV or XML -> file.text()
  |
  v
status 'parsing', progress 30, then processData() runs automatically
```

### 4.2 Defects in F2

- **DEFECT F2-a. Rejection is silent for anyone who can see the screen.**
  `onDropRejected` writes only into the `sr-only` live region
  (`FileUploader.tsx:81-93` paired with `:246-253`). Drop a `.json`, a `.pdf`, or
  a file over the size limit and the page does not change. There is no toast, no
  inline message, no border colour that persists after the drag ends. The drag
  states at `FileUploader.tsx:125-134` are the only visible feedback and they
  disappear on drop.

- **DEFECT F2-b. The advertised maximum is not a considered product decision.**
  `FileUploader.tsx:220` renders "Max {MAX_FILE_SIZE / (1024 * 1024)}MB", which
  resolves from `src/security/validator.ts:20`. The doc comment directly above
  that constant says 50MB and the value is 500MB. Whatever the right answer is,
  the number a user is promised on the landing screen should not be an accident,
  and a limit that large on a browser only tool is a promise the tab may not be
  able to keep.

- **DEFECT F2-c. CSV and XML files are read twice.**
  `validateContentSecurity` calls `file.text()` at `validator.ts:156`, then
  `readFileContent` calls `file.text()` again at `prismStore.ts:155`. For the
  large files the UI advertises, that is two full reads before any analysis
  starts, both on the main thread.

- **DEFECT F2-d. The content scan rejects ordinary business data with a message
  that implies the user did something wrong.** `DANGEROUS_PATTERNS`
  (`validator.ts:61-70`) includes `/on\w+\s*=/i`. Any cell anywhere in the file
  containing a word starting with "on" followed by an equals sign matches. Text
  like `Onset = 3 days` in a clinical column, or `Reason = timeout` in a log
  export, is enough. The user is told "File contains potentially unsafe content
  and cannot be processed" (`validator.ts:169`), is not told which row, which
  column, or which pattern, and has no override. For an audit or eDiscovery user
  whose files routinely contain log text and URLs, this is a dead end.

- **DEFECT F2-e. Only the first worksheet of a workbook is ever read.**
  `prismStore.ts:118` takes `workbook.SheetNames[0]`. The user is never told a
  workbook had other sheets, never asked which one they meant, and the results
  screen shows the file name as though the whole file was analysed
  (`src/App.tsx:408`). This is the most likely way PRISM gives a confident wrong
  answer today.

- **DEFECT F2-f. Excel parsing blocks the main thread.** `XLSX.read` runs in
  `readWorkbookAsCsv` on the main thread (`prismStore.ts:111`). The row cap at
  `prismStore.ts:82` bounds it, but during the parse the page cannot repaint, so
  the progress card freezes at whatever it last showed.

### 4.3 SHOULD BE

1. Rejection becomes a visible, persistent, inline panel directly beneath the
   dropzone, mirroring the existing `alert-error` styling, and it says the three
   things a user needs: what was wrong, what the accepted set is, and one control
   that reopens the picker.
2. Multi sheet workbooks trigger a sheet chooser **before** analysis when the
   workbook has more than one non empty sheet. Default to the first, show the
   row and column count for each, and record the chosen sheet in the results
   header so the answer is attributable.
3. The content scan becomes advisory rather than fatal for CSV. When a pattern
   matches, report the row number and the matched pattern, render the offending
   cell as text, and offer "analyse anyway, treating all cells as inert text."
   The safety property PRISM actually needs is that cell content is never
   interpreted as markup, which `src/security/sanitizer.ts` already provides at
   render time. Blocking the file is the wrong lever.
4. One read of the file, not two. The scan runs over the text already read.
5. Move workbook parsing into the worker so the progress card keeps animating
   and the tab stays responsive.
6. The size limit becomes one agreed number, set in one place, shown in the UI,
   and paired with a sentence about what happens near it.

---

## 5. F3: Analysis and results

### 5.1 As built

`setFile` calls `processData()` automatically at `prismStore.ts:308`. There is no
confirm step and no preview. The user's next screen is either results or an
error.

Progress, as the user experiences it on a cold start:

```
main thread  10%  "Validating file..."             prismStore.ts:255
main thread  30%  "File validated successfully"    prismStore.ts:302
main thread  40%  "Starting analysis..."           prismStore.ts:360
worker       10%  "Downloading Python runtime..."  worker:1320   <-- goes backwards
worker       30%  "Starting verified runtime..."   worker:1340
worker       50%  "Loading analytics libraries..." worker:1350
worker       70%  "Preparing analytics engine..."  worker:1360
worker      100%  "Ready for analysis"             worker:1372   <-- unmounts the card
worker       20%  "Parsing file data..."           worker:1394   <-- goes backwards again
worker       50%  "Running statistical analysis..." worker:1409
worker       80%  "Generating insights..."         worker:1424
worker      100%  "Analysis complete"              worker:1439
```

On success the user lands on **Quick Summary**, with a second view available:

**Quick Summary** (`src/App.tsx:458` to `:554`)
- Four stat cards: Rows, Columns, Insights, Processing Time
- "AI-Generated Insights" section of `InsightCard`s
- "Recommended Visualizations" section of `SmartChart`s
- "Column Statistics" table

**Analytics Workspace** (`AnalyticsWorkspace.tsx`, six tabs)
- Data Overview: summary stats, column table, three canned recommendation cards
- Visualize: column checkboxes, eight chart types, a title field, a run button
- Preprocess: ten operations, column checkboxes, a data quality list
- Statistics: column chips, recommended tests, seventeen listed tests, results
- Analytics: **entirely static**. Four method cards each with a "Run Analysis"
  button that has no `onClick` (`AnalyticsWorkspace.tsx:1502`), four "Business
  Analysis Tools" buttons with no `onClick` (`:1522`), and two reference lists.
- ML Models: **entirely static**. Seven model cards each with a "Configure
  Model" button that has no `onClick` (`:1610`), a five step diagram, and a
  metrics reference table.

### 5.2 Defects in F3

- **DEFECT F3-a. The progress bar moves backwards twice on a cold start** and
  reaches 100 percent once before any analysis has begun. See the trace above.

- **DEFECT F3-b. Fifteen buttons do nothing.** Four at
  `AnalyticsWorkspace.tsx:1502`, four at `:1522`, seven at `:1610`. They are
  styled identically to the working buttons on the neighbouring tabs. A user who
  clicks "Run Analysis" on the Analytics tab gets no spinner, no error, no
  change. This is the fastest way to destroy confidence in a tool whose pitch is
  that you can trust what it tells you.

- **DEFECT F3-c. The charts report a data point count that is not the data point
  count.** `SmartChart.tsx:538` renders `{config.data.length} data points`. The
  worker truncates before the chart is built: value counts to 10
  (`worker:1003`), bar categories to 15 (`:1014` and `:1026`), line and preview
  series to 100 (`:1038`, `:1053`, `:1072`, `:1087`), scatter to 500 (`:1060`),
  all with `head(n)` rather than a sample. So a two million row scatter renders the
  first 500 rows in file order and the caption says "500 data points". The user
  is not told the chart is partial, is not told the selection is positional
  rather than random, and the accessible summary at `SmartChart.tsx:99` computes
  its min, max, average and trend over the truncated set and states them as facts
  about the data.

- **DEFECT F3-d. "AI-Generated Insights" is not accurate and the confidence
  meter is fabricated precision.** `src/python/prism_core.py` imports `pandas`,
  `numpy`, `json`, `io`, `typing`, `dataclasses`, `enum` and `uuid`. There is no
  model. The confidence values rendered as a gradient bar and a percentage by
  `InsightCard.tsx:99` to `:107` are hardcoded literals in the worker
  (`worker:284`, `:290`, `:297`, `:303`, `:325`, `:349`). Presenting a constant
  as "100% confidence" on a screen whose whole purpose is credibility is a
  self inflicted wound.

- **DEFECT F3-e. "Processing Time" is given headline weight and excludes the
  wait.** `src/App.tsx:477` puts it in the same four card row as row count. It is
  measured inside Python (`prism_core.py:570` imports `time`), so after a cold
  start that made the user wait for a large runtime download, the card will read
  a small number of milliseconds. The card is simultaneously the least useful and
  the most likely to be disbelieved.

- **DEFECT F3-f. Focus is dropped at every view change.** When analysis
  completes, the `{!hasResults}` branch unmounts and the results branch mounts.
  Focus was on the dropzone or the Select File button, both of which are now
  gone, so focus falls to `<body>`. Nothing announces the change. The same
  happens in reverse on "New Analysis". There is no `useEffect` anywhere in
  `src/App.tsx` that moves focus.

- **DEFECT F3-g. Column selection is one piece of state with three meanings.**
  `selectedColumns` (`AnalyticsWorkspace.tsx:289`) is written by the Visualize
  checkboxes (`:926`), the Preprocess checkboxes (`:1141`) and the Statistics
  chips (`:1233`). On Visualize it means "chart these". On Preprocess it means
  "apply these transforms to these columns, or all columns if empty". On
  Statistics it means "these are the variables in the hypothesis". Switching tabs
  silently carries a selection made for a different purpose into a context where
  it means something else.

- **DEFECT F3-h. The chart title field is unlabelled and inert.**
  `AnalyticsWorkspace.tsx:978` is a `<label>` with no `htmlFor` that does not
  wrap the input at `:971`, so the input has no accessible name. Its value is
  never read: `handleCreateVisualization` at `:634` sends only `chartType` and
  `columns`. Typing a title has no effect on anything.

- **DEFECT F3-i. Missing input validation is reported with `window.alert`.**
  `AnalyticsWorkspace.tsx:610`, `:636` and `:660`. A native modal, inconsistent
  with the inline error styling used for every other failure in the same
  component, and it blocks the thread.

- **DEFECT F3-j. Sonification is on by default with no control to turn it off.**
  `enableSonification` defaults to true (`SmartChart.tsx:293`) and `App.tsx:519`
  passes `accessibility.sonificationEnabled`, which initialises to `true`
  (`prismStore.ts:37`). Nothing in the UI ever calls `setAccessibility` with
  `sonificationEnabled`. Every chart therefore carries an audio control panel
  that most users will never want, taking vertical space on every single chart.

### 5.3 SHOULD BE

1. **Truncation becomes visible and honest.** Every chart built from a subset
   carries a line stating the rule that produced it, in plain words: "Showing the
   first 500 of 1,284,309 rows in file order. This chart is not a random sample."
   Where a chart is misleading without the full data, refuse to draw it and say
   why rather than drawing a confident wrong picture.
2. **Delete the two static tabs or gate them.** Either remove Analytics and ML
   Models entirely until they do something, or move them behind an explicitly
   labelled "Planned" state with the buttons removed, not disabled. A disabled
   button still promises. A removed button promises nothing.
3. **Rename "AI-Generated Insights" to "Automated checks"** and either remove
   the confidence meter or replace it with the rule that fired. "Two numeric
   columns detected" is a better sentence than "100% confidence".
4. **Progress becomes two tracked things, not one number.** A runtime line that
   appears only when the runtime is loading, and an analysis line that starts at
   zero when the data reaches Python. Never let either go backwards.
5. **Focus moves deliberately.** On completion, move focus to the results
   heading and announce the transition once. On reset, move focus back to the
   dropzone.
6. **Split column selection per purpose**, or make the shared selection explicit
   with a persistent bar reading "3 columns selected" and a clear control, so the
   carry over is at least visible.
7. **Replace `alert` with the inline error panel** that the same component
   already uses for run failures.
8. **Sonification becomes opt in per chart**, with a single global preference in
   the header's accessibility controls.

---

## 6. F4: Multi dataset link and analyse

### 6.1 As built

```
"Link Datasets" tab -> DatasetManager
  |
  v
Drop one or more files into the add zone   DatasetManager.tsx:366-375
  accept: csv, xlsx, xls  (NOTE: no xml, unlike the single file flow)
  no onDropRejected, no multiple:false, no aria label, no role
  |
  v
onDrop sets isUploading true, then awaits addDataset per file  :358-364
  |
  v
addDataset validates, reads content, then derives columns by
splitting the FIRST LINE on commas                    prismStore.ts:499-504
and derives rowCount by counting non blank lines      prismStore.ts:504
  |
  v
DatasetCard per dataset, first four column names shown
  |
  v
With two or more datasets, "Link Datasets" opens LinkBuilder  :453-459
  pick left dataset, right dataset, left column, right column, join type
  |
  v
"Analyze N Datasets" -> processLinkedDatasets  prismStore.ts:577
  worker merges, then runs the same analysis pipeline
  |
  v
Results appear in the SAME results screen as F3
```

### 6.2 Defects in F4

- **DEFECT F4-a. A single bad file locks the upload zone for the rest of the
  session.** `onDrop` at `DatasetManager.tsx:358` has no `try`/`catch`. If
  `addDataset` rejects, `setIsUploading(false)` at `:363` never runs, `isUploading`
  stays true, and the dropzone's `disabled` at `:374` stays true forever. There
  are at least three live throw paths into that rejection: `'File is empty'`
  (`prismStore.ts:501`), `'Excel file has no sheets'` (`prismStore.ts:120`), and
  `'Could not read sheet'` (`prismStore.ts:124`). Recovery requires a page
  reload, which discards every other dataset the user already added.

- **DEFECT F4-b. Rejected files vanish with no feedback at all.** There is no
  `onDropRejected` in the `DatasetManager` dropzone config (`:366-375`). Drop a
  `.pdf` or an oversized file and nothing happens: no message, no announcement,
  not even the sr-only one the `FileUploader` at least provides.

- **DEFECT F4-c. Validation failures set an error the component never shows.**
  `addDataset` writes `error` into the store on an invalid file
  (`prismStore.ts:485-492`) and returns. `DatasetManager` never subscribes to
  `error`. The application level error block does render for this tab because it
  sits inside the same `{!hasResults}` section, but the component that caused the
  failure gives no local signal, and after a first successful analysis that
  application level block is gone entirely (section 2).

- **DEFECT F4-d. The accepted format set differs between the two upload paths.**
  `FileUploader.tsx:106-112` accepts XML. `DatasetManager.tsx:368-372` does not.
  Nothing in the UI explains why switching a tab changes which files are allowed.

- **DEFECT F4-e. Column detection is a naive comma split.**
  `prismStore.ts:503` splits the first line on `,` and strips surrounding quotes.
  Any quoted header containing a comma produces phantom columns, which then
  appear in the join builder's dropdowns as selectable keys. The user picks a
  join key that does not exist and finds out at merge time.

- **DEFECT F4-f. The add zone is not reachable or describable for assistive
  technology.** Unlike `FileUploader`, the `DatasetManager` root has no `role`,
  no `aria-label`, no `aria-describedby` and no visible label bound to the input
  (`:406-430`).

- **DEFECT F4-g. Nothing validates the join before it runs.** `LinkBuilder`
  (`:129-141`) requires only that four dropdowns are non empty. It does not check
  that the two chosen columns share a type, does not warn on a many to many join,
  and does not preview the resulting row count. The user's first signal that the
  join was wrong is a result screen with an unexpected row count, or a failure.

- **DEFECT F4-h. Removing a dataset silently removes its links.**
  `removeDataset` (`prismStore.ts:526-537`) filters `datasetLinks` too. No
  confirmation, no undo, no mention in the UI that links were destroyed.

### 6.3 SHOULD BE

1. Wrap the per file loop in `try`/`finally` so `isUploading` always clears, and
   report per file outcomes as a list: each file either becomes a card or becomes
   a row in a "could not add" list with its reason and a retry control.
2. Add `onDropRejected` with the same visible inline panel specified in 4.3.
3. Accept the same formats in both paths, or state the difference where the user
   will read it.
4. Parse headers with the same parser that will later read the data. A header row
   is a CSV row and deserves a CSV parser.
5. Validate the join before enabling "Create Link": same or compatible types,
   a preview of key overlap, and a warning when either side's key is not unique.
6. Confirm destructive removal when links exist, and name what will be lost.

---

## 7. F5: Error recovery

### 7.1 As built

Four distinct failure surfaces exist, and they do not agree with each other.

| Surface | Where | Rendered as | Recovery offered |
| --- | --- | --- | --- |
| Application error | `src/App.tsx:357-380` | `alert-error` block with a red cross emoji | "Try again with a different file", which calls `clearFile` |
| Dropzone rejection | `FileUploader.tsx:81-93` | `sr-only` live region only | None |
| Workspace run failure | `AnalyticsWorkspace.tsx:1040`, `:1197`, `:1402` | Inline red panel per tab | None. No retry control |
| Missing selection | `AnalyticsWorkspace.tsx:610`, `:636`, `:660` | `window.alert` | Dismiss the modal |

### 7.2 Defects in F5

- **DEFECT F5-a. The only recovery action is also the most destructive one.**
  "Try again with a different file" calls `clearFile` (`src/App.tsx:372`), which
  calls `terminateWorker()` (`prismStore.ts:332`), which terminates the worker
  and revokes its blob URL (`:218-228`). The initialised Pyodide runtime is
  destroyed, and `warmUpWorker` is not called again, so the next file pays a full
  cold start. The recovery path for a trivial error, a typo in a file name,
  charges the user the largest fixed cost in the product.

- **DEFECT F5-b. After the first success, application errors are invisible.**
  Established in section 2. The block is inside `{!hasResults}`.

- **DEFECT F5-c. Error messages leak internals.** `processData`'s `onerror`
  handler passes `error.message` straight through (`prismStore.ts:417`), and
  `handleRunTest` stores `String(error)` (`AnalyticsWorkspace.tsx:628`). The user
  can be shown a raw exception string with no mapping to anything they can act
  on.

- **DEFECT F5-d. The error code shown to the user is frequently the wrong one.**
  `processData`'s message handler sets a correct `ProcessingError` and then
  rejects (`prismStore.ts:398-408`). That rejection propagates to `setFile`'s
  `catch` at `prismStore.ts:310`, which overwrites the state with a
  `FILE_ERROR` code and resets `processing` to `initialProgress`, so the
  status ends as `idle` rather than `error`. The user sees the right sentence
  under the wrong classification, and the store's own status field disagrees
  with what happened.

- **DEFECT F5-e. No failure is recoverable in place.** Not one of the four
  surfaces offers "retry this same thing". The Workspace panels show a red box
  and stop. The user has to re-select the columns and press the button again.

- **DEFECT F5-f. There is no global error boundary.** No React error boundary
  exists anywhere in `src/`. Any render time exception in `SmartChart`,
  `AnalyticsWorkspace` or `App` unmounts the tree and leaves a blank page
  under a header, with the user's data gone and no explanation. Given that
  nothing is persisted, a blank page is total loss of session.

### 7.3 SHOULD BE

A single error contract, used by every surface:

```
{
  what:      one sentence, in the user's vocabulary, no exception text
  where:     the file, sheet, column, row or operation involved
  why:       the rule that fired, named
  actions:   [ primary retry, secondary alternative, tertiary discard ]
  detail:    collapsed, contains the raw message for a bug report
}
```

Rules:

1. **Retry must never be the destructive action.** Add a `resetAnalysis()` that
   clears results and keeps the worker alive. Reserve worker termination for an
   explicit "clear everything" control.
2. **Every failure renders where the user was looking**, not in a region that
   may be unmounted.
3. **A React error boundary wraps the results region and the workspace**, and
   its fallback keeps the file loaded so a re-render is possible.
4. **Raw exception text lives behind a disclosure**, with a copy control, so a
   user can send it to us without it being the headline.
5. **`window.alert` is removed from the codebase.** Three occurrences, all in
   `AnalyticsWorkspace.tsx`.

---

## 8. F6: Export. NOT BUILT

### 8.1 The finding

There is no export of any kind in `src/`. No `Blob` construction for output, no
`URL.createObjectURL` for a download, no `<a download>`, no `navigator.clipboard`,
no print stylesheet. The only `createObjectURL` call in the tree builds the
worker (`prismStore.ts:178`). The only `Blob` is the worker source.

The consequence: a user can load a file, compute a result, read it, and then has
no way to get it out except a screenshot or retyping. Nothing is persisted, so
closing the tab destroys the work.

### 8.2 Why this is the largest gap

PRISM's positioning targets people who produce artifacts: auditors assembling
workpapers, analysts writing a memo, a reviewer attaching evidence to a finding.
For that user, an analysis that cannot leave the tab has not finished. The tool
currently asks them to do their most sensitive work in a place where the work
cannot be saved.

Export is also the single safest feature in the product to build. A download
constructed from an in memory `Blob` never touches the network. The CSP's
`form-action 'none'` and `connect-src` restrictions are untouched by it. Export
is the one large feature that strengthens rather than tests the core claim,
because it gives the user a local artifact that proves the analysis happened
locally.

### 8.3 SHOULD BE

Four export targets, in build order:

| Order | Target | Contents | Why this order |
| --- | --- | --- | --- |
| 1 | Results as CSV | Column statistics table, one row per column | Smallest, most asked for, no new rendering |
| 2 | Chart as PNG | Serialise the rendered SVG to a canvas, then to a blob | Recharts renders SVG already; no new dependency needed |
| 3 | Session as JSON | File name, sheet, row and column counts, every statistic, every test run with its inputs and outputs, timestamps, PRISM version | This is the workpaper. It is the artifact an auditor attaches |
| 4 | Report as printable HTML | The Quick Summary view with a print stylesheet | Print to PDF is a local operation the browser already provides |

Constraints on all four:

- The exported JSON must record **what was truncated**. If a chart drew 500 of
  1.2 million rows, the export says so. An export that hides a limitation is
  worse than no export.
- The exported JSON must record **which sheet** of a workbook was read, once
  F2's sheet chooser exists.
- No export may include a compliance claim. A footer line naming the PRISM
  version and the date is enough.
- The download itself must be visibly local. Name the file deterministically and
  say, next to the control, that the file is assembled in the tab.

---

## 9. Flow transition table

What each control actually does today, and what is lost when it runs.

| Control | File:line | Calls | Destroys | Keeps |
| --- | --- | --- | --- | --- |
| Drop or pick a file | `FileUploader.tsx:74` | `setFile` | Previous results, previous file | Accessibility settings, worker |
| New Analysis | `App.tsx:413` | `clearFile` | Results, file, datasets, links, **the warm worker** | Accessibility settings only |
| Remove dataset | `DatasetManager.tsx:444` | `removeDataset` | That dataset and every link touching it | Other datasets, results |
| Remove link | `DatasetManager.tsx:474` | `removeDatasetLink` | That link | Everything else |
| Analyze N Datasets | `DatasetManager.tsx:485` | `processLinkedDatasets` | Previous results | Datasets, links, worker |
| Quick Summary / Workspace tabs | `App.tsx:428`, `:442` | local `setResultsView` | Nothing | Everything |
| Workspace tab change | `AnalyticsWorkspace.tsx:226` | local `setActiveTab` | Nothing rendered, but the panel unmounts | Parent state including results |
| Run Test | `AnalyticsWorkspace.tsx:1281` | `runCustomAnalysis` | Previous `testResults` | Everything else |
| Create Visualization | `AnalyticsWorkspace.tsx:990` | `runCustomAnalysis` | Previous `visualizationResults` | Everything else |
| Apply Preprocessing | `AnalyticsWorkspace.tsx:1109` | `runCustomAnalysis` | Previous `preprocessingResults` | Everything else. **Note:** the result is reported but is not applied to the data used by any later step |
| Run Analysis (Analytics tab) | `AnalyticsWorkspace.tsx:1502` | nothing | nothing | nothing |
| Configure Model (Models tab) | `AnalyticsWorkspace.tsx:1602` | nothing | nothing | nothing |

The preprocessing row deserves emphasis. `handleRunPreprocessing`
(`AnalyticsWorkspace.tsx:658`) sends the operations to the worker and stores the
outcome, and the UI reports "Preprocessing Complete" with the operation list
(`:1203-1206`). Nothing writes a transformed dataset back into the store. A user
who removes nulls and then runs a t-test runs it on the original data. The UI
says the preprocessing succeeded, which is true, and strongly implies it applies
to what happens next, which is not.

---

## 10. Priority order

Ranked by how much damage the flow does to a user who is trusting the output,
not by implementation cost.

| Rank | Fix | Flow | Why first |
| --- | --- | --- | --- |
| 1 | Tell the user when a chart is truncated, and that it is positional | F3 | The product currently states a wrong number with confidence |
| 2 | Tell the user which sheet was read, and let them choose | F2 | The most likely silently wrong answer |
| 3 | Make preprocessing either apply downstream or stop claiming it ran | F3 | A user acts on a result they believe was cleaned |
| 4 | Remove or gate the fifteen dead buttons | F3 | Cheapest credibility repair in the codebase |
| 5 | Make dropzone rejection visible | F2, F4 | Silent failure on the very first interaction |
| 6 | Unlock the `DatasetManager` upload zone on error | F4 | A hard lock requiring a reload that loses everything |
| 7 | Stop `clearFile` from destroying the warm runtime | F5 | The recovery path is the slowest path |
| 8 | Move the error surface out of the `{!hasResults}` branch | F5 | Half the session has no error reporting |
| 9 | Fix the progress sequence and the warm up handler race | F1, F3 | The UI currently lies about state |
| 10 | Build export, starting with CSV and session JSON | F6 | The work cannot leave the tab |
| 11 | Rename "AI-Generated Insights", remove fabricated confidence | F3 | Two false notes on the credibility screen |
| 12 | Add a React error boundary | F5 | A render exception is currently total session loss |
| 13 | Move focus on view change | F1, F3 | Keyboard and screen reader users lose their place |
| 14 | Add an error boundary fallback that keeps the file | F5 | Makes 12 recoverable rather than merely legible |

---

## 11. What this document does not cover

- The trust bootstrap of the first thirty seconds: see `ONBOARDING.md`.
- Navigation structure, labelling and landmark layout: see `IA.md`.
- The full defect register with severities: see `USABILITY_ISSUES.md`.
- Statistical correctness of the seventeen tests, the Web Worker CSP question,
  bundle size and the `xlsx` advisory: owned by the technical strategy documents
  in `docs/business/technical/`. They are referenced here only where they change
  what the user sees.
