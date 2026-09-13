# PRISM Usability Issues

Owner: UX architecture
Date written: 2026-09-13
Scope: defects found by reading the source on branch `army/prism-upgrade`

---

## 0. How this register was produced

Every issue below was found by reading the code, not by using a heuristic
checklist against screenshots. Each entry cites a real `file:line`. Where the
defect depends on data, the entry names the data that triggers it.

Files read in full: `src/App.tsx`, `src/components/core/FileUploader/FileUploader.tsx`,
`src/components/core/DatasetManager/DatasetManager.tsx`,
`src/components/analytics/AnalyticsWorkspace/AnalyticsWorkspace.tsx`,
`src/components/visualization/SmartChart/SmartChart.tsx`,
`src/components/visualization/InsightCard/InsightCard.tsx`,
`src/stores/prismStore.ts`, `src/security/validator.ts`, `index.html`,
`src/styles/index.css`, plus the message handling and truncation sections of
`src/workers/prism.worker.js`.

### Severity scale

| Level | Meaning |
| --- | --- |
| **S1** | The product produces a wrong answer the user cannot detect, or the user loses work with no recovery |
| **S2** | The user is misled, blocked, or the recovery available costs far more than the mistake |
| **S3** | Friction, confusion, or extra steps. The user gets there |
| **S4** | Polish |

S1 is reserved for defects that damage trust in the output. For a product whose
whole proposition is that you can rely on what it tells you, an S1 is worse than
an outage.

### Counts

| Severity | Count |
| --- | --- |
| S1 | 9 |
| S2 | 19 |
| S3 | 18 |
| S4 | 4 |
| **Total** | **50** |

---

## 1. S1: wrong answers and unrecoverable loss

### U-01. Charts silently truncate and report the truncated count as the total

**Where:** `SmartChart.tsx:538`; truncation at `src/workers/prism.worker.js:1003`
(value counts, 10), `:1014` and `:1026` (bar, 15), `:1038`, `:1053`, `:1072`,
`:1087` (line and preview, 100), `:1060` (scatter, 500).

**What happens:** The worker truncates with `head(n)`, which takes the first n
rows in file order rather than a sample. `SmartChart.tsx:538` then renders
`{config.data.length} data points`, which is the count *after* truncation. A
scatter plot of 1.2 million rows shows the first 500 rows and the caption says
"500 data points".

**Why it is S1:** The user has no signal that anything was dropped. File order is
frequently meaningful (chronological exports, sorted extracts, grouped ledgers),
so the first 500 rows are systematically unrepresentative in exactly the cases
where the data has structure. Worse, `SmartChart.tsx:99-147` computes the
minimum, maximum, average and trend over the truncated set and states them as
facts about the data, and that string becomes the chart's `aria-label`
(`SmartChart.tsx:559`) and its visible summary (`:553`).

**Fix:** The worker returns both the drawn count and the source count. Every
chart built from a subset renders a notice naming the rule: "Showing the first
500 of 1,284,309 rows, in file order. This is not a random sample." Where a
subset would mislead, refuse to draw rather than drawing confidently.

---

### U-02. Only the first worksheet of a workbook is ever read, and nothing says so

**Where:** `src/stores/prismStore.ts:118` takes `workbook.SheetNames[0]`. The
results header shows the file name at `src/App.tsx:408`.

**What happens:** A user opens a workbook with a `Summary` sheet, a `Detail`
sheet and a `Notes` sheet. PRISM analyses whichever is first and presents the
result under the file's name, as though the file had been analysed.

**Why it is S1:** This is the most likely way PRISM gives a confident wrong
answer today. A multi sheet workbook is the normal shape of a finance or audit
file, and "first sheet" is frequently a cover page or a pivot rather than the
data.

**Fix:** Detect sheet count during parse. With more than one non empty sheet,
show a chooser before analysis with each sheet's row and column count. Record the
chosen sheet in the source strip (`IA.md` section 5.2) and in any export. Until
the chooser exists, display "Sheet 1 of n" so the limitation is at least visible.

---

### U-03. Preprocessing reports success and is never applied to anything

**Where:** `AnalyticsWorkspace.tsx:658-686` sends the operations;
`:1202-1207` reports "Preprocessing Complete" and lists the operations. Nothing
in `src/stores/prismStore.ts` writes a transformed dataset back into state.

**What happens:** A user selects "Remove Null Values" and "Remove Outliers",
presses Apply, sees a green panel confirming completion, then switches to the
Statistics tab and runs a t-test. The t-test runs on the original data. Every
later step in the session also runs on the original data.

**Why it is S1:** The user makes a decision based on a number they believe was
computed on cleaned data. There is no visible difference between the two cases.

**Fix:** Either apply the transform to the working dataset and show an applied
state in the source strip with an undo, or change the copy so it cannot be read
as persistent, which means not saying "Complete" next to a list of operations.
The first is the right answer; the second is the acceptable stopgap.

---

### U-04. One bad file locks the multi dataset upload zone for the rest of the session

**Where:** `DatasetManager.tsx:358-364`. The `disabled` flag at `:374`.
Throw paths at `src/stores/prismStore.ts:501` (`'File is empty'`), `:120`
(`'Excel file has no sheets'`), `:124` (`'Could not read sheet'`).

**What happens:**

```
const onDrop = useCallback(async (acceptedFiles: File[]) => {
  setIsUploading(true);
  for (const file of acceptedFiles) {
    await addDataset(file);     // <-- can reject
  }
  setIsUploading(false);        // <-- never runs if it does
}, [addDataset]);
```

`isUploading` stays true, `disabled` stays true, and the drop zone is inert for
the remainder of the session.

