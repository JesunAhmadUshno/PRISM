# PRISM: the plan

Read this first. It stands alone. The six documents behind it (01 to 06) hold the
evidence; this holds the decisions. Every element is tagged NOW (pandas, scipy and the
browser can do it today), NEXT (real work, months) or RESEARCH (unproven).

Written by the first mate after the chief-of-staff agent hit a session limit. Where two
functions disagreed, the call is made below and the losing side is named.

## 1. The product, in one paragraph

PRISM is a local examiner for spreadsheets you did not build. You drop in the workbook
someone handed you. No menu appears. It shows a ranked list of findings, each graded
FACT, STATISTICAL or QUESTION, each pointing at the exact rows and cells, each carrying a
plain sentence on how it could be innocent and a question you can copy and send back to
the preparer. Before any finding, it tells you how much of the file it could actually
check and what was missing. Nothing leaves your machine, and you can verify that
yourself. The job it does, in the user's words: *"Before I put my name on a number
somebody else prepared, show me what I would have missed."*

It does not claim to catch lies. It exposes choices: which start month, which segments
were pooled, which three rows carry the average, which columns were not supplied. The
verb is **expose**, never **catch**. That reframing came from the red team (05) and it
overrules the product document's original "find what you missed" framing, because on an
honest file the product finds nothing and "catch" would then be a broken promise.

## 2. Decisions where the functions disagreed

