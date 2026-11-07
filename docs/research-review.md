# Research and engineering review

Date: 2026-11-07. Scope: the segment-reversal detector (`src/python/prism/`), the
browser statistics engine (`src/workers/prism.worker.js`), their tests, CI, and the
lab dashboard (`site/`, served at `/PRISM/lab/`). Graded the way a thesis committee
grades a methods chapter, plus the engineering rigor a shipped product needs.

**Overall: B+.** The statistics are strong: published-reference tests, digest-pinned
real data, BH calibrated under the null, spec deviations written down. But the
product claim is ahead of what is wired up: the detector the headline describes is
not yet in the app people use.

## Rubric

| Criterion | Grade | Evidence | Gap |
| :--- | :--- | :--- | :--- |
| Research question | A- | `docs/vision/00_PLAN.md`, `02_DETECTORS.md`: can software flag a misleading aggregate (Simpson's reversal, attenuation) in a spreadsheet without a statistician? | The acceptable false-alarm rate for a board pack is named as the deciding number but has no target yet. |
| Hypotheses | B+ | Five pre-stated W1 assertions with expected values (Berkeley crude 44.5% vs 30.4%, adjusted OR 0.904, full file attenuation, Titanic interaction, null file silent). All five measured in `07_W1_RESULT.md`. | The assertions came from known datasets, so they test correctness, not usefulness. |
| Method | A- | Mantel-Haenszel OR, CMH, Breslow-Day with Tarone, Cramer's V mix gate, bootstrap sign stability, catch-all set-aside pass. Every threshold named in `columns.py` and `Thresholds`. | `02_DETECTORS` 4.1 not amended for the built pooling rule (max(p_mix, p_segment)) and the attenuation mix gate; only the W1 doc records them. |
| Baselines | B | Published tables (Bickel et al.; R `UCBAdmissions`), R and SciPy reference values for each test. | No comparison against an existing tool (for example a plain stratified CMH screen, or a causal-discovery package) on the same files. |
| Statistics and uncertainty | A- | BH over every evaluated triple; the CMH p shown beside the pooled confounding p so a within-segment lead is not overstated; bootstrap stability (300 resamples). Breslow-Day and CMH rejection under the null measured (5.2%, 4.7%). | No interval on the adjusted OR on the finding card; stability is a sign rate, not a CI. |
| Reproducibility | A | Golden CSVs pinned by SHA-256 and downloaded on first use; snapshot JSON for drift; exact pip pins; 94 pytest cases pass locally in 7 s; the lab rebuilds its numbers from those files and asserts them before deploy. | `regenerate.py` is manual; nothing records which commit last regenerated a snapshot. |
| Threats to validity | B | The W1 doc names the collider case (Titanic Pclass x Sex split by Survived) and the catch-all; the card flags a segment column whose name reads as an outcome. | Causal order is a name heuristic (`z_reads_as_outcome`). Confounder vs collider vs mediator cannot be told apart from the data alone. |
| Related work | C+ | Bickel, Hammel and O'Connell (1975); Mantel and Haenszel (1959); Benjamini and Hochberg (1995) are cited in code and docs. | No written survey of automated Simpson's-paradox or "insight" detection tools, so novelty is asserted, not argued. |
| Limitations | B+ | README publishes what is not claimed (no certifications) and the accessibility gaps; the W1 doc says the browser still runs the old engine. | Spread across many files; the lab's limits window now collects the main ones. |
| Engineering rigor | B | Typecheck, ESLint, vitest (106), a11y suite (12), build, CSP and security tests, deploy gated on tests. | See open gaps 1, 4 and 6. |

## Fixed in this pass

1. **Red CI.** `npm audit --audit-level=high` failed on main (1 critical, 4 high in
   vite and undici). A non-breaking `npm audit fix` cleared them; typecheck, vitest,
   the a11y suite and the build pass. The ci.yml comment that claimed zero
   advisories now states what `npm audit` reports (no high or critical, 9 moderate in
   lint tooling).
2. **A drift guard for the headline numbers.** `site/src/stats.check.mjs`
   recomputes the crude and Mantel-Haenszel odds ratios, CMH p-values and
   reversed-stratum flags from `berkeley.json`, Benjamini-Hochberg against a hand
   case, and three known answers from `test_statistics.py` at their own tolerances.
   It runs inside `npm run build`, which deploy.yml runs before shipping.
3. **Receipts that cannot go stale.** The lab counts test functions, test files and
   workflows at build time instead of quoting a hand-typed table.

## Found while building the lab

- **The W1 doc and the Titanic snapshot disagree on the grade mix.**
  `07_W1_RESULT.md` says 12 findings: 4 attenuation, 1 full reversal, 7 interaction.
  `tests/python/expected/titanic.json` (the current pinned output) has 5
  attenuation, 1 full and 6 interaction. Total and the full reversal agree. Either the
  snapshot was regenerated after the doc or the doc miscounted; the lab shows the
  snapshot. Cost to resolve: re-run `regenerate.py` (seconds) and amend one line.
- **README receipts.** "9 test files" matches the TypeScript suites (7 vitest + 2
  a11y) but leaves out the 6 Python modules (89 test functions), the strongest tests
  in the repo. "Files in repo 120" is hand-typed. Left for the Owner to decide.

## Open gaps and what each needs

1. **Wire the detector into the app.** The browser worker still runs the older
   embedded engine. Needs: load `src/python/prism/` into Pyodide (03_ARCHITECTURE
   3.4), a worker message for findings, and a UI card. Engineering only, an estimated one
   to two weeks; no compute.
2. **Measure the false-alarm rate on real business data.** 12 findings from 119
   triples on Titanic is called too many for a board pack. Needs: the W5/W6 corpus of
   consented, real management spreadsheets (size set by the precision target; a few
   dozen files gives a CI of roughly plus or minus 10 points), each labelled by an analyst as
   "worth raising" or not, then precision per file with a bootstrap CI. Data
   collection is the cost; the run itself is seconds per file on a laptop.
3. **Causal order.** Needs either user input (mark outcome and timing columns) or
   a constraint-based check, tested on synthetic DAGs with known colliders (a few
   thousand simulated files, CPU minutes).
4. **Deferred backlog with no status.** `LEDGER.md` lists unverified items (for
   example a Fisher test that may drop all but one 2x2 block, and a "two-way ANOVA"
   that is two one-way ANOVAs with min p). Some may be fixed by the known-answer
   tests. Needs: one known-answer test per item (an R x C Fisher case, a balanced
   two-way design against R `aov`), CPU seconds.
5. **Spec drift.** Amend `02_DETECTORS` 4.1 steps 7 and 8 to the built rules. Text
   only.
6. **Remaining detectors.** Window-shift and fragile-number (4.2 to 4.4) are
   specified, not started. Each needs its own golden file and null-calibration test,
   as segment reversal has.
7. **Accessibility.** WCAG 2.2 AA is the target with published contrast failures
   and no screen-reader pass. Needs: fix the listed contrast pairs, then a manual
   NVDA and VoiceOver session (a few hours, no compute).
8. **Uncertainty on the card.** Add a CI for the adjusted OR (Robins-Breslow-
   Greenland variance, closed form, no compute) so the card is not a point estimate.
9. **Related work.** A two-page survey of automated insight and paradox detection,
   to turn the novelty claim into an argument. Reading time only.