**Why it is S1:** The only recovery is a page reload, which discards every other
dataset the user already added and every link they built, because nothing is
persisted. A single empty CSV costs the user all their setup work.

**Fix:** `try`/`finally` around the loop. Report per file outcomes as a list, so
one bad file does not take the batch with it.

---

### U-05. The accessible chart summary can state a nonsense trend as fact

**Where:** `SmartChart.tsx:137-139`.

```
const changePct = ((secondAvg - firstAvg) / firstAvg) * 100;
if (changePct > 10) trend = `increasing by approximately ${Math.round(changePct)}%`;
```

**What happens:** When the first half of the series averages zero, `changePct` is
`Infinity` or `NaN`. `Infinity > 10` is true, so the summary reads "Trend is
increasing by approximately Infinity%". That string is rendered visibly at
`SmartChart.tsx:553` and is the chart's `aria-label` at `:559`, so it is the only
description a screen reader user receives.

**Why it is S1:** A metric starting at zero is ordinary (a new product line, a
new account, a counter). The output is not merely ugly, it is a false statement
about the data presented with the same authority as every true one, and for a
non sighted user it replaces the chart entirely.

**Fix:** Guard the division. When the baseline is zero or the series is too short
to have halves, describe the change in absolute terms or say the trend cannot be
summarised. Never emit a percentage derived from a zero denominator.

---

### U-06. The application error surface disappears after the first successful analysis

**Where:** The error block at `src/App.tsx:357-380` sits inside the
`{!hasResults && (...)}` branch that opens at `:238` and closes before `:399`.

**What happens:** Once `results.summary` is non null, that entire branch unmounts.
Every error written to the store after that point, by `addDataset`
(`prismStore.ts:485-492`), by `processLinkedDatasets` (`:632-642`), by the worker
`onerror` handler (`:646-655`), is set in state and rendered nowhere.

**Why it is S1:** Roughly half of a working session happens after the first
analysis, and in that half the application has no way to tell the user that
something failed. The failure is not merely invisible; the UI carries on looking
correct.

**Fix:** Move the error surface out of the conditional branch. Per `IA.md`
section 8.3 it renders inline in the section that failed.

---

### U-07. There is no error boundary anywhere, so a render exception is total session loss

**Where:** No React error boundary exists in `src/`. Confirmed by search across
the tree.

**What happens:** Any render time exception inside `SmartChart`,
`AnalyticsWorkspace`, `InsightCard` or `App` unmounts the whole tree. The user
gets a blank page. Because nothing is persisted (`IA.md` section 7.2), the file,
the results and the datasets are gone.

**Why it is S1:** U-05 is a live example of a data dependent value reaching a
render path, and `AnalyticsWorkspace` types three result objects as `any`
(`:293-295`), so the surface area for a shape mismatch is large. The cost is a
user who did a long cold start, ran an analysis on a sensitive file, and now has
a white page.

**Fix:** An error boundary around the results region and around the workspace,
whose fallback keeps the loaded file in state and offers a re-render, a reset
that preserves the file, and a copyable detail block.

---

### U-08. Statistical significance is coloured as success and failure

**Where:** `AnalyticsWorkspace.tsx:1414-1429`. A p-value below 0.05 renders in
emerald (`:1416`). The verdict renders "✓ Significant" in emerald or
"✗ Not Significant" in amber (`:1425-1427`).

**What happens:** The interface uses its success colour and a check mark for a
rejected null hypothesis, and its warning colour and a cross for a retained one.

**Why it is S1:** The Workspace is explicitly built to guide users who do not
already know which test to run: every test carries a `whenToUse` string
(`:146-173`). For that user, a green check reads as "the analysis worked" and an
amber cross reads as "something went wrong" or "try a different test until it
turns green". The interface is teaching p-hacking through its colour palette, and
the resulting misreading is invisible because the number itself is correct.

**Fix:** Neutral colour for both outcomes. State the result as a sentence rather
than a verdict: "p = 0.031, below the 0.05 threshold. The difference is unlikely
under the null hypothesis." Move the threshold into the copy so it is visibly a
convention rather than a pass mark.

---

### U-09. An absent result field is displayed as a definite negative finding

**Where:** `AnalyticsWorkspace.tsx:1423-1428`.

```
{testResults.testResult.significant ? '✓ Significant' : '✗ Not Significant'}
```

**What happens:** `testResults` is typed `any` (`:293`). If the worker omits
`significant`, or returns `null`, or the field name changes, the expression is
falsy and the card renders "✗ Not Significant" with full confidence.

**Why it is S1:** A missing value and a negative result are presented
identically. The same pattern appears for the statistic and the p-value at
`:1410` and `:1418`, where a missing value renders as `-`, which is at least
honest. The boolean has no such escape.

**Fix:** Three states, not two: significant, not significant, and not reported.
Type the result object rather than using `any`, so a shape change is a build
error instead of a false negative on screen.

---

## 2. S2: misleading, blocking, or expensive to recover from

### U-10. Fifteen buttons do nothing at all

**Where:** `AnalyticsWorkspace.tsx:1502` (four "Run Analysis" buttons on the
Analytics tab), `:1522` (four "Business Analysis Tools" buttons), `:1610` (seven
"Configure Model" buttons). None has an `onClick`.

**What happens:** They are styled with the same `btn-secondary` and card
treatments as the working controls two tabs away. Pressing one produces nothing:
no spinner, no error, no state change.

**Why it matters:** Every one of these is discovered by a user who is exploring,
which is to say by a user who is currently deciding whether to trust the tool.
This is the cheapest credibility damage in the codebase and the cheapest to
repair.

**Fix:** Delete the buttons. The surrounding reference content moves to a
Reference section per `IA.md` section 4. Do not disable them; a disabled button
is still a promise.

---

