# W1 result: the segment-reversal detector on real data

Date: 2026-09-13. Scope: docs/vision/00_PLAN.md section 6, "the first two days".
Status: **the five assertions are green.** The product is real in the sense the
plan defined: one detector, end to end, on a file as downloaded, with numbers a
sceptic can recompute.

## What was built

| Path | What |
| :--- | :--- |
| `src/python/prism/` | The engine package. Real `.py` files, imported by pytest, to be written into Pyodide by the worker (03_ARCHITECTURE 3.4). No template literal. |
| `prism/columns.py` | Column roles: identifier, binary, categorical, numeric, amount, datetime, text. Every threshold named, with its reasoning. |
| `prism/evidence.py` | The `Finding` record. Confidence is an enum. Numbers appear as formatted strings in `slots` and raw values in `aggregates`. Deterministic ids. |
| `prism/multiplicity.py` | Benjamini-Hochberg, pinned against `scipy.stats.false_discovery_control`. |
| `prism/detectors/segment_reversal.py` | 02_DETECTORS 4.1 in full: automatic (X, Y, Z) search, Mantel-Haenszel adjustment, CMH, Breslow-Day with Tarone, Cramer's V mix gate, bootstrap stability, tertile confirmation for binned Z, the catch-all set-aside pass (06_LAUNCH request D2), one finding per comparison and outcome pair. |
| `prism/detectors/duplicates.py` | The gated duplicate pre-pass (request D1). Runs only when an identifier or amount column exists. |
| `prism/detectors/__init__.py` | `run_detectors(df)`: findings plus the checkability data (what ran, what did not apply and why). |
| `schema/finding.schema.json` | The wire contract. Every finding from every golden run validates against it. |
| `tests/python/` | 37 new tests (79 total). Golden files are digest-pinned and downloaded on first use; a mismatch fails, it does not skip. Snapshots under `tests/python/expected/` guard drift. |

Nothing under `src/` that the browser runs has changed. The worker still
executes the old embedded engine. Wiring the package into Pyodide is the next
step, not this one.

## The five assertions, measured

| Assertion (00_PLAN section 6) | Result |
| :--- | :--- |
| Six departments: crude 44.5% men vs 30.4% women | 1,198 of 2,691 and 557 of 1,835. Exact. |
| Six departments: adjusted odds ratio 0.904 | 0.9038 on the file. Graded MAJORITY reversal; 4 of 6 departments reversed; adjusted gap 1.9 points in favour of women; bootstrap sign stability 89%. |
| Full file: attenuation, not reversal; Other is 64.5% | Adjusted OR 1.184, crude 1.504; grade ATTENUATION on all rows; Other at 64.5%, named on the card with "cannot be split"; the reversal reported as "inside the named segments". Exactly one finding on the file. |
| Titanic: interaction, not reversal, for sex by class | INTERACTION, severity low, no stratum reversed, no reversal for sex and survival under any segment column. |
| Random file: nothing after BH | Zero findings across 3,000 or more tested triples, three pinned seeds. |
| Duplicate pre-pass does not fire on Berkeley | "did_not_apply: every column is a category". On Titanic it runs on PassengerId and finds none. |

## Three things the build found that the plan did not know

1. **The hosted file is not the textbook table.** The Illinois per-applicant
   CSV differs from Bickel et al. table 1 (R's `UCBAdmissions`) in two cells:
   department C women admitted 201 against 202 published, department F 25
   against 24. Totals agree. So the file's adjusted odds ratio is 0.9038
   (shown as 0.904) where the published table gives 0.9047 (0.905). The
   launch material quotes 0.904 and must say it is the file's number, not the
   paper's. This is precisely the class of thing the product exists to
   surface, and the suite surfaced it on day one.

2. **The pooled p-value had to change, or Berkeley would have been
   "not significant".** 02 section 4.1 step 8 pools the CMH p of the adjusted
   effect. On the six departments that p is 0.21: the within-department lead
   for women is not distinguishable from zero, which is also what Bickel et
   al. concluded. The finding is not "women are ahead within departments";
   the finding is "the 14-point overall lead for men is mix". So the pooled
   hypothesis is confounding, whose two necessary conditions are mix
   (X associated with Z) and segment association (Z associated with Y). Both
   must hold, so the pooled p is the larger of the two. The adjusted effect's
   own p is shown on the card so the within-segment lead is never overstated.
   02 section 4.1 should be amended to match.

3. **Grading before correcting is the whole false-positive problem.** The first
   draft graded each triple, then applied BH only to the graded ones. On
   random data that produced eighty "interaction" findings from 189 tests.
   Breslow-Day and CMH were both calibrated (5.2% and 4.7% rejection under the
   null, now a test); the error was selection. Every evaluated triple now
   enters the pool, in two hypotheses (confounding, heterogeneity), and a
   structural grade becomes a finding only if its q-value survives. The
   synthetic control pins this.

## The first false-alarm data point

Titanic, 891 rows, 12 columns: 119 triples tested, **12 findings** after
control and per-pair merging (4 attenuation, 1 full reversal, 7 interaction).
Every one is arithmetically true. Several are the kind a CEO would not thank
us for: "male passengers had fewer siblings aboard, until you hold fare
constant". The full reversal (first class had a higher share of women, until
you split by survival) is the textbook collider: splitting by a consequence.
The detector cannot know causal order; the card now flags a segment column
whose name reads as an outcome and leads with the mediator question.

This is the number 05_RED_TEAM said would decide the product, and it is now
measurable. The clean corpus of real management packs (W5 and W6) is where
the acceptable headline rate gets set. Twelve on Titanic is too many for a
board pack and about right for a dataset built to be interesting.

## Deviations from the spec, recorded

| Where | Spec | Built | Why |
| :--- | :--- | :--- | :--- |
| 02 4.1 step 8 | Pool the CMH p | Pool max(p_mix, p_segment); CMH p shown beside the adjusted effect | See finding 2 above |
| 02 4.1 step 7 | Mix gate for FULL and MAJORITY | Mix gate for ATTENUATION as well | Attenuation without mix is arithmetically impossible too |
| 02 4.1 grade | INTERACTION not a grade | INTERACTION grade, severity low, effect-size gate (largest stratum effect at least twice the smallest) plus BH on Breslow-Day or the interaction F | The plan's Titanic assertion requires it |
| 02 4.1 | Report all surviving triples | One finding per (comparison column, outcome column); alternates listed under `also_holds_for` | 59 findings on Titanic before merging, 12 after |
| Two binary columns | Both orientations tested | One orientation: the outcome-named column, else the rightmost, is Y | The odds ratio is symmetric; two cards for one table is noise |

## What is next (W2 in 06_LAUNCH)

- Wire `src/python/prism/` into the worker: `import.meta.glob` the package as
  raw strings, `FS.writeFile` into Pyodide, `import prism`, a
  `RUN_DETECTORS` message. Then delete the embedded engine and
  `extract_engine.py`.
- Window shift (4.2) and fragile number (4.3 and 4.4) detectors, with their
  golden files.
- The checkability screen's request text ("send the file with these columns")
  from the `checks` block.