| Question | Decided | Overruled |
| :--- | :--- | :--- |
| The promise | "Expose the choice" (05) | "Catch it" (founder's brief, 01 early sections) |
| Jarvis | A detective who leads. No persona, no name, no chat box waiting for a prompt (01, 04) | A conversational assistant (founder's brief) |
| Local model weights | Bring-your-own or same-origin vendored only (05) | 03's option of pinned-CDN weights: a model fetch reveals IP, timestamp, model identity and page origin to a third party |
| Pyodide from CDN | Vendor it; connect-src becomes 'self' alone; this is a launch gate (06) | Today's jsDelivr fetch, which is the one network event the zero-egress claim currently has to explain |
| Hero demo | Berkeley 1973 as downloaded, with the honest finding (06) | The textbook claim. Measured: the full file shows attenuation, not reversal; reversal appears only inside the six named departments; 64.5% of rows sit in "Other" |
| Report signing | SHA-256 digest NOW; reviewer signature NEXT; nothing called "verified" until it is | 04's "provably never left the machine": an overclaim; the report states the mechanism and claims reproducibility |
| Name | PRISM stays. The report is the tie-out. "Vouch" and "Attest" rejected as overclaims (01) | |

## 3. V1 scope. Ruthless.

**Ships (all NOW):**

1. **Checkability pre-pass.** The first thing on screen, before any finding: "Checked 14
   of 23 things. Nine could not be checked because this file has no transaction detail,
   no formulas, no earlier version. Copy the request that would make it checkable."
   This is the red team's boldest idea and the only defence against an informed
   preparer, because every detector is defeated by the same move: removing information
   from the file. It turns that move into the first visible finding.
2. **Window shift (02, 4.2).** "Start here: +18%. Start one month earlier: minus 4%."
   Highest ranked, most common way a deck misleads, needs no statistics to read.
3. **Simpson's reversal (02, 4.1).** The demo. Aggregate and segments cannot both be the
   story. Automatic search across categorical, binned numeric and date-part columns;
   Mantel-Haenszel adjusted effect; mandatory "is the segment cause or effect" question.
4. **Fragile number (02, 4.3 and 4.4 combined).** The mean carried by three rows, or the
   big percentage on a tiny denominator. "Sort descending, delete the top 3, re-average."
5. **Duplicate pre-pass, gated.** Fires only when an identifier or amount column exists.
   Ungated, it fires 12,735 times on the Berkeley demo file, because every column there
   is a category. That would be a false FACT on camera.
6. **The interrogator, Layer 0.** Deterministic. The system speaks first. Templated
   language, grounded follow-up choices, every number cited to a check id. Works with
   no model present. This is the whole conversational layer for v1.
7. **The tie-out report.** Every finding, its evidence, what was and was not checked,
   a SHA-256 digest, and the sentence "unsigned; rerun to reproduce." No tick. No
   "clean." A clean report is a list of what was checked and what could not be.

**Deliberately excluded from v1, with the reason:**

- Any language model (NEXT). Layer 0 must prove the product without one.
- Detectors 5 through 20 in 02's ranking. Each is specified; none ships until the
  headline false-alarm rate on honest files is measured.
- Formula-mask detectors (hardcoded totals, overwritten formulas). NEXT: needs SheetJS
  formula extraction that the current read options disable.
- Multi-file reconciliation. NEXT: two named shapes only (03, 3.6), never general joins.
- Report signing beyond a digest. NEXT.
- Person-level attribution, scoreboards, cross-file aggregation by person. Never.

## 4. What gets deleted from today's PRISM

The founder must see the cost plainly. From 03, section 3.2:

| Component | Lines | Why |
| :--- | ---: | :--- |
| `AnalyticsWorkspace.tsx` | 1,697 | All six tabs. The 17-test menu nobody could use; a models tab that is a mock with a dead button |
| `DatasetManager.tsx`, `LinkBuilder` | 505 | General N-way joins with a silent fallback |
| `merge_datasets` | ~90 | Silent fallback, unchecked joins |
| `src/python/prism_core.py` | 687 | Dead draft; its path becomes the real engine package |
| `generate_insights`, `recommend_visualizations` | ~80 | A row count with confidence 1.0 and a straight-line fit |
| The entire preprocessing menu | | Fill, normalise, log, remove outliers: exactly what a preparer uses to make a file say what they want. **PRISM is read-only.** An examiner that can alter evidence has a conflict of interest |
| ML types, `ANALYTICS_METHODS`, `modelMetrics` | | Types for features that do not exist |

Roughly 3,000 lines. About a third of the application.

## 5. What is kept, and why the last 24 hours were not wasted

The worker and Pyodide loader with SRI. The security layer and CSP, including the
blob: fix. All 152 tests and both CI gates. The vendored SheetJS. The Refraction visual
language on both surfaces. The audit gate at zero advisories. The pytest harness for
the Python engine, which is exactly the harness the detectors need.

None of that was about the 17-test menu. It was about a browser that runs Python on a
file without sending it anywhere and can prove it. That is the foundation this product
stands on, and it is finished.

## 6. The first two days

The founder was promised: build Simpson's reversal first, end to end, on real data, and
if it works the product is real. From 06, week W1:

**Dataset.** UC Berkeley 1973 admissions, per-applicant CSV, 12,763 rows, hosted at
`waf.cs.illinois.edu/discovery/berkeley.csv`, SHA-256 recorded in the kit. Dropped as
downloaded, nothing removed.

**"Works" means, in pytest, before any UI exists:**

- On the six itemised departments: crude admission 44.5% men against 30.4% women;
  Mantel-Haenszel adjusted odds ratio 0.904; women ahead in four of six departments.
- On the full file including "Other": the detector reports attenuation (adjusted OR
  1.184), not reversal, and says the Other bucket is 64.5% of rows and cannot be split.
- On Titanic (control): reports an interaction, not a reversal.
- On a synthetic random file: reports nothing after Benjamini-Hochberg.
- The duplicate pre-pass does not fire on Berkeley.

**The finding card shows:** the observation in one sentence; the mix table (which group
applied where); the adjusted number beside the crude one; "how this could be innocent"
(women applied to the harder departments); the question to ask ("was department chosen
before or after the outcome?"); the rows, on demand.

**The report contains:** that card, the checkability screen, the digest, "unsigned."

If those five pytest assertions are green in two days, the product is real. If they are
not, we know in two days rather than two months.

## 7. Honest risks, ranked (from 05)

1. **A false FACT reaches a board.** Release-blocking. FACT is reserved for arithmetic
   the user can recompute; everything heuristic is QUESTION at most. A clean corpus of
   real management packs must yield zero FACT findings per release. That corpus does not
   exist yet and is the first thing to build after W1.
2. **Headline false-alarm rate on honest files.** Pareto revenue fires the outlier
   detector on every business. Nested P&L subtotals fire arithmetic checks. Each has a
   specified gate in 05 section 2. Unmeasured until the corpus exists.
3. **The informed preparer.** Pre-aggregate, drop the confounding column, send a PDF.
   No statistic detects an absent column. The checkability screen is the answer, and it
   converts the evasion into a finding. Untested whether preparers respond by sending
   more or by learning which columns to drop (kill criterion 3).
4. **Automation bias.** The CEO stops thinking. No tick, no "clean," and every finding
   carries its innocent explanation.
5. **Weaponisation.** A CEO uses finding cards to bully staff. Cards survive cropping as
   one block; person-like attribution is one click down and off the copy by default.
6. **Legal.** "Tie-out" from an ex-auditor may read as quasi-assurance. Counsel question,
   open, blocks the W5 exit criterion in 06.
7. **Model download as egress.** Resolved by decision: no CDN weights, ever.

## 8. Kill criteria, so this is a bet and not a belief

From 01: the tie-out finds nothing on real packs; wedge CEOs would rather ask their
controller; preparers sabotage rather than adopt. From 05: headline false-alarm rate on
honest packs too high; a false FACT reaches a board.

Any one of these, measured, ends the pivot. That is what makes the next two days worth
running.

## 9. Sequencing (from 06, relative weeks)

W1 detector reproduces Berkeley in pytest. W2 to W4 the two other v1 detectors and the
checkability pre-pass, golden files for each. W5 the clean corpus and the false-alarm
measurement, plus counsel on "tie-out." W6 to W8 the case-file UI and the report. W9
Show HN, browser offline after load, Pyodide vendored. W12 kill-criteria review.

## 10. Open questions the founder alone can answer

- Which real management accounts workbooks can we get, with permission, for the clean
  corpus? Your audit network is the source.
- Five conversations with private-company CEOs who receive a monthly pack. Do they drop
  the file, or would they rather ask their controller?
- Do you voice the ninety-second video? Your credibility is the asset.