### U-11. A rejected file is invisible to anyone who can see the screen

**Where:** `FileUploader.tsx:81-93` writes the rejection message into `announcement`.
`:246-253` renders `announcement` inside a `className="sr-only"` live region.
There is no visible output path.

**What happens:** Drop a `.json`, a `.pdf`, or a file over the limit. The drag
state styling at `:125-134` disappears on drop and the page returns to its
resting state. Nothing else changes. A sighted user concludes the app is broken
or that they missed the target.

**Why it matters:** This is the first interaction in the product. Silent failure
at the point of first contact is the most expensive place to have one, and the
message it should have shown already exists as a string.

**Fix:** Render the rejection in a persistent inline panel beneath the dropzone,
using the existing `alert-error` styling, naming what was wrong, what is
accepted, and offering one control that reopens the picker. Keep the live region
for screen readers; it is currently doing the right thing in the wrong place.

---

### U-12. The multi dataset drop zone gives no feedback on rejection at all

**Where:** `DatasetManager.tsx:366-375`. No `onDropRejected` is supplied.

**What happens:** An unsupported or oversized file is filtered out by
react-dropzone and never reaches `onDrop`. Nothing is announced, nothing is
rendered, and unlike U-11 there is not even an `sr-only` message.

**Fix:** Same component and same copy as the fix for U-11.

---

### U-13. The recovery action is also the most expensive action in the product

**Where:** "Try again with a different file" at `src/App.tsx:373` and
"New Analysis" at `:413` both call `clearFile`. `clearFile`
(`prismStore.ts:331-337`) calls `terminateWorker()`, which terminates the worker
and revokes its blob URL (`:218-228`). `warmUpWorker` is not called again.

**What happens:** The initialised Pyodide runtime is destroyed. The next file
pays a full cold start: the integrity-checked runtime download from the CDN,
`loadPyodide()`, `loadPackage(['pandas', 'numpy'])`, and the Python source
evaluation (`worker:1317-1367`).

**Why it matters:** The action a user takes after a trivial mistake, wrong file,
wrong sheet, typo in a name, charges them the single largest fixed cost the
product has.

**Fix:** Split the two actions. `resetAnalysis()` clears results and the loaded
file and keeps the worker. Reserve `terminateWorker` for an explicit
"clear everything" that says what it will do.

---

### U-14. The progress bar runs backwards twice and reaches 100 percent before analysis begins

**Where:** Main thread progress at `prismStore.ts:255` (10), `:302` (30), `:360`
(40). Worker init progress at `worker:1320` (10), `:1340` (30), `:1350` (50),
`:1360` (70), `:1372` (100). Worker analysis progress at `:1394` (20), `:1409`
(50), `:1424` (80), `:1439` (100).

**What happens:** On a cold start the user sees 10, 30, 40, then 10, 30, 50, 70,
100, then 20, 50, 80, 100. Two backward jumps and a premature completion.

**Why it matters:** A progress indicator that moves backwards is worse than no
indicator, because it converts a wait into a suspicion that something is
retrying. It also makes the remaining time unguessable, which is the only thing a
progress bar exists to communicate.

**Fix:** Two separate indicators, per `IA.md` section 8.2. A header level engine
status line that is not a bar, and an analysis progress that starts at zero when
the user's data reaches Python. Neither may decrease.

---

### U-15. Warm up progress is delivered to the analysis handler and unmounts the progress card mid analysis

**Where:** `warmUpWorker` attaches no handler (`prismStore.ts:197-216`).
`processData` attaches `onmessage` at `:369`. The warm up's final message carries
`status: 'complete'`, `progress: 100` (`worker:1369-1374`).

**What happens:** A user who drops a file while the warm up is still running has
their analysis handler receive the warm up's remaining messages. On the last one,
`isProcessing` (`App.tsx:155`) becomes false while `hasResults` (`:156`) is still
false, so the progress card unmounts and the upload screen returns while the
analysis is still running. A screen reader user hears "System ready. You can now
upload a file." (`worker:1373`) about a file they already uploaded.

**Secondary defect:** `initializePyodide` guards only on `isInitialized`, which is
set at the end (`worker:1367`), with no in flight promise. A `PROCESS_FILE`
arriving during `INIT` takes the branch at `:1387` and starts a second full
initialisation.

**Fix:** Tag messages with the request id already being generated at
`prismStore.ts:208` and `:439` and ignore messages that do not match the current
request. In the worker, hold the initialisation promise and return it to
concurrent callers.

---

### U-16. The content scan rejects ordinary business data, fatally, with no explanation and no override

**Where:** `validator.ts:61-70` defines `DANGEROUS_PATTERNS`, applied to every
CSV and XML at `:107-112`. The rejection message is at `:169`.

**What happens:** The list includes `/on\w+\s*=/i`. Any cell anywhere in the file
containing a word beginning "on" followed by an equals sign matches: `Onset = 3
days` in a clinical extract, `Reason = timeout` in a log export, `Online = TRUE`
in a flag column. The list also includes `/javascript:/i`, which matches any URL
column containing that scheme, and `/<script[\s>]/i`, which matches any security
log or content export that quotes markup.

The user sees "File contains potentially unsafe content and cannot be processed."
They are not told which row, which column, or which pattern. There is no
override. The file is simply refused.

**Why it matters:** The target user runs log reviews, eDiscovery extracts and
system exports. These are exactly the files that contain the matched strings, as
data. The tool refuses the user's actual work and implies they did something
wrong.

**Fix:** Make the scan advisory for CSV. Report the row number and the pattern
that fired, and offer "analyse anyway, treating every cell as inert text". The
property PRISM needs is that a cell is never interpreted as markup at render
time, which `src/security/sanitizer.ts` already provides. Blocking the file is
the wrong lever for that property.

---

### U-17. "AI-Generated Insights" is inaccurate and the confidence meter is fabricated

**Where:** Heading at `src/App.tsx:489`. Meter at `InsightCard.tsx:99-107`.
Values at `worker:284` (0.9), `:290` (0.85), `:297` (0.8), `:303` (0.75), `:325`
(1.0), `:349` (0.8). `src/python/prism_core.py` imports `pandas`, `numpy`, `json`,
`io`, `typing`, `dataclasses`, `enum` and `uuid`. There is no model anywhere.

**What happens:** Deterministic pandas heuristics are labelled AI generated, and
six hardcoded literals are rendered as a gradient bar and a percentage, so a
card reads "100% confidence".

**Why it matters:** These sit on the screen whose entire purpose is to be
believed, in a product sold to people who check claims professionally. The
underlying observations are useful. The packaging invites a challenge the
observations cannot survive.

**Fix:** Rename to "Automated checks". Replace the meter with the rule that
fired: "Two numeric columns detected" is more useful and more honest than a
percentage.

---

### U-18. Unsupported compliance claims are rendered as product chrome

**Where:** `src/App.tsx:386` ("WCAG 2.2 AAA compliant" feature card), `:619`
("ISO 27001" footer badge), `:622` ("WCAG 2.2 AAA" footer badge). Neither
standard has an assessment behind it in this repository.

**Why it matters:** These are the claims the intended buyer is trained to check,
and they will be checked first. A claim that fails takes the true claim beside it
down with it, and the true claim is the only thing PRISM has.

**Fix:** Remove all three. Replace the feature card with "Keyboard and screen
reader support", which is checkable and is what the components actually attempt.
Full argument in `ONBOARDING.md` section 11.

---

### U-19. The results view tab bar is a broken ARIA tabs pattern

**Where:** `src/App.tsx:425-456`. Both buttons carry `role="tab"` and
`aria-selected`. Neither has an `id` or `aria-controls`, and neither of the two
views is marked `role="tabpanel"`.

**What happens:** A screen reader announces "tab, selected, 1 of 2" and then has
no relationship to any panel. Activating a tab changes content that is not
associated with it.

**Aggravating context:** The mode tab bar at `:207-282` implements the pattern
correctly, with ids, `aria-controls` and real `tabpanel` elements at `:285` and
`:300`. The workspace tab bar (`AnalyticsWorkspace.tsx:226-246`, `:688-716`)
implements it correctly *and* adds roving `tabIndex` and arrow key navigation.
So the codebase contains three tab bars at three different levels of correctness,
and keyboard behaviour changes depending on which one has focus.

**Fix:** Extract one `Tabs` component from the workspace implementation, which is
the correct one, and replace all three uses. This is step 1 of the migration in
`IA.md` section 11.

---

### U-20. The recommended test card is a clickable div and cannot be reached by keyboard

**Where:** `AnalyticsWorkspace.tsx:1262-1270`.

```
<div
  className={clsx('p-4 rounded-xl border-2 transition-all cursor-pointer', ...)}
  onClick={() => setSelectedTest(test.id)}
>
```

No `role`, no `tabIndex`, no `onKeyDown`. It contains a real `<button>` at
`:1286-1295` which stops propagation.

**What happens:** Selecting a recommended test, which is the primary guided path
through the Statistics tab, is mouse only. A keyboard user can reach the nested
"Run Test" button and can reach the test buttons in the "All Statistical Tests"
grid below, but cannot select a recommendation.

**Fix:** Make the card a `<button>` wrapping its content, or give the div
`role="button"`, `tabIndex={0}` and Enter and Space handling. The first is
better; the nested button then moves out of the card body and beside it.

---

### U-21. Focus is dropped at every view change

**Where:** The branch boundary at `src/App.tsx:238` and `:399`. There is no
`useEffect` in `App.tsx` that moves focus.

**What happens:** When analysis completes, the upload branch unmounts. Focus was
on the dropzone (`FileUploader.tsx:154-229`) or the Select File button (`:232`),
both now removed, so focus falls to `<body>`. The same happens in reverse on
"New Analysis".

**Why it matters:** A keyboard user has to tab from the top of the document to
reach the results. A screen reader user is given no indication that the page
changed at all, because the only announcement is the progress live region, which
unmounts with the branch.

**Fix:** On completion, move focus to the results heading (`App.tsx:404`) with
`tabIndex={-1}`, and announce the transition once. On reset, move focus to the
dropzone.

---

### U-22. Destructive controls are invisible until hover and focusable while invisible

**Where:** `DatasetManager.tsx:100` (remove dataset) and `:329` (remove link).
Both use `opacity-0 group-hover:opacity-100` with no `focus-within` or
`focus-visible` variant.

**What happens:** A keyboard user tabs to a button that is rendered at zero
opacity. The focus ring is applied to an invisible element. The button is
functional and destructive: `removeDataset` (`prismStore.ts:526-537`) also
deletes every link that touches the dataset.

**Why it matters:** Hover-only affordances are already a discoverability problem
for pointer users. Combined with a focusable invisible destructive control, this
is a data loss path a keyboard user can hit without seeing it.

**Fix:** Add `group-focus-within:opacity-100` at minimum. Better: make the
controls permanently visible. A card with a remove button is not visually
cluttered by the remove button.

---

### U-23. A skip link points at an id that stops existing

**Where:** `index.html:124` targets `#file-upload`. That id is on the section at
`src/App.tsx:240`, which renders only when `!hasResults`.

**What happens:** After an analysis, "Skip to file upload" targets nothing.

**Fix:** Per `IA.md` section 9.1, the two skip links become "Skip to main
content" and "Skip to section navigation", both of which exist in every state.

---

### U-24. The chart title field has no label and its value is never used

**Where:** `AnalyticsWorkspace.tsx:978` is a `<label>` with no `htmlFor` that
does not wrap the input at `:971`. The input has no `id` and no `aria-label`.
`handleCreateVisualization` (`:634-656`) sends only `chartType` and `columns`.

**What happens:** The input has no accessible name, so a screen reader announces
an unlabelled text field. Typing a title has no effect on the chart or on
anything else.

**Fix:** Remove the field until titles are supported, or bind the label, control
the value, and pass it through. Do not ship an input that does nothing.

---

### U-25. Validation errors use `window.alert`

**Where:** `AnalyticsWorkspace.tsx:610`, `:636`, `:660`.

**What happens:** "Please select at least one column for the test" arrives as a
native modal. It blocks the thread, it is styled by the browser rather than the
product, it is not associated with the control that caused it, and it is
inconsistent with the inline red panels the same component uses for run failures
(`:1040`, `:1197`, `:1402`).

**Fix:** Inline message adjacent to the control, plus `aria-describedby` on the
button. Remove all three `alert` calls; they are the only ones in `src/`.

---

### U-26. One selection state carries three incompatible meanings

**Where:** `selectedColumns` declared at `AnalyticsWorkspace.tsx:289`, written by
the Visualize checkboxes (`:926`), the Preprocess checkboxes (`:1141`) and the
Statistics chips (`:1233`).

**What happens:**

| Tab | What a selected column means |
| --- | --- |
| Visualize | Chart these columns |
| Preprocess | Apply the transforms to these columns. Empty means all columns (`:1129-1131`) |
| Statistics | These are the variables in the hypothesis, and they drive the test recommender at `:318-409` |

Switching tabs carries a selection made for one purpose into a context where it
means something else. The most damaging direction: a user selects eight columns
to chart, moves to Preprocess, and the transforms now target those eight columns
instead of all columns, silently narrowing the operation.

**Fix:** Separate state per purpose, or make the shared selection explicit with a
persistent bar reading "8 columns selected" and a clear control, so the carry
over is at least visible.

---

### U-27. The theme control's first click does nothing visible

**Where:** Initial `colorScheme` is `'system'` (`prismStore.ts:35`). The effect at
`src/App.tsx:137-144` branches only on `'dark'`, `'light'` and `'high-contrast'`.
`index.html:2` hardcodes `class="dark"` on `<html>`. The toggle at `:204` picks
its icon from `colorScheme === 'dark'` and its label at `:202` the same way.

**What happens:** On load, the page is dark, the state says `'system'`, the button
shows a moon and is labelled "Switch to dark mode". Clicking it sets `'dark'`,
which adds a class already present. Nothing moves. The second click works.

**Secondary defect:** `'high-contrast'` is a supported value in the type
(`src/types/index.ts:205`) and has CSS behind it (`src/styles/index.css:429-451`)
but no control anywhere in the UI can reach it.

**Fix:** Handle `'system'` explicitly by following `prefers-color-scheme`, remove
the hardcoded class from `index.html`, and derive the icon and label from the
resolved theme rather than the stored preference. Expose all three schemes in the
Display popover proposed in `IA.md` section 4.

---

### U-28. The advertised file size limit contradicts its own documentation and has no measurement behind it

**Where:** `src/security/validator.ts:17-20`.

```
/**
 * Maximum file size: 50MB
 * Prevents memory exhaustion attacks
 */
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
```

Surfaced to the user at `FileUploader.tsx:220` as a badge reading "Max 500MB",
and in the rejection message at `validator.ts:145`.

**What happens:** The landing screen promises a limit that the product has never
been measured against. A user takes the promise at face value, drops a large
file, and the browser tab is the thing that decides what happens next.

**Why it matters:** This is a promise printed on the first screen, and it is the
one number a cautious user will plan around. The doc comment disagreeing with the
value is a signal that no product decision was ever made.

**Fix:** One agreed number, set once, measured, and paired with a sentence about
what happens as the file gets large. The measurement is owned by the technical
strategy documents; the UI must not print a number until it exists.

---

## 3. S3: friction and confusion

### U-29. Four accessibility settings exist in state with no way to reach them

**Where:** `prismStore.ts:33-39` defines `fontSize`, `colorScheme`,
`reducedMotion`, `sonificationEnabled`, `screenReaderMode`. The header exposes
two (`App.tsx:178-188`, `:191-206`).

`sonificationEnabled` is read by `App.tsx:519` and nothing ever writes it.
`reducedMotion` is initialised from `matchMedia` and never read anywhere.
`screenReaderMode` is never read or written. `high-contrast` is unreachable
(U-27).

**Fix:** One Display popover with all of them, per `IA.md` section 4.

---

### U-30. Display preferences are discarded on every reload

**Where:** `App.tsx:136-150` applies the settings and nothing persists them.

**What happens:** A user who needs 150 percent text sets it again on every visit.

**Fix:** Persist the display tier only, per `IA.md` section 7.2, with a visible
"forget these" control. The data tier stays in memory, which is the product.

---

### U-31. The progress card announces three overlapping strings on every update

**Where:** `App.tsx:320-355`. A `role="status" aria-live="polite" aria-atomic="true"`
wrapper at `:322-326` containing the visible message (`:332`), the percentage
(`:349-351`), and an `sr-only` copy of `accessibleMessage` (`:353`), plus an
`aria-label` on the progressbar that is also `accessibleMessage` (`:344`).

**What happens:** Because `aria-atomic="true"` is on the wrapper, every progress
tick re-announces the entire card. Combined with the sequence in U-14, a cold
start produces a long stream of overlapping speech.

**Fix:** One polite live region carrying one sentence. The percentage belongs to
the progressbar's `aria-valuenow`, which is already set at `:342`, and does not
need to be spoken as prose.

---

### U-32. Static marketing text is marked as a live region

**Where:** `src/App.tsx:223-237`. The security banner carries `role="status"`.

**What happens:** A role intended for dynamic status is applied to text that never
changes, giving assistive technology a reason to announce it.

**Fix:** Plain element. When the banner is replaced by the engine status line
(`ONBOARDING.md` section 6), that line is genuinely dynamic and the role becomes
correct for the first time.

---

### U-33. Dataset columns are detected by splitting the first line on commas

**Where:** `prismStore.ts:499-504`.

```
const columns = firstLine.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
```

**What happens:** A quoted header containing a comma, `"Revenue, net"`, becomes
two columns. Both appear in the join builder dropdowns (`DatasetManager.tsx:202`,
`:220`) as selectable keys. `rowCount` at `:504` has the same problem in reverse,
counting embedded newlines inside quoted fields as rows.

**Fix:** Parse the header with the same CSV parser that will later read the data.
A header row is a CSV row.

---

### U-34. The two upload paths accept different formats with no explanation

**Where:** `FileUploader.tsx:106-112` accepts `.csv`, `.xlsx`, `.xls` and `.xml`.
`DatasetManager.tsx:368-372` accepts the first three only.

**What happens:** Switching a tab silently changes which files are allowed, and
because `DatasetManager` has no rejection feedback (U-12), an XML file dropped
there vanishes.

**Fix:** One accepted set, defined once, used in both places and printed in both
places.

---

### U-35. The join builder validates nothing before creating a link

**Where:** `DatasetManager.tsx:129-141`. The submit guard requires only that four
values are non empty. The submit button's `disabled` at `:273` checks only the
two column fields.

**What does not happen:** No type compatibility check, no check that the key
values overlap, no warning when either side's key is non unique (which turns an
inner join into a multiplying one), no preview of the resulting row count.

**Fix:** Validate before enabling "Create Link". Show overlap and expected output
size. A join is the operation most likely to silently produce a wrong dataset, so
it deserves the most pre-flight checking in the product.

---

### U-36. Removing a dataset silently removes its links

**Where:** `prismStore.ts:526-537` filters `datasetLinks` alongside `datasets`.
The trigger is the hover-only trash button at `DatasetManager.tsx:98-104` (see
U-22).

**Fix:** When links exist, confirm and name what will be lost.

---

### U-37. Two screens present the same data with different labels

**Where:** Quick Summary (`App.tsx:458-554`) and workspace Data Overview
(`AnalyticsWorkspace.tsx:784-895`).

Same data, different column sets, and the same concept labelled "Nulls" at
`App.tsx:546` and "Missing" at `AnalyticsWorkspace.tsx:831` and `:1157`.

**Fix:** Merge the screens, per `IA.md` section 4. One label per concept, per
`IA.md` section 6.

---

### U-38. Workspace tab labels are hidden below the small breakpoint

**Where:** `AnalyticsWorkspace.tsx:244`.

```
<span className="hidden sm:inline">{label}</span>
```

**What happens:** At narrow widths the tab bar becomes six unlabelled icons: a
table, a bar chart, a beaker, a calculator, a light bulb and a cube. The `aria-label`
at `:233` keeps it usable for screen readers, which means the visual presentation
is the degraded one.

**Fix:** Keep labels. Wrap to a second row. Reduce to four items, per `IA.md`
section 4.

---

### U-39. CSV and XML files are read twice before analysis starts

**Where:** `validator.ts:156` calls `file.text()` for the content scan;
`prismStore.ts:155` calls `file.text()` again to get the content.

**Fix:** Read once, scan the string already in hand.

---

### U-40. Excel parsing blocks the main thread while the progress card is on screen

**Where:** `prismStore.ts:111-136` runs `XLSX.read` synchronously on the main
thread. The row cap at `:82` bounds it but does not make it yield.

**What happens:** During the parse the tab cannot repaint, so the progress card
freezes at whatever it last rendered, which reads as a hang.

**Fix:** Move workbook parsing into the worker. This also removes the only
main thread consumer of the `xlsx` dependency, which is relevant to the migration
described in the technical strategy documents.

---

### U-41. Raw exception text is shown to the user

**Where:** `prismStore.ts:417` passes `error.message` from the worker `onerror`
straight into the user visible `ProcessingError`. `AnalyticsWorkspace.tsx:628`
stores `String(error)` and renders it at `:1396`.

**Fix:** Map known failures to sentences. Put the raw text behind a disclosure
with a copy control, per `USER_FLOWS.md` section 7.3.

---

### U-42. The error code attached to a worker failure is overwritten with the wrong one

**Where:** `processData`'s message handler sets a correct `ProcessingError` and
then rejects (`prismStore.ts:397-408`). That rejection is caught by `setFile` at
`:310`, which overwrites the state with `code: 'FILE_ERROR'` and resets
`processing` to `initialProgress`, so `status` ends as `'idle'` rather than
`'error'`.

**What happens:** The user sees the right sentence under the wrong
classification, and the store's own status field disagrees with what happened.
Not directly visible today because `App.tsx:365` renders only `error.message`,
but it will mislead the first person who debugs from state.

**Fix:** Do not re-wrap an error that has already been classified.

---

### U-43. Every chart carries an audio control panel that cannot be turned off

**Where:** `SmartChart.tsx:293` defaults `enableSonification` to `true`;
`App.tsx:519` passes `accessibility.sonificationEnabled`, which initialises true
(`prismStore.ts:37`) and is never written by any control. The panel renders at
`SmartChart.tsx:576-586`.

**What happens:** Every chart in the Quick Summary view is followed by a labelled
audio playback row. Sonification is a genuinely good accessibility feature and
should stay, but it is currently mandatory furniture on every chart for every
user.

**Fix:** One preference in the Display popover, plus a per chart control. Default
off, discoverable, and mentioned once in the accessibility section rather than
repeated on every chart.

---

### U-44. The screen reader data table is capped at 100 rows without that cap being explained in context

**Where:** `SmartChart.tsx:202` slices to 100. `:210-218` renders a footer saying
"Showing first 100 of n rows."

**What happens:** The footer is honest, which is more than the visible chart
manages (U-01). But `n` here is the already truncated `config.data.length`, so
for a scatter the table says "Showing first 100 of 500 rows" when the source had
over a million. The non sighted user gets a truncation notice about a truncation,
with no mention of the first one.

**Fix:** Once the worker returns the source count (U-01), the table footer states
both reductions: rows drawn, rows in the chart, rows in the file.

---

### U-45. The Statistics tab's running indicator is not scoped to the tab

**Where:** `AnalyticsWorkspace.tsx:1379` renders `{isRunning && ...}` with no
`activeTab` guard. The equivalent blocks on Visualize (`:1027`) and Preprocess
(`:1175`) both guard with `&& activeTab === '...'`.

**What happens:** Inconsistent within one component. Low impact today because the
panels unmount, but it is the kind of asymmetry that becomes a bug the moment the
panels stop unmounting.

**Fix:** Consistent guard, or better, one shared running indicator owned by the
workspace rather than three copies.

---

### U-46. There is no export of any kind

**Where:** Nowhere. No output `Blob`, no `<a download>`, no clipboard write, no
print stylesheet anywhere in `src/`. The only `URL.createObjectURL` builds the
worker (`prismStore.ts:178`).

**What happens:** A user can compute an answer and has no way to get it out of
the tab except a screenshot. Nothing persists, so closing the tab destroys it.

**Why it is only S3 here:** It is not a defect in a built flow; it is a missing
flow, and it is treated as such in `USER_FLOWS.md` section 8, where it is ranked
as the largest product gap. It appears in this register so the count is honest.

---

## 4. S4: polish

### U-47. The text size control is labelled "A", "A+", "A++"

**Where:** `App.tsx:178-188`. The `aria-label` on the select is "Adjust font
size" (`:184`), but the options themselves are single characters, so a screen
reader user choosing an option hears "A", "A plus", "A plus plus".

**Fix:** "Normal", "Large", "Extra large" as option text. Keep the visual
shorthand as a separate presentational element if the compactness matters.

---

### U-48. Every anchor in the document is forced to 44 pixels tall

**Where:** `src/styles/index.css:95-101` applies `min-height: 44px` to `button`,
`[role="button"]`, the three input button types, `select` and `a`.

**What happens:** The touch target rule is right for controls and wrong for `a`,
which is also the element used for inline text links. An inline link inside a
paragraph gets a 44 pixel minimum height, disturbing line boxes.

**Fix:** Scope the rule to block level and standalone links, or apply it through
the `.touch-target` utility that already exists at `:381-384`.

---

### U-49. The insight card repeats its own content for screen readers

**Where:** `InsightCard.tsx:53-60` sets `aria-labelledby` to the title and
`aria-describedby` to the description. `:113-116` then renders
`insight.accessibleDescription` in an `sr-only` paragraph inside the same
article.

**What happens:** A screen reader reading the article linearly hears the title,
the description, the affected columns, the confidence, and then a restatement.

**Fix:** Either use `accessibleDescription` as the described-by target and drop
the visible description from the accessibility tree, or drop the `sr-only`
paragraph. Not both.

---

### U-50. Pie chart labels bypass the sanitiser used by the data table in the same component

**Where:** `SmartChart.tsx:465` interpolates raw cell values into the label.
`:205` runs the same class of value through `sanitizeValue`.

**What happens:** Not an injection risk, because Recharts renders the label as
SVG text content. But it is an inconsistency inside one file, and an unbounded
cell value becomes an unbounded label.

**Fix:** Route both through `sanitizeValue` and truncate label length.

---

## 5. Summary table

| ID | Severity | Issue | Primary location |
| --- | --- | --- | --- |
| U-01 | S1 | Charts truncate silently and report the truncated count | `SmartChart.tsx:538`, `worker:1003-1087` |
| U-02 | S1 | Only the first worksheet is read, undisclosed | `prismStore.ts:118` |
| U-03 | S1 | Preprocessing reports success, applies to nothing | `AnalyticsWorkspace.tsx:658`, `:1202` |
| U-04 | S1 | One bad file locks the multi dataset zone permanently | `DatasetManager.tsx:358-364` |
| U-05 | S1 | Chart summary can state "increasing by Infinity%" | `SmartChart.tsx:137` |
| U-06 | S1 | Error surface unmounts after the first success | `App.tsx:238-399` |
| U-07 | S1 | No error boundary; a render exception is total loss | none in `src/` |
| U-08 | S1 | Significance coloured as success and failure | `AnalyticsWorkspace.tsx:1414-1429` |
| U-09 | S1 | A missing field renders as a definite negative result | `AnalyticsWorkspace.tsx:1423` |
| U-10 | S2 | Fifteen buttons have no handler | `AnalyticsWorkspace.tsx:1502`, `:1522`, `:1610` |
| U-11 | S2 | File rejection invisible to sighted users | `FileUploader.tsx:81-93`, `:246` |
| U-12 | S2 | Multi dataset rejection has no feedback at all | `DatasetManager.tsx:366-375` |
| U-13 | S2 | Recovery destroys the warm runtime | `App.tsx:373`, `prismStore.ts:331` |
| U-14 | S2 | Progress runs backwards and completes early | `worker:1320-1439` |
| U-15 | S2 | Warm up progress hijacks the analysis handler | `prismStore.ts:197`, `:369` |
| U-16 | S2 | Content scan fatally rejects ordinary business text | `validator.ts:61-70`, `:169` |
| U-17 | S2 | "AI-Generated" label and fabricated confidence meter | `App.tsx:489`, `InsightCard.tsx:99` |
| U-18 | S2 | Unsupported compliance badges in the UI | `App.tsx:386`, `:619`, `:622` |
| U-19 | S2 | Results tab bar is a broken ARIA tabs pattern | `App.tsx:425-456` |
| U-20 | S2 | Recommended test card is a keyboard-unreachable div | `AnalyticsWorkspace.tsx:1262` |
| U-21 | S2 | Focus dropped at every view change | `App.tsx:238`, `:399` |
| U-22 | S2 | Destructive controls hidden until hover, focusable | `DatasetManager.tsx:100`, `:329` |
| U-23 | S2 | Skip link targets an id that disappears | `index.html:124`, `App.tsx:240` |
| U-24 | S2 | Chart title input unlabelled and inert | `AnalyticsWorkspace.tsx:978` |
| U-25 | S2 | `window.alert` used for validation | `AnalyticsWorkspace.tsx:610`, `:636`, `:660` |
| U-26 | S2 | One selection state, three incompatible meanings | `AnalyticsWorkspace.tsx:289` |
| U-27 | S2 | Theme toggle's first click does nothing | `prismStore.ts:35`, `App.tsx:137` |
| U-28 | S2 | Advertised size limit contradicts its own comment | `validator.ts:17-20` |
| U-29 | S3 | Four accessibility settings have no UI | `prismStore.ts:33-39` |
| U-30 | S3 | Display preferences not persisted | `App.tsx:136-150` |
| U-31 | S3 | Progress card triple-announces on every tick | `App.tsx:320-355` |
| U-32 | S3 | Static banner marked `role="status"` | `App.tsx:225` |
| U-33 | S3 | Dataset columns detected by naive comma split | `prismStore.ts:503` |
| U-34 | S3 | Accepted formats differ between upload paths | `DatasetManager.tsx:368` |
| U-35 | S3 | Join builder validates nothing | `DatasetManager.tsx:129-141` |
| U-36 | S3 | Removing a dataset silently removes links | `prismStore.ts:526` |
| U-37 | S3 | Two screens show the same data with different labels | `App.tsx:458`, `AnalyticsWorkspace.tsx:784` |
| U-38 | S3 | Tab labels hidden below the small breakpoint | `AnalyticsWorkspace.tsx:244` |
| U-39 | S3 | CSV and XML read twice | `validator.ts:156`, `prismStore.ts:155` |
| U-40 | S3 | Excel parsing blocks the main thread | `prismStore.ts:111` |
| U-41 | S3 | Raw exception text shown to the user | `prismStore.ts:417` |
| U-42 | S3 | Worker error re-wrapped with the wrong code | `prismStore.ts:310` |
| U-43 | S3 | Sonification panel on every chart, no control | `SmartChart.tsx:293`, `:576` |
| U-44 | S3 | Accessible table notice describes a truncation of a truncation | `SmartChart.tsx:202` |
| U-45 | S3 | Statistics running indicator not scoped to its tab | `AnalyticsWorkspace.tsx:1379` |
| U-46 | S3 | No export exists | nowhere |
| U-47 | S4 | Text size options labelled "A / A+ / A++" | `App.tsx:178-188` |
| U-48 | S4 | 44px min-height applied to every anchor | `index.css:95-101` |
| U-49 | S4 | Insight card duplicates its content for screen readers | `InsightCard.tsx:113-116` |
| U-50 | S4 | Pie labels bypass the sanitiser used in the same file | `SmartChart.tsx:465` |

---

## 6. Suggested fix order

Ordered by damage per unit of work, not by severity alone.

**Wave 1, nothing to design, high credibility return**

U-10 (delete fifteen buttons), U-18 (remove unsupported badges), U-17 (rename and
remove the meter), U-04 (`try`/`finally`), U-05 (guard the division), U-25
(remove `alert`), U-24 (remove the inert field), U-45 (consistent guard).

**Wave 2, small components, large behavioural fixes**

U-11 and U-12 (one rejection panel, two call sites), U-06 (move the error
surface), U-07 (error boundary), U-13 (split reset from terminate), U-19 (one
`Tabs` component, three call sites), U-20, U-21, U-22, U-23.

**Wave 3, needs a decision from another team first**

U-01 (worker must return the source count), U-02 (sheet chooser), U-03
(preprocessing semantics), U-28 (measured size limit), U-40 (parse in the
worker), U-16 (scan policy).

**Wave 4, IA work**

U-26, U-27, U-29, U-30, U-32, U-37, U-38, U-46, and the rest of the S3 and S4
entries, folded into the migration order in `IA.md` section 11.

---

## 7. Out of scope for this register

The following were noticed while reading but belong to other owners and are not
counted above:

- Statistical correctness of the seventeen tests, including
  `worker:603` and `:699` taking `unique()[:2]`, and `worker:576` subsampling to
  5,000 rows for normality testing. Owned by the technical strategy documents.
- Whether a `blob:` worker inherits the document CSP in every supported browser.
  Owned by the technical strategy documents. It is the one question that decides
  what `ONBOARDING.md` section 8.2 is allowed to say.
- The `xlsx@0.18.5` advisory and the bundle split. Owned by the technical
  strategy documents.
- The LICENSE, `package.json` and README incoherence. Owned by the business
  documents.
