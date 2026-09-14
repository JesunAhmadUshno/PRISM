# 02_DETECTORS: The Deception Catalogue

Author role: Detection Scientist. Scope: the product's engine. This file specifies
every way a spreadsheet misleads a decision maker that PRISM can detect on the user's
own machine with pandas, numpy and scipy, and the evidence it must show so the user can
check the finding with their own eyes.

Read this together with the Jarvis/conversation document. The split is: this file says
WHAT is found and WHAT PROOF is attached. The conversation layer says HOW it is told.
Nothing in this file needs a network connection, a model download or a cloud call.
That is not a limitation we are working around. It is the reason the design below is
built on stratification, recomputation and row-level evidence instead of on a language
model's opinion: a deception detector that cannot show its rows is itself a deception.

House conventions used throughout:

- FEASIBILITY tags: NOW (pandas/scipy/numpy in the browser today), NEXT (real work,
  months), RESEARCH (unproven).
- Threshold provenance tags: CITED (a real source is given), ASSUMPTION (our judgment,
  with the reasoning, to be tuned on the golden datasets in section 6), DATA-DRIVEN
  (the threshold is computed from the user's own file, e.g. a permutation or bootstrap
  null, so no fixed constant is needed).
- Every number in this document that describes the world is either cited or labelled
  ASSUMPTION. Every number that describes the user's data is produced at runtime from
  their file.

---

## 1. What runs today (inventory from src/workers/prism.worker.js)

Read before designing, because the detectors below reuse it rather than replace it.

Present and reusable:

- Parsing: `pd.read_csv` with a python-engine separator sniff fallback, cached by
  content string so repeated actions do not re-parse.
- Type inference (`_infer_column_type`): boolean, datetime (via `pd.to_datetime` on the
  first 100 non-null values), numeric, categorical (numeric with 10 or fewer distinct
  values, or object with 20 or fewer distinct values, or object with average string
  length 50 or under), text. The detectors use exactly these buckets, and the
  "categorical" bucket is the search space for the Simpson's paradox scan.
- Per-column statistics: count, null count, unique count, mean, median, std, min, max,
  Q1, Q3, mode, top 10 values.
- Charts already carry `plottedRowCount`, `totalRowCount`, `truncated`,
  `truncationNote`. This honesty-in-metadata pattern is the model for every detector
  output.
- scipy.stats is loaded lazily and the following are already exercised: shapiro,
  ttest_1samp, ttest_ind, ttest_rel, f_oneway, chi2_contingency, pearsonr, spearmanr,
  mannwhitneyu, kruskal, levene, linregress, chisquare, fisher_exact, wilcoxon, f
  distribution. The code already refuses to run two-group tests on more than two
  groups and reports excluded pairs and subsamples. Keep that discipline.
- Preprocessing has `remove_duplicates`, `remove_outliers` (3 sigma), fills and
  transforms. These are actions, not detectors; the detectors below decide when to
  suggest them.
- Multi-dataset merge with pandas `merge` and vertical `concat`.

Absent and required by this document:

- Stratified (grouped-by-a-third-column) comparison of any kind.
- Time-series resampling, window scanning or robust slope (`scipy.stats.theilslopes`
  is available but unused).
- Multiplicity control across many automatic tests (Benjamini-Hochberg). scipy 1.11+
  has `scipy.stats.false_discovery_control`; check the scipy version in the pinned
  pyodide-lock.json for 0.25.1 and, if older, implement BH in numpy (about ten lines).
- Bootstrap or permutation machinery (numpy only, no new package).
- Any duplicate, digit, rounding, unit, label or arithmetic-consistency analysis.
- Row-level evidence: nothing today returns "these are the row indices that carry the
  finding". Every detector below must.

The current `generate_insights` (row count, straight-line fit, `confidence: 1.0`) is
replaced by the detector pipeline. Its hardcoded confidence is precisely the kind of
overclaim section 2.3 forbids.

---

## 2. The detector contract

### 2.1 Output shape

Every detector returns zero or more findings. A finding is a JSON object with these
fields. The conversation layer renders it; the detector never writes prose that
exceeds the evidence.

```
{
  "detectorId": "simpson_reversal",
  "grade": "full | majority | attenuation",        # detector-specific ladder
  "severity": "decision_changing | material | note",
  "observed": "...",       # rung 1: a sentence that is TRUE by construction from the data
  "interpretation": "...", # rung 2: the hedged reading, always with the escape clause
  "question": "...",       # rung 3: the one question the user can answer and we cannot
  "evidence": {
    "tables": [...],        # small tables, every number recomputable from the rows
    "rowIndices": {...},    # named sets of DataFrame index labels the user can open
    "recompute": "..."      # plain-language instructions to verify in Excel
  },
  "testsRun": m,           # how many things this detector tried before finding this
  "adjustedP": ...,        # BH-adjusted p, or null when the finding is not a test
  "stability": ...,        # bootstrap share agreeing with the point estimate, or null
  "nextSteps": [...],      # grounded actions: open rows, rerun without them, ask X
  "wouldChangeMind": "..." # what fact would make this finding go away
}
```

### 2.2 Evidence rules (non-negotiable)

1. Every finding names the rows. Not "some rows", the index labels, and the UI opens
   them. If a finding cannot point at rows it is not a finding, it is a mood.
2. Every headline number in a finding is accompanied by the counterfactual number:
   the mean with and without the rows, the trend with and without the shift, the rate
   with the denominator shown as "k of n".
3. Every finding carries a `recompute` string a non-statistician can follow in a
   spreadsheet: "Filter column Region to North, average column Margin. Repeat for
   South. Compare to the unfiltered average."
4. Counts are shown as counts, never only as percentages. "100%" must always appear as
   "100% (2 of 2)".

### 2.3 The wording ladder

Three rungs, always in this order, never skipping rung 1 and never inventing rung 4.

- Rung 1, Observed: a fact that is true by arithmetic. "The average deal size is 4.1
  times the median. Three rows contribute 61% of the total."
- Rung 2, Interpretation: hedged, with the alternative explanation named. "The
  average is carried by three deals. If they are one-offs, the typical deal is closer
  to the median. If they are your business, the average is the right number."
- Rung 3, Question: the thing only the user knows. "Are those three deals repeatable?"
- There is no rung 4. The product never says "manipulated", "fraud", "lying",
  "cherry-picked" or "the truth is". It says "depends on", "carried by", "reverses
  inside", "warrants a look". Sherlock says "observe the tan line". He does not say
  "you are a liar".

### 2.4 Multiplicity control

A detector suite that runs thousands of automatic tests will find something in every
file. The control is:

- Every detector that produces a p-value contributes it to one pooled list per run.
  Benjamini-Hochberg at q = 0.05 is applied across the pool (ASSUMPTION: q = 0.05 is
  the conventional false-discovery rate; the golden datasets in section 6 decide
  whether it should be tighter for the forensic detectors).
- A finding needs BOTH a surviving adjusted p AND an effect-size gate. Significance
  without size is noise on large files; size without significance is noise on small
  ones.
- The finding reports `testsRun`. "We tried 1,240 segment splits and 3 survived" is
  itself evidence the user deserves.
- Detectors that are not hypothesis tests (duplicates, totals that do not add,
  mixed currency symbols) do not go through BH. They are arithmetic facts.

### 2.5 Pipeline order

Order matters because later detectors trust earlier ones.

1. Hygiene pass: silent truncation (4.15), duplicate inflation (4.5), label drift
   (4.19), mixed units (4.9), arithmetic consistency (4.14). Everything downstream is
   recomputed on the de-duplicated, label-normalised frame, with the raw frame kept
   for evidence.
2. Aggregation traps: outlier-carried mean (4.3), small denominator (4.4), the Other
   bucket (4.7), average of averages (4.17), denominator drift (4.16).
3. Structure: Simpson's reversal (4.1), confounded correlation (4.10),
   missing-not-at-random (4.6), window shift (4.2), survivorship (4.8).
4. Forensic: Benford (4.11), round-number clustering (4.12), suspiciously perfect
   fits (4.13), threshold bunching (4.18).
5. Pooled BH, severity ranking, hand to the conversation layer.

### 2.6 Performance budget in Pyodide

ASSUMPTION: a scan should finish within the time a user tolerates for a file upload.
Design rule: every detector is at most O(rows x columns^2), groupbys are batched so
one `groupby([Z, X])` serves every outcome column at once, and any detector that
needs resampling runs on a fixed-seed sample capped at a row limit, then confirms
hits on the full frame. Fixed seeds (the worker already does this for Shapiro-Wilk)
so the same file gives the same findings twice.

---

## 3. Ranking and the v1 decision

Score = Frequency x Damage x Detectability, each 1 to 3. These are judgments
(ASSUMPTION), not measurements; the reasoning is in each detector's section.
Detectability includes how well false positives can be controlled, because a
detector that cries wolf has negative detectability.

| Rank | Detector | Freq | Damage | Detect | Score | Feasibility |
|---|---|---|---|---|---|---|
| 1 | 4.2 Window shift (cherry-picked time window) | 3 | 3 | 3 | 27 | NOW |
| 2 | 4.1 Simpson's reversal | 2 | 3 | 3 | 18 | NOW |
| 3 | 4.3 Outlier-carried mean | 3 | 2 | 3 | 18 | NOW |
| 4 | 4.4 Small denominator | 3 | 2 | 3 | 18 | NOW |
| 5 | 4.5 Duplicate inflation | 3 | 2 | 3 | 18 | NOW |
| 6 | 4.14 Arithmetic consistency | 2 | 3 | 2 | 12 | NOW |
| 7 | 4.6 Missing-not-at-random | 2 | 3 | 2 | 12 | NOW |
| 8 | 4.10 Confounded correlation | 2 | 3 | 2 | 12 | NOW |
| 9 | 4.7 The Other bucket | 2 | 2 | 3 | 12 | NOW |
| 10 | 4.12 Round-number clustering | 2 | 2 | 3 | 12 | NOW |
| 11 | 4.16 Denominator drift | 2 | 2 | 3 | 12 | NOW |
| 12 | 4.19 Label drift | 3 | 1 | 3 | 9 | NOW |
| 13 | 4.18 Threshold bunching | 2 | 2 | 2 | 8 | NOW |
| 14 | 4.17 Average of averages | 2 | 2 | 2 | 8 | NOW |
| 15 | 4.8 Survivorship (panel form) | 2 | 3 | 1 | 6 | NOW (panel) / RESEARCH (general) |
| 16 | 4.9 Mixed units or currencies | 1 | 3 | 2 | 6 | NOW (symbols) / NEXT (magnitudes) |
| 17 | 4.11 Benford deviation | 1 | 3 | 2 | 6 | NOW |
| 18 | 4.15 Silent truncation | 1 | 3 | 2 | 6 | NOW |
| 19 | 4.13 Suspiciously perfect fit | 1 | 2 | 3 | 6 | NOW |
| 20 | 4.20 Seasonality-blind comparison | 2 | 2 | 1 | 4 | NEXT |

Tie-break among the four at 18: damage first (Simpson's is the only 3), then how
self-verifying the evidence is for a non-statistician.

**v1 ships three detectors and one pre-pass:**

1. **Window shift (4.2).** Highest score, and it is the most common way a deck lies:
   pick the start month. The evidence (a table of "start here: +18%, start one month
   earlier: -4%") needs no statistics to read.
2. **Simpson's reversal (4.1).** The crown jewel and the demo. It is the one finding
   that makes a CEO sit up, because the aggregate and the segments cannot both be the
   story, and the user can check every cell. It also builds the stratified-groupby
   engine that 4.10, 4.6 and 4.4 reuse.
3. **Outlier-carried mean (4.3), packaged with small denominator (4.4) as one
   "Fragile number" detector.** They share one computation (sensitivity of a headline
   to a handful of rows) and one evidence form ("without these k rows the number is
   Y"). Together they cover the two most frequent aggregation traps.
4. **Duplicate inflation (4.5) as a mandatory pre-pass**, because every count, rate
   and mean the other three report is wrong if the rows are doubled. It is a day of
   work and it is a prerequisite, not a feature.

Why not Benford first, given the founder's audit background: Benford has strict
applicability conditions (section 4.11) and most business spreadsheets fail them.
Shipping it first would produce confident nonsense on small or bounded columns,
which is the failure mode constraint B forbids. It belongs in v1.1 with its gates
intact, presented as the auditor's tool it is.

---

## 4. The catalogue

Each detector has eight parts: the deception in plain language, a real-world burn,
the statistical signal, the exact computation, the threshold and its provenance, the
evidence shown, false-positive risk and hedged wording, feasibility.

---

### 4.1 Simpson's reversal (the crown jewel)

**Feasibility: NOW.** groupby, numpy least squares, chi-square, bootstrap with numpy.

#### The deception, plainly

The overall number says A beats B. Inside every segment, B beats A. Both are
arithmetically true. The overall number is driven by mix: A happens to be
concentrated in the segments where everyone does well. Whoever shows you only the
overall number, or only the segments, chooses your conclusion for you.

#### Real-world burn

- University of California, Berkeley graduate admissions, 1973. In aggregate, men
  were admitted at a higher rate than women. Department by department, the pattern
  mostly disappeared or reversed: women applied disproportionately to departments
  with low admission rates for everyone. Bickel, Hammel and O'Connell, Science, 1975.
  https://doi.org/10.1126/science.187.4175.398
- Kidney stone treatment comparison, 1986. The less invasive treatment had the better
  overall success rate and the worse success rate within both the small-stone and
  large-stone groups, because surgeons used it mostly on small stones. Charig et al.,
  BMJ. https://doi.org/10.1136/bmj.292.6524.879
- The business version (ASSUMPTION, illustrative pattern, not a cited case): "the new
  sales process has a higher close rate than the old one" when the new process was
  piloted on inbound leads, which close at a higher rate under any process. Inside
  inbound, and inside outbound, the old process wins.

#### The statistical signal

Let X be a two-level comparison (treatment vs control, new vs old, region A vs B),
Y an outcome (numeric, or a 0/1 event), and Z a third column that partitions the
rows. Define:

- Aggregate effect: E_agg = mean(Y | X=a) - mean(Y | X=b).
- Stratum effect: E_z = mean(Y | X=a, Z=z) - mean(Y | X=b, Z=z).
- Adjusted effect: a weighted combination of the E_z, i.e. what the comparison looks
  like once mix is held constant.

The signal is sign(E_agg) != sign(E_z) for the strata that hold most of the rows,
together with two necessary mechanics: X is unevenly distributed across Z (mix), and
Z is associated with Y (the segments really differ). Without both, a reversal cannot
happen, so both are shown as the "why".

#### The exact computation, including the automatic search for Z

Candidate sets, built from the existing type inference:

- Y candidates: every NUMERIC column; every BOOLEAN column; every CATEGORICAL column
  with exactly two levels, encoded 0/1 (the second-most-frequent level is the event).
- X candidates: every CATEGORICAL column with 2 to 6 levels. For 2 levels, the pair is
  (a, b). For 3 to 6 levels, test each level against all others ("a vs rest") and
  also the two most frequent levels against each other. Cap at 30 X comparisons per
  file, taking the columns with the most balanced levels first (ASSUMPTION: balanced
  comparisons are the ones a deck is likely to headline).
- Z candidates: every CATEGORICAL column with 2 to 20 levels, excluding X and Y; every
  NUMERIC column binned into quartiles and labelled "Q1..Q4 of <col>"; every DATETIME
  column split into year, quarter and month-of-year (each as its own Z). Cap at 40 Z
  per file, dropping the ones with the most tiny strata first.
- Exclusions: Z is dropped for a given (X, Y) if Z is X, Z is Y, Z is a near-copy of
  X (Cramér's V > 0.95), or Z is a deterministic function of Y (detected in 4.14).

Per (X, Z) pair, one grouped pass serves every Y at once:

```python
g = df.groupby([Z, X], observed=True)[Y_cols].agg(['mean', 'count', 'sum'])
```

Per (X, Y, Z) triple:

1. Qualifying strata: z such that count(a, z) >= n_min and count(b, z) >= n_min.
   Coverage = rows in qualifying strata / rows with non-null X, Y, Z. Require
   coverage >= 0.8 or skip (ASSUMPTION: a reversal that lives in a fifth of the data
   is a different, weaker story and is reported by 4.10's stratified table instead).
2. E_agg from the ungrouped means. Practical-size gate on E_agg:
   - binary Y: |risk difference| >= 0.02 (two percentage points);
   - numeric Y: |Cohen's d| >= 0.2 (Cohen's conventional "small", CITED: Cohen,
     Statistical Power Analysis for the Behavioral Sciences, 2nd ed., 1988).
   ASSUMPTION for the 0.02: below two points nobody makes a decision on the gap.
3. E_z for each qualifying stratum, with Mantel-Haenszel weights
   w_z = n_az * n_bz / (n_az + n_bz).
4. Adjusted effect:
   - binary Y: Mantel-Haenszel risk difference, sum(w_z * E_z) / sum(w_z), and the
     Cochran-Mantel-Haenszel chi-square statistic computed directly from the 2x2xK
     table (standard formula, no scipy function needed; scipy provides the chi2
     distribution for the p-value).
   - numeric Y: the coefficient on the X indicator in an ordinary least squares fit
     of Y on [1, X_indicator, Z_indicators] via `numpy.linalg.lstsq`, with its
     standard error from the residuals. This is the "compare within segments" number.
5. Reversed share: sum(n_z for z with sign(E_z) == -sign(E_agg)) / sum(n_z) over
   qualifying strata.
6. Grade:
   - FULL: every qualifying stratum reverses and sign(E_adj) != sign(E_agg).
   - MAJORITY: reversed share >= 2/3 and sign(E_adj) != sign(E_agg).
   - ATTENUATION: same sign but |E_adj| <= 0.5 * |E_agg| ("the gap mostly disappears
     once you account for Z"). Reported at lower severity; it is the far more common
     real-world case and still changes decisions.
7. Mechanism checks, both required for FULL or MAJORITY:
   - Mix: Cramér's V between X and Z >= 0.1 (ASSUMPTION: below this the composition
     differences are too small to drive a reversal; the golden datasets will confirm).
   - Segment matters: one-way ANOVA (numeric Y) or chi-square (binary Y) of Y on Z
     with BH-surviving p.
8. Stratified test p: CMH p (binary) or the t-statistic on the OLS coefficient
   (numeric). Goes into the pooled BH list.
9. Stability (DATA-DRIVEN): 200 bootstrap resamples of rows (fixed seed) on a sample
   capped at 50,000 rows; stability = share of resamples in which sign(E_adj) equals
   the point estimate's sign. Report it; require >= 0.9 for FULL, >= 0.8 for
   MAJORITY (ASSUMPTION, to be tuned).
10. Rank surviving triples by |E_agg - E_adj| in standardised units, so the reversal
    with the biggest decision consequence comes first. Show at most three; the rest
    are listed under "also found".

Worst case with the caps: 30 X comparisons x 40 Z = 1,200 grouped passes, each
serving all Y. Confirmation on the full frame only for triples that survive on the
sample.

#### Threshold provenance summary

| Parameter | Value | Provenance |
|---|---|---|
| n_min per cell | 5 for binary Y, 5 for numeric Y | ASSUMPTION: the conventional expected-count floor for 2x2 chi-square is 5; below it a stratum's direction is noise |
| coverage | 0.8 | ASSUMPTION, reasoning above |
| binary size gate | 0.02 risk difference | ASSUMPTION |
| numeric size gate | Cohen's d 0.2 | CITED (Cohen 1988) |
| mix gate | Cramér's V 0.1 | ASSUMPTION |
| attenuation | 0.5 | ASSUMPTION: "half the gap is mix" is the point where a CEO would want to know |
| stability | 0.9 / 0.8 | ASSUMPTION |
| FDR | q = 0.05 | ASSUMPTION (convention) |

#### Evidence shown

1. The headline row: "Overall: a = 34.1% (412 of 1,208), b = 28.4% (301 of 1,060)."
   Always as k of n.
2. The strata table, one row per stratum: Z level, n_a, rate_a, n_b, rate_b,
   direction arrow, E_z. Reversed rows visually marked. A final row: "Within
   segments (adjusted): b ahead by 4.2 points."
3. The mix table: for each Z level, the share of a-rows and b-rows that fall in it.
   This is the "why": "78% of a is in Segment North, where everyone converts well."
4. Row sets: every cell in the strata table opens the rows behind it. The single
   most useful set is "a-rows in the stratum that carries the aggregate", because
   that is where the story lives.
5. Recompute string: "In Excel: filter Z to <z1>, then average Y for X=a and for
   X=b. Repeat for each Z value. Then remove the filter and average again."
6. testsRun, adjustedP, stability, all displayed.

#### False-positive risk and hedging

- Over-stratification: with 40 Z candidates you will eventually find a reversal in
  random data. Controls: BH over the pool, the mix gate (a reversal without mix
  imbalance is arithmetically impossible, so a "reversal" that appears without it is
  noise), the bootstrap stability, and `testsRun` printed on the finding.
- Binned numeric Z: quartile boundaries are arbitrary. Only report a binned-Z
  reversal if it also holds with tertiles (a second pass on survivors). ASSUMPTION.
- The mediator problem, which no statistic can solve: if Z is a CONSEQUENCE of X
  (the new process causes leads to be classified as inbound), conditioning on Z is
  wrong and the aggregate is the right number. Software cannot know the causal
  order. So rung 3 is mandatory and is the Jarvis move:
  "Is <Z> decided before <X> happens, or is it a result of <X>?"
  - Before: "Then compare within segments. The overall gap is mix."
  - After: "Then the overall number stands, and splitting by <Z> would mislead."
  - Not sure: "Here is how to find out: does changing <X> ever change <Z>?"
- Wording: rung 1 "Overall, a is ahead. Inside every <Z> segment, b is ahead."
  Rung 2 "The overall lead comes from where a happens to be concentrated, not from a
  doing better in like-for-like segments. Which number matters depends on whether
  <Z> is something you choose." Never "a is not actually better".

---

### 4.2 Window shift (cherry-picked time window)

**Feasibility: NOW.** pandas resample, `scipy.stats.theilslopes`, numpy.

#### The deception, plainly

"Revenue is up 18% since January." It is, if you start in January. Start in December
and it is down 4%. The start (or end) of the window was chosen because it makes the
line go the right way. A real trend survives moving the goalposts by a few periods.

#### Real-world burn

- The global temperature "pause" argument selected 1998, an exceptionally warm El
  Nino year, as a start point; shifting the start by a year or two removed the
  apparent flattening. Rahmstorf, Foster and Cahill, Environmental Research Letters,
  2017, discuss the start-point pitfall explicitly.
  https://doi.org/10.1088/1748-9326/aa6825
- Business version (ASSUMPTION, illustrative): "churn down 30% since Q2" when Q2
  contained a one-off price increase that spiked churn; measured against Q1, churn is
  flat.

#### The statistical signal

The headline trend statistic over window [s, e] changes sign, or changes magnitude
beyond a tolerance, when s or e is moved by a small number of periods. A secondary
signature: the chosen start is a local extremum of the series (a trough for a "growth"
claim, a peak for a "decline" claim).

#### The exact computation

1. Requires a DATETIME column (existing inference) and at least one NUMERIC column.
   If the frame has multiple rows per date, aggregate to one value per period using
   sum for columns whose name matches revenue/count/units/volume-like patterns and
   mean otherwise; show which was used and let the user switch. Infer period from the
   median gap between distinct dates (daily, weekly, monthly, quarterly, yearly) and
   `resample` to it.
2. Minimum length: 8 periods (ASSUMPTION: below that there is no "window" to shift).
3. Headline window: by default the full file range, because the file's own range is
   the choice someone made. If the user names a range in conversation, use theirs.
4. Two headline statistics, both reported:
   - Endpoint change: (y_e - y_s) / |y_s|.
   - Robust slope: Theil-Sen slope via `scipy.stats.theilslopes`, expressed per period
     and as a share of the series median.
5. Shift scan: for k in 1..K where K = min(12, floor(0.25 * length)), recompute both
   statistics for windows [s - k, e], [s + k, e], [s, e - k], [s, e + k] (where the
   data exists). This yields up to 4K alternative windows.
6. Fragility = share of alternative windows in which the endpoint-change sign differs
   from the headline's sign. Slope fragility computed the same way.
7. Start-point extremity: the percentile rank of y_s among the values within
   +/- K periods of s. Extremity is flagged when the headline says "up" and y_s is in
   the bottom 10% of that neighbourhood, or "down" and top 10% (ASSUMPTION).
8. Also compute the same-period-last-year comparison when at least 2 years of data
   exist, as an alternative framing that removes seasonality.

#### Threshold and provenance

- Flag when fragility >= 0.25 (one in four nearby windows tells the opposite story),
  OR when start-point extremity fires and shifting the start by one period changes
  the endpoint-change magnitude by more than half. ASSUMPTION: a trend a CEO should
  bet on should survive a one-quarter shift; 0.25 is deliberately conservative to
  avoid flagging every noisy series. Tune on the golden datasets.
- Not a hypothesis test; no p-value, no BH. It is a sensitivity report.

#### Evidence shown

1. The series, headline window highlighted, with the alternative window that flips
   the story overlaid.
2. The shift table: start date, end date, endpoint change, slope. The headline row
   marked. Sorted by start date so the user sees the neighbourhood.
3. The start-point row itself: "The window starts at 2023-01, the lowest value in the
   surrounding 24 months." That row is opened as evidence.
4. Recompute: "Change the first date in your chart's range by one month and re-read
   the percentage."

#### False-positive risk and hedging

- Genuine turnarounds start at troughs. The detector cannot distinguish a real regime
  change from a convenient start. So rung 3: "Did something happen at <start date>
  (a launch, a fix, a price change)? If yes, this is a turnaround and the start is
  justified. If not, the start date is doing the work."
- Short or noisy series flip constantly. The 8-period minimum and the 0.25 fragility
  gate exist for this; if the series is noisy enough that most windows flip, say
  "this series is too noisy to support any trend claim over this horizon", which is
  itself the useful finding.
- Wording: rung 1 "Starting one month earlier turns +18% into -4%." Rung 2 "This
  trend depends on where you start counting." Never "cherry-picked".

---

### 4.3 Outlier-carried mean (fragile number, part 1)

**Feasibility: NOW.**

#### The deception, plainly

"Average order value is 4,200." The median is 900. Three orders carry the average.
Plan for 4,200 and you will plan for a business that does not exist.

#### Real-world burn

Statistical agencies report median rather than mean household income precisely
because a few very high incomes pull the mean away from the typical household. This
is standard practice, not a scandal, which is the point: the mean is not wrong, it
answers a different question than the one the reader thinks was asked. (ASSUMPTION
for any specific business case; the mechanism is textbook.)

#### The statistical signal

The mean of a column, or of a group within a groupby, moves materially when a tiny
share of rows is removed, and the mean sits far from the median relative to the
spread.

#### The exact computation

For every NUMERIC column, and for every (categorical X, numeric Y) group mean the
product displays:

1. mean, median, 10% trimmed mean (`scipy.stats.trim_mean`), Q1, Q3, IQR.
2. Sorted contributions: cumulative share of the column's sum held by the top k rows
   for k = 1, 3, and ceil(0.01 * n).
3. Leave-out means: mean without the top 1, top 3, top 1% of rows by absolute
   deviation from the median.
4. Displacement = |mean - median| / IQR (IQR-scaled so it is unit-free). If IQR is 0
   use the median absolute deviation; if that is 0 too, skip.

#### Threshold and provenance

Flag when either:
- removing at most max(3, 1% of rows) moves the mean by more than 20% of its value
  (ASSUMPTION: a fifth is where a plan built on the number changes), or
- displacement > 1.0 (the mean lies more than one IQR from the median; ASSUMPTION:
  for a symmetric distribution the mean sits inside the box, so leaving it is a
  visible sign).

n >= 20 (ASSUMPTION: below that "outlier" and "data" are the same thing).

#### Evidence shown

1. "Average: 4,200. Median: 900. Without rows 17, 88, 203: average 1,050."
2. The carrying rows, with every column, so the user can see whether they are real.
3. Contribution bar: top 3 rows = 61% of total.
4. Recompute: "Sort column Y descending, delete the top 3, re-average."

#### False-positive risk and hedging

- Heavy-tailed data is normal in revenue, deal size, claims, city sizes. The mean of a
  Pareto-like column is legitimately carried by the tail, and for a TOTAL the tail is
  the business. The hedge is to present both numbers as both true: rung 2 "The
  average is carried by three rows. The typical row is near the median. If you are
  planning around the typical customer, use the median; if you are planning the
  total, the three rows are the plan, so know them by name."
- Rung 3: "Are these three repeatable, or one-offs?"

---

### 4.4 Small denominator (fragile number, part 2)

**Feasibility: NOW.**

#### The deception, plainly

"Region West has a 100% renewal rate." Two customers. "Product Z grew 300%." From one
unit to four. Small denominators produce the most extreme percentages in any table,
so the top and bottom of any ranking are usually the smallest groups, not the best
and worst ones.

#### Real-world burn

Howard Wainer, "The Most Dangerous Equation", American Scientist, 2007: the smallest
schools appeared disproportionately among both the best and worst performers, which
led to large investments in small schools; the effect was the variance of small
samples, not a property of small schools.
https://www.americanscientist.org/article/the-most-dangerous-equation

#### The statistical signal

A rate or ratio computed over a group with small n, whose confidence interval is so
wide that the group's rank among its peers is not determined by the data.

#### The exact computation

For every grouped rate the product shows (binary Y by categorical X), and for every
column whose name or values suggest a percentage (values in [0, 1] or [0, 100] with a
name matching rate/pct/percent/share/ratio) when a companion count column exists:

1. k successes of n per group. Wilson score interval at 95% for each group.
2. Interval width in percentage points.
3. Rank stability: rank groups by point estimate; then by lower bound; then by upper
   bound. A group is "rank-unstable" if its position changes by more than one place
   between the three rankings.
4. For growth percentages: base value, new value, absolute change alongside the
   percentage.

#### Threshold and provenance

- Flag a group when n < 30 and its Wilson interval is wider than 20 percentage points
  (ASSUMPTION: 30 is the conventional rule-of-thumb for normal approximations; 20
  points is a width nobody would accept if they saw it).
- Flag a percentage column that has no denominator anywhere in the file: "these
  percentages arrive without their counts". Not a test, an observation.
- Flag a growth percentage when the base is below 10 units or below 1% of the total
  (ASSUMPTION).

#### Evidence shown

1. The group table with k of n, rate, and interval drawn as a bar, sorted by point
   estimate, so the user sees the tiny groups at both extremes.
2. The rows in the small group (all of them; there are few).
3. Recompute: "Count the rows behind the 100%."

#### False-positive risk and hedging

- Small groups can be genuinely excellent. The detector does not say they are not.
  Rung 1 "West: 100% (2 of 2). East: 87% (348 of 400)." Rung 2 "Two customers cannot
  tell you West is better than East; the honest range for West is roughly 30% to
  100%." Rung 3: "Is West new, or is this the whole region?"

---

### 4.5 Duplicate inflation (hygiene pre-pass)

**Feasibility: NOW.**

#### The deception, plainly

The same invoice appears twice, the same customer three times with slightly different
spelling, the same month's rows pasted in twice. Every total, count and rate is
inflated, and the inflation is rarely spread evenly, so it also distorts comparisons.

#### Real-world burn

Duplicate and near-duplicate records are the bread and butter of every data-quality
audit; no single public scandal is needed to justify this detector, and none is
invented here. The damage mechanism is that a duplicated high-value row lands in one
segment and makes that segment "win".

#### The statistical signal

Exact repeated rows; repeated values in a column that should be a key; rows that
become identical after normalising whitespace, case and number formatting.

#### The exact computation

1. Exact duplicates: `df.duplicated(keep=False)`.
2. Candidate keys: columns whose name matches id/key/number/no/invoice/email/ref
   patterns, OR whose uniqueness ratio (nunique / non-null count) is >= 0.95
   (ASSUMPTION: a column that is 95% unique was meant to be unique). Report
   `df.duplicated(subset=[key], keep=False)` for each.
3. Near-duplicates: normalise every string column (strip, casefold, collapse
   whitespace, strip currency symbols and thousands separators from numeric-like
   strings), then repeat 1 and 2.
4. Block duplicates: for datetime-bearing frames, detect a run of consecutive rows
   that exactly repeats an earlier run (hash consecutive row tuples, look for repeated
   hash sequences of length >= 5). This is the "pasted the month in twice" case.
5. Impact: recompute every headline total and grouped mean with duplicates dropped;
   report the deltas.

#### Threshold and provenance

- Any duplicate on a candidate key is reported (it is a fact, not a test).
- Exact full-row duplicates are reported when they exceed 0.5% of rows or 5 rows,
  whichever is smaller (ASSUMPTION: below that they are typically harmless).
- Near-duplicates always reported with the normalisation that made them match, so the
  user can judge.

#### Evidence shown

1. The duplicate pairs side by side, differences highlighted.
2. "Total revenue 1,204,300 includes 38,200 from 41 rows whose invoice number appears
   more than once. De-duplicated total: 1,166,100."
3. Which segment absorbs the inflation: duplicates grouped by every categorical
   column, so "31 of the 41 are in Region North" is visible.
4. Recompute: "Excel: Data, Remove Duplicates on column Invoice."

#### False-positive risk and hedging

- Legitimately repeated rows exist (transaction logs without an id, recurring
  identical orders). Rung 2 "These rows are identical. If they are separate events,
  nothing is wrong. If they are the same event recorded twice, the totals above are
  overstated by X." Rung 3: "Should <key> be unique in this file?"

---

### 4.6 Missing-not-at-random

**Feasibility: NOW.**

#### The deception, plainly

"Customer satisfaction averaged 4.6 out of 5." Among customers who answered. The
customers who did not answer churned at three times the rate. The blanks are not
random; they are the unhappy customers, and the average is computed over the happy
ones.

#### Real-world burn

The US National Research Council's report on missing data in clinical trials (2010)
exists because patients who drop out are systematically different from those who
stay, and analysing completers alone biases treatment effects.
https://doi.org/10.17226/12955

#### The statistical signal

Missingness in column M is associated with the values of another column Y, with time,
or with a segment. If it is, every statistic on M is computed over a biased subset.

#### The exact computation

For each column M with a null share between 1% and 95% (outside that range there is
nothing to compare):

1. Indicator I = M.isna().
2. Against each NUMERIC Y (Y != M): Mann-Whitney U between Y[I] and Y[~I]; effect size
   as Cliff's delta, computed from U.
3. Against each CATEGORICAL Y: chi-square of I by Y; effect size Cramér's V.
4. Against each DATETIME column: null share per period; Theil-Sen slope of the share.
5. Also record structural missingness: is I perfectly determined by another column's
   level (e.g., "discount_code" null exactly when "has_discount" is 0)? If Cramér's V
   >= 0.95 with some column, label the finding "structural" and downgrade it.

#### Threshold and provenance

- BH-surviving p AND (|Cliff's delta| >= 0.2 OR Cramér's V >= 0.15). ASSUMPTION: these
  are the conventional "small but real" effect-size floors; below them the bias is
  unlikely to change a decision.
- Time trend: flag when null share moves by more than 10 percentage points over the
  range (ASSUMPTION).

#### Evidence shown

1. "Rows missing Satisfaction: churn 27% (81 of 300). Rows with Satisfaction: churn
   9% (95 of 1,050)."
2. Both row sets open.
3. The recomputed statistic under a stated assumption: "If the missing customers
   scored like the churned ones who answered, the average would be about 3.9 instead
   of 4.6." Labelled as a what-if, never as the true value.
4. Recompute: "Filter Satisfaction to blanks. Look at the Churn column."

#### False-positive risk and hedging

- Structural missingness (field not applicable) is common and benign; the 0.95 check
  catches most of it and the rest is handled by rung 3: "Is Satisfaction blank
  because the customer did not answer, or because the question did not apply?"
- Wording: never "the survey is biased". Rung 2 "The 4.6 describes the customers who
  answered. The ones who did not answer look different on <Y>."

---

### 4.7 The Other bucket

**Feasibility: NOW.**

#### The deception, plainly

The pie chart shows five named products and "Other". Other is the biggest slice, or
it is growing fastest, and nobody asks what is in it. The real story is hiding in the
bucket nobody has to explain.

#### Real-world burn

ASSUMPTION, illustrative pattern: a cost line "Other operating expenses" that grows
faster than every named line for three years is the classic place discretionary
spend is parked. No specific case is cited because the pattern is generic.

#### The statistical signal

A catch-all category whose share of rows or of a summed metric is comparable to or
larger than the largest named category, or whose share is trending up.

#### The exact computation

1. Identify catch-all levels in every CATEGORICAL column: case-insensitive match on
   other, others, misc, miscellaneous, unknown, n/a, na, none, blank, "-", "", tbd,
   unclassified, general, various (and the null level itself).
2. For each such level: share of rows; share of every NUMERIC column's sum; rank among
   levels by each.
3. If a DATETIME column exists: share per period and its Theil-Sen slope.
4. Within-bucket structure: if any other column (free text, sub-category, vendor) has
   many distinct values inside the bucket, report the top values inside it, because
   that is what "Other" actually contains.

#### Threshold and provenance

- Flag when the catch-all's share of rows or of any sum is >= 20% or ranks in the top
  two levels (ASSUMPTION: a fifth of anything unexplained deserves a look).
- Flag when its share grew by more than 5 percentage points over the time range
  (ASSUMPTION).

#### Evidence shown

1. Share table with the catch-all highlighted: "Other: 31% of cost, larger than any
   named category."
2. The rows in the bucket, and the top sub-values inside it.
3. Recompute: "Filter Category to Other, sum Cost."

#### False-positive risk and hedging

- Some data is legitimately long-tailed and "Other" is honest. Rung 2 "Other is your
  biggest category. That may be fine; it means the categorisation is not telling you
  much about a third of the cost." Rung 3: "Do you know what is in it?"

---

### 4.8 Survivorship bias (systematic absence of rows)

**Feasibility: NOW for the panel and cut-off forms below; RESEARCH in general,
because a file cannot prove the absence of rows that were never in it.**

#### The deception, plainly

"Our customers' average tenure is 6 years." Of the customers who are still customers.
The ones who left are not in the file. Any analysis of survivors flatters whatever
they have in common.

#### Real-world burn

- Abraham Wald's WWII analysis of returning aircraft: damage patterns on survivors
  showed where planes could be hit and still return, not where to add armour. Mangel
  and Samaniego, Journal of the American Statistical Association, 1984.
  https://doi.org/10.1080/01621459.1984.10478038
- Mutual fund performance databases that drop dead funds overstate average returns.
  Elton, Gruber and Blake, Review of Financial Studies, 1996.
  https://doi.org/10.1093/rfs/9.4.1097
- Reinhart and Rogoff's growth-and-debt result was partly driven by excluded rows
  (and a spreadsheet range error). Herndon, Ash and Pollin, Cambridge Journal of
  Regions, Economy and Society, 2014. https://doi.org/10.1093/cjres/bet075

#### The statistical signal, in the forms a single file can reveal

A. Panel exit (needs an entity column and a datetime column): entities present in
   early periods that stop appearing, and whose metric BEFORE they stopped appearing
   was systematically worse than the stayers'. This is the strongest signal and it is
   fully computable.
B. Hard cut-off: a numeric column's distribution stops abruptly at a round number
   with no tail, e.g., no customer below 1,000 revenue when the density just above
   1,000 is high. Someone filtered.
C. Sequential key gaps: an integer-like id column with gaps, where the gap rate is
   concentrated in one segment or period.
D. Status column with a single value ("Active") or an end-date column that is entirely
   null while the schema implies alternatives.

#### The exact computation

A. Entity column: any candidate key from 4.5 that repeats across dates. For each
   entity: first and last period present. Exiters = entities whose last period is
   more than one period before the file's last period. For each numeric metric,
   compare exiters' values in their final two observed periods with stayers' values in
   the same calendar periods (Mann-Whitney, Cliff's delta). Also report the
   survivor-only average vs the all-entities average of the metric.
B. For each numeric column, histogram with Freedman-Diaconis bins; find the lowest
   (and highest) non-empty bin; if the adjacent inner bin's count exceeds a Poisson
   upper bound consistent with a smoothly decaying tail (expected count from the two
   next-inner bins), and the boundary is within 2% of a round number (power of ten
   times 1, 2, 2.5 or 5), flag a cut-off.
C. For integer-like columns with uniqueness >= 0.95: gap rate = 1 - n / (max - min +
   1). Cross-tabulate gaps by segment (gap positions assigned to the nearest present
   row's segment) and by period.
D. Name-pattern match on status/state/active/churn/end/termination columns with
   nunique == 1 or all-null.

#### Threshold and provenance

- A: BH-surviving p and |Cliff's delta| >= 0.2 (ASSUMPTION as in 4.6); minimum 10
  exiters.
- B: adjacent-bin count more than 3 times the smooth-tail expectation and boundary
  near round number (ASSUMPTION).
- C: gap rate >= 5% and chi-square of gaps by segment BH-surviving (ASSUMPTION).
- D: observation, no threshold.

#### Evidence shown

1. A: "142 customers stop appearing before the last month. In their final two months
   they averaged 2.1 support tickets vs 0.6 for those who stayed." Both row sets open,
   the exiters' last rows first.
2. B: the histogram with the cliff marked and the boundary value.
3. C: the gap map by segment and period.
4. Recompute: "Pivot Customer by Month; count who is missing in the last month."

#### False-positive risk and hedging

- Legitimate filters (a report scoped to active accounts) produce every one of these
  signatures. That is fine: the point is that the reader should know the scope. Rung
  2 "This file appears to contain only <survivors/values above 1,000>. Every average
  in it describes that group only." Rung 3: "Was this file filtered before you got
  it? To what?"
- Never say "rows were removed". Say "rows below 1,000 are absent, and the shape
  suggests a cut rather than a natural tail".

---

### 4.9 Mixed units or currencies

**Feasibility: NOW for symbol and code detection; NEXT for magnitude-cluster
inference, because it needs a curated conversion table and a tuned test.**

#### The deception, plainly

Half the rows are in dollars and half in euros, or half in thousands and half in
units, or one team reports kilograms and another pounds. The total is meaningless and
the comparison between the two halves is a comparison of units, not performance.

#### Real-world burn

NASA's Mars Climate Orbiter was lost in 1999 because one team's software produced
thruster impulse in pound-force seconds and another expected newton seconds.
https://en.wikipedia.org/wiki/Mars_Climate_Orbiter (which cites the Mishap
Investigation Board report).

#### The statistical signal

- Strings: multiple currency symbols or ISO codes in one column; unit suffixes (kg,
  lb, k, m, mn, bn) mixed.
- Numbers: a bimodal distribution whose two modes differ by a factor close to a known
  conversion constant, and where the mode membership aligns with a segment column
  (country, source system, submitter).

#### The exact computation

1. Regex scan of object columns for currency symbols ($, EUR, GBP, JPY, INR, BDT and
   their symbols), unit suffixes and thousands markers; count distinct units per
   column.
2. For numeric columns grouped by each low-cardinality categorical column: ratio of
   group medians. Compare against the constant table {10, 100, 1000, 1e6, 2.2046,
   0.4536, 1.609, 0.6214, 2.54, 3.281, 12, 1.8} within a 5% tolerance (ASSUMPTION for
   the tolerance; the constants are physical and exact). Require the two groups'
   log-distributions to be similar in shape (two-sample KS on log values after
   dividing by the constant, p not small) so that it is a scale shift, not a real
   difference.
3. Within a single group, Gaussian-mixture-free bimodality check on log values: use
   the dip in a kernel density between two modes; if two modes exist with median
   ratio near a constant, flag and attempt to find the column that separates them
   (the one with the highest Cramér's V against mode membership).

#### Threshold and provenance

- Symbol mixing: any column with more than one distinct currency or unit is flagged
  (fact).
- Magnitude: ratio within 5% of a constant AND KS p >= 0.1 after rescaling AND
  Cramér's V of mode membership with some segment >= 0.5 (ASSUMPTION: the alignment
  with a segment is what separates units from genuine scale differences).

#### Evidence shown

1. Sample rows from each cluster side by side with their segment value.
2. "Median amount from source A is 1,000.4 times the median from source B; after
   dividing A by 1,000 the two distributions match."
3. Totals under each interpretation.
4. Recompute: "Sort by Amount; look at where the values jump by a thousand."

#### False-positive risk and hedging

- Enterprise vs SMB really differ by 100x. Rung 2 "Source A values are about 1,000
  times source B's. Either these are different units or very different businesses."
  Rung 3: "Are Source A amounts in thousands?"

---

### 4.10 Correlation dressed as causation, with a visible confounder

**Feasibility: NOW.** Partial correlation and within-stratum correlation with
numpy/scipy.

#### The deception, plainly

"Stores that run more promotions have higher sales, so run more promotions." Bigger
stores run more promotions and have higher sales. Within stores of the same size,
promotions do nothing, or hurt. The third column is sitting in the same spreadsheet.

#### Real-world burn

The classic teaching example (ice cream sales and drownings, both driven by
temperature) is documented under https://en.wikipedia.org/wiki/Confounding. Business
cases are ASSUMPTION-level illustrations; the mechanism is the continuous cousin of
4.1 and the same references apply.

#### The statistical signal

A strong bivariate correlation between numeric A and B that collapses when a third
column C is held fixed: partial correlation near zero (C numeric) or within-stratum
correlations near zero or reversed (C categorical), while C correlates with both.

#### The exact computation

1. Spearman correlation matrix over NUMERIC columns (rank-based, robust to the
   outliers 4.3 finds). Candidate pairs: |rho| >= 0.5 with BH-surviving p and n >= 30
   (ASSUMPTION: 0.5 is where a deck starts drawing a trend line).
2. For each candidate pair and each third NUMERIC column C: partial Spearman
   correlation of A and B given C (residualise ranks on C, correlate residuals).
3. For each candidate pair and each CATEGORICAL C (2 to 20 levels): within-level
   Spearman correlations, weighted average by n, and share of levels where the sign
   flips or |rho| < 0.2.
4. Report the C that reduces |rho| the most, subject to C correlating with both A and
   B at |rho| >= 0.3 (ASSUMPTION: otherwise C is not a plausible common cause).
5. Skip pairs where B is a deterministic function of A (4.14) or where A and B share
   a name stem with C (e.g., "revenue" and "revenue_per_store" given "stores").

#### Threshold and provenance

Flag when partial or within-stratum |rho| falls below 0.2 or below 40% of the raw
|rho| (ASSUMPTION), with the mechanism gate in step 4.

#### Evidence shown

1. Scatter of A vs B coloured by C (or by C quartile), with per-group trend lines.
2. Table: raw rho, rho within each level of C, partial rho.
3. Rows in the level where the sign flips.
4. Recompute: "Filter Store Size to Large; make the same scatter. Repeat for Small."

#### False-positive risk and hedging

- Same mediator problem as 4.1, same rung 3: "Is <C> decided before <A>, or does <A>
  change <C>?" Wording: rung 2 "The link between A and B is mostly explained by C.
  Within the same C, it is weak." Never "A does not cause B".

---

### 4.11 Benford's law deviation on financial figures

**Feasibility: NOW.** Digit extraction and chi-square; the gates are the work.

#### The deception, plainly

Naturally occurring amounts (invoices, expenses, transactions spanning many sizes)
have leading digit 1 far more often than 9. Numbers people invent, or numbers
constructed to fit under a limit, do not follow that pattern. A deviation is a reason
to look at who produced those numbers. It is never proof of anything.

#### Real-world burn

Rauch, Goettsche, Braehler and Engel, "Fact and Fiction in EU-Governmental Economic
Data", German Economic Review, 2011, found that the reported deficit data of Greece
showed the largest deviation from Benford's law among EU member states in the period
studied. https://doi.org/10.1111/j.1468-0475.2011.00542.x

The applicability conditions and the MAD thresholds below follow Nigrini, Benford's
Law: Applications for Forensic Accounting, Auditing, and Fraud Detection, Wiley,
2012 (CITED, book).

#### The statistical signal

The distribution of first digits (and first-two digits) of a column departs from
log10(1 + 1/d); the last-two digits of invented numbers depart from uniformity.

#### The exact computation

Applicability gates, all required (from Nigrini's guidance, CITED, with the numeric
floor labelled ASSUMPTION):

- Column is numeric, positive values used, not an identifier (uniqueness ratio <
  0.95, name does not match id/zip/phone/account patterns), not bounded by design
  (percentages, ratings, ages).
- Spans at least three orders of magnitude: max / min over positive values >= 100
  (ASSUMPTION for the exact cut; Nigrini requires a wide spread).
- n >= 500 for first digits, n >= 1000 for first-two digits (ASSUMPTION: Nigrini
  cautions against small samples; these floors keep the MAD thresholds meaningful).
- Not a column of assigned or psychological prices (a spike at digit 9 with values
  ending in .99 is pricing, not fabrication; detect by last-two-digit mass at 99 and
  downgrade).

Then:

1. First digit d1, first-two digits d12, last-two digits d_last of each value.
2. Expected: P(d1) = log10(1 + 1/d1); P(d12) = log10(1 + 1/d12); last-two uniform.
3. Mean absolute deviation (MAD) between observed and expected proportions.
   Nigrini's first-digit MAD bands: 0.000 to 0.006 close conformity, 0.006 to 0.012
   acceptable, 0.012 to 0.015 marginal, above 0.015 nonconformity. First-two digits:
   0.0000 to 0.0012, 0.0012 to 0.0018, 0.0018 to 0.0022, above 0.0022 (CITED, Nigrini
   2012).
4. Chi-square for reference, reported but not used as the gate (it rejects everything
   at large n, which Nigrini also notes).
5. Attribution: recompute MAD per level of every low-cardinality categorical column
   (vendor, submitter, department, region) with at least 300 rows in the level. The
   finding names the level that carries the deviation. This is the auditor's move:
   the deviation is only actionable when it has an address.

#### Threshold and provenance

Flag at "nonconformity" (first-digit MAD > 0.015 or first-two MAD > 0.0022, CITED).
Report "marginal" as a note only.

#### Evidence shown

1. Digit bar chart, observed vs expected line.
2. The over-represented digits and the rows that start with them, grouped by the
   attributing segment.
3. "Digits 5 and 6 appear 2.3 times more often than expected. 71% of those rows were
   submitted by <level>."
4. Recompute: "Take the first character of each amount; count how many start with 1
   versus 9."

#### False-positive risk and hedging

- Very high. Prices, capped reimbursements, fixed fee schedules and small ranges all
  break Benford legitimately. The gates remove most; the wording removes the rest:
  rung 2 "This column does not follow the digit pattern natural amounts usually
  follow. Common innocent reasons: fixed price lists, caps, a narrow range. It
  warrants a look at the rows from <segment>." Rung 3: "Is there a price list or a
  cap behind these amounts?"

---

### 4.12 Round-number clustering (estimates presented as measurements)

**Feasibility: NOW.**

#### The deception, plainly

The hours column is full of 8, 10, 20, 40. The forecast column is 50,000, 100,000,
250,000. These are guesses that have been typed into a column labelled as if they
were measured. A plan built on estimates is fine. A plan built on estimates that
were presented as actuals is not.

#### Real-world burn

- Demographers detect age misreporting by the excess of ages ending in 0 and 5
  (Whipple's index). https://en.wikipedia.org/wiki/Whipple%27s_index
- Firms report earnings that cluster just at or above round thresholds and analyst
  forecasts more than a smooth distribution allows: Burgstahler and Dichev, Journal of
  Accounting and Economics, 1997. https://doi.org/10.1016/S0165-4101(97)00017-7

#### The statistical signal

The share of values that are multiples of 5, 10, 100, 1000 (or that end in .00) far
exceeds what the column's own spread would produce; last-digit distribution is far
from uniform.

#### The exact computation

1. For each numeric column with n >= 50 and at least 20 distinct values (ASSUMPTION:
   otherwise it is a code, not a measurement): last integer digit distribution, and
   share of values divisible by 5, 10, 100, 1000.
2. Expected share under the column's own distribution: replace each value with a
   value drawn uniformly within its Freedman-Diaconis bin (fixed seed), compute the
   same shares, repeat 200 times. This gives a DATA-DRIVEN null for "how round would
   this column be by chance".
3. Roundness excess = observed share / mean null share. Chi-square of last digits
   against uniform for the p-value that goes to BH.
4. Attribution by segment as in 4.11: which submitter/department rounds.

#### Threshold and provenance

Flag when roundness excess >= 3 and BH-surviving p (ASSUMPTION: three times more
round than chance is unmistakable; two is common in honest data).

#### Evidence shown

1. Last-digit histogram; share of round values vs null.
2. The round rows, and the segment that produces them.
3. "62% of Forecast values are multiples of 10,000; by chance about 4% would be.
   91% of those come from Team B."
4. Recompute: "Count how many values end in 000."

#### False-positive risk and hedging

- Some quantities are legitimately round (list prices, headcount targets, quantised
  units). Rung 2 "These values look like estimates, not measurements. If the column
  is a forecast, that is expected. If it is actuals, ask how they were recorded."
  Rung 3: "Is <column> measured or estimated?"

---

### 4.13 Suspiciously perfect fits and too-regular data

**Feasibility: NOW.**

#### The deception, plainly

Every month grows by exactly 5%. Two columns line up with R-squared of 0.999. The
group standard deviations are all nearly identical. Real data is lumpy. Data this
smooth is a model output, a plan, a derived column, or an invention, and the label
on the tab does not say which.

#### Real-world burn

Simonsohn, "Just Post It: The Lesson From Two Cases of Fabricated Data Detected by
Statistics Alone", Psychological Science, 2013: fabricated datasets were identified
because group summary statistics were far too similar to each other to have arisen
from real samples. https://doi.org/10.1177/0956797613480366

#### The statistical signal

- Near-deterministic linear relationship between two columns that are not labelled as
  derived.
- Growth series with almost no variation in period-over-period change.
- Count data with variance far below its mean (underdispersion relative to Poisson).
- Group SDs too similar given group sizes.

#### The exact computation

1. Pairwise linear fit (`linregress`) over numeric pairs; R-squared >= 0.99 with n >=
   20. If the residuals are exactly zero to floating tolerance, classify as DERIVED
   and hand to 4.14 (a derived column is not evidence and must be labelled so).
2. Time series: coefficient of variation of period-over-period percentage changes;
   flag when CV < 0.1 over >= 8 periods (ASSUMPTION: real business series rarely grow
   that evenly).
3. Integer-valued columns with names matching count/units/visits/tickets: dispersion
   index var/mean per group; flag when < 0.2 across groups with n >= 30 (ASSUMPTION;
   a Poisson process gives 1, and clustering pushes it above 1, so far below 1 is the
   anomaly).
4. Group SD similarity (Simonsohn's approach, adapted): for a numeric Y across levels
   of a categorical X with roughly equal n, compute the SD of the group SDs; bootstrap
   by resampling within groups (fixed seed, 1000 draws, or 200 if the row budget is
   tight) to obtain the null distribution of that spread; p = share of draws with
   spread <= observed. Flag at p < 0.01 (ASSUMPTION: deliberately strict because this
   finding is accusation-adjacent).

#### Evidence shown

1. The fit or the series with residuals, showing how flat they are.
2. The group SD table with the bootstrap range.
3. Recompute: "Compute month-over-month % change; note that they are all 5.0%."

#### False-positive risk and hedging

- Plans, targets, allocations and model outputs are perfectly regular by design and
  are often legitimately in the file. Rung 2 "This column is far more regular than
  measured data usually is. It may be a plan or a formula rather than an actual."
  Rung 3: "Is <column> an actual or a projection?"

---

### 4.14 Arithmetic consistency: totals that do not add and formulas that were overwritten

**Feasibility: NOW.**

#### The deception, plainly

The Total row does not equal the sum of the rows above it. A margin column that
should be revenue minus cost is, in 14 rows, something else, because someone typed
over the formula. The spreadsheet's own arithmetic is broken and the summary is
reporting the broken cells.

#### Real-world burn

- JPMorgan's 2012 CIO losses: the internal task force report describes a spreadsheet
  in the VaR model that divided by the sum of two rates rather than their average,
  understating volatility.
  https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/documents/Task_Force_Report.pdf
- Reinhart and Rogoff: an averaging range that excluded rows. Herndon, Ash and
  Pollin, 2014. https://doi.org/10.1093/cjres/bet075
- A maintained public list of spreadsheet errors with material consequences:
  European Spreadsheet Risks Interest Group, https://eusprig.org/research-info/horror-stories/

#### The statistical signal

- Rows whose label matches total/subtotal/sum/grand/all, whose numeric values do not
  equal the sum (or mean, for rate columns) of the rows they cover.
- Numeric column C that equals f(A, B) for most rows, for f in {A+B, A-B, A*B, A/B,
  A/B*100}, but not for all rows.

#### The exact computation

1. Total rows: label match in any object column; the covered block is the rows since
   the previous total row (or the file start). Compare each numeric cell with the
   block sum and block mean; accept the one within 0.5% relative tolerance
   (ASSUMPTION: covers rounding) and report the other cells as mismatches. Total rows
   are then EXCLUDED from every other detector's frame, with a note, because a
   total row inside a groupby doubles everything.
2. Derived columns: for each ordered triple of numeric columns (A, B, C) and each f,
   share of rows where |C - f(A, B)| <= 0.5% of |C| (or 0.005 absolute when C is near
   zero). If the share >= 0.9 and < 1.0, C is a broken formula: report the rows where
   it fails. If the share == 1.0, C is DERIVED: mark it so that 4.1, 4.10 and 4.13 do
   not treat it as independent evidence. Restrict to columns with n >= 20.
3. Percent columns that should sum to 100 within a group (shares): find a categorical
   key such that the column sums to 100 (or 1) within +/- 0.5% for most keys; report
   keys where it does not.

#### Threshold and provenance

0.5% tolerance (ASSUMPTION, rounding); 0.9 formula share (ASSUMPTION: below 0.9 the
relationship is probably coincidental). Facts, not tests; no BH.

#### Evidence shown

1. The total row and the recomputed value side by side: "Total says 1,204,300. The
   rows above sum to 1,166,100. Difference 38,200."
2. The rows where the formula breaks, with the expected value beside the actual one.
3. Recompute: "Select the cells above Total and read the sum in the status bar."

#### False-positive risk and hedging

- Totals may legitimately include rows not in the file (an export of a filtered
  view). Rung 2 "The total does not match the rows in this file. Either rows are
  missing from the export or the total is wrong." Rung 3: "Was this exported from a
  filtered view?"

---

### 4.15 Silent truncation (the file is not the data)

**Feasibility: NOW.**

#### The deception, plainly

The file has exactly 65,536 rows. Or exactly 1,000. Or the time series stops
mid-month. Rows fell off the end and nobody noticed, so every total is a total of
what survived the export.

#### Real-world burn

Public Health England, October 2020: COVID-19 case records were lost when a
legacy-format Excel file hit its row limit; the missing cases were not passed to
contact tracing. https://www.bbc.com/news/technology-54423988

#### The statistical signal

Row count equal to a known limit or a suspiciously round number; a final row that
parses as incomplete; the last period of a time series having a fraction of the
volume of the preceding periods; the file's date range ending before the file's
apparent creation context.

#### The exact computation

1. Row count in {65535, 65536, 1048575, 1048576, 1000, 10000, 50000, 100000, 500000,
   1000000} or equal to any value that a reasonable export tool caps at (fact).
2. Last row has more nulls than 50% of columns while earlier rows do not (fact).
3. Time series: volume (row count or sum) in the last period < 0.5 of the median of
   the previous 6 periods (ASSUMPTION), reported as "the last period is partial".
4. `on_bad_lines='skip'` is already in the parser. Count skipped lines (pandas can
   report them via a callable in newer versions; else compare raw line count to
   parsed row count) and surface the number. Today the skips are silent.

#### Evidence shown

1. "This file has exactly 65,536 rows, the row limit of the legacy Excel format."
2. The last period's volume beside the previous six.
3. The count of lines the parser skipped, with the first few shown raw.

#### False-positive risk and hedging

- Files of exactly 1,000 rows exist honestly. Rung 2 "Exactly 1,000 rows is a common
  export cap. If the source has more, this file is a sample." Rung 3: "How many rows
  does the source system report?"

---

### 4.16 Denominator drift (the ratio improved because the bottom shrank)

**Feasibility: NOW.**

#### The deception, plainly

"Conversion rate is up from 2% to 3%." Because visits halved and conversions fell by
a quarter. The ratio went up while the business went down.

#### Real-world burn

ASSUMPTION, illustrative pattern; the mechanism is arithmetic and generic.

#### The statistical signal

A ratio series moves in the opposite direction from its numerator series, because
the denominator moved more.

#### The exact computation

1. Identify ratio triples: columns (N, D, R) where R ~ N / D within tolerance (from
   4.14's derived-column scan), or a rate column plus a count column when the rate
   is computed per period by the product itself.
2. Over the time axis: endpoint change and Theil-Sen slope of N, D and R.
3. Flag when sign(change in R) != sign(change in N) and |change in D| > |change in N|
   (fact once the triple is identified).

#### Evidence shown

1. Three small series side by side: numerator, denominator, ratio.
2. "Rate rose from 2.0% to 3.1%. Conversions fell from 400 to 310. Visits fell from
   20,000 to 10,000."
3. Recompute: "Look at the count columns, not the percentage."

#### False-positive risk and hedging

- A falling denominator can be deliberate (dropping low-quality traffic). Rung 2
  "The rate rose because the base shrank, not because the count grew." Rung 3: "Was
  the drop in <D> intended?"

---

### 4.17 Average of averages (unweighted means presented as the overall)

**Feasibility: NOW.**

#### The deception, plainly

The regional rates are averaged to get "the company rate", giving a two-customer
region the same weight as a two-thousand-customer one. The company rate that results
describes no actual company.

#### Real-world burn

ASSUMPTION, illustrative; a textbook error that appears in any summary built by
averaging a column of percentages.

#### The exact computation

1. For any percent/rate column with a companion count column in the same frame (or a
   frame where the product itself computes group rates): simple mean of the rates vs
   count-weighted mean.
2. Flag when the two differ by more than 2 percentage points or 10% relative
   (ASSUMPTION).

#### Evidence shown

1. "Average of regional rates: 71%. Weighted by customers: 58%. Two small regions at
   100% pull the simple average up."
2. The rows with their weights.

#### Hedging

Rung 2 "Two ways to average give two different company numbers. The weighted one
describes your customers; the simple one describes your regions." Rung 3: "Which one
is the deck showing?"

---

### 4.18 Threshold bunching (values hugging a limit)

**Feasibility: NOW** (simple density-discontinuity form).

#### The deception, plainly

Expense claims cluster just under the approval limit. Deals cluster just under the
discount-approval threshold. Scores cluster just above the pass mark. The number that
matters is being gamed, and the gaming is visible as a pile-up on one side of a line.

#### Real-world burn

Burgstahler and Dichev, 1997, documented discontinuities in the distribution of
reported earnings around zero and around prior-year earnings, consistent with
managing earnings to avoid small losses and small decreases.
https://doi.org/10.1016/S0165-4101(97)00017-7
The density-discontinuity test used in economics for such cut-offs is McCrary,
Journal of Econometrics, 2008. https://doi.org/10.1016/j.jeconom.2007.05.005

#### The exact computation

1. Candidate thresholds: round numbers within the column's range (powers of ten
   times 1, 2, 2.5, 5), plus any threshold the user states in conversation ("our
   approval limit is 5,000").
2. For each threshold t: count in the bin just below [t - h, t) and just above
   [t, t + h), with h the Freedman-Diaconis bin width. Compare with the counts in the
   next two bins outward to estimate what a smooth density would give at t.
3. Ratio of observed to smooth expectation on the crowded side; binomial p for the
   below/above split given the smooth expectation. Goes to BH.

#### Threshold and provenance

Flag when the crowded side exceeds smooth expectation by 2x and BH-surviving p, with
at least 30 rows in the two bins (ASSUMPTION).

#### Evidence shown

1. Histogram zoomed on the threshold with the pile-up visible.
2. The rows in the crowded bin, grouped by submitter/segment.
3. "212 claims between 4,900 and 4,999; 31 between 5,000 and 5,099. Smooth
   expectation about 90 each."

#### Hedging

Rung 2 "Values pile up just under 5,000. If 5,000 is a limit, people are working to
it." Rung 3: "Is 5,000 a threshold in your process?"

---

### 4.19 Label drift (one segment split into many spellings)

**Feasibility: NOW** (difflib is in the Python standard library).

#### The deception, plainly

"USA", "U.S.", "United States", "US " are four categories. The real biggest segment
is split into pieces and no longer looks biggest. Or a vendor appears under three
names, each under the review threshold.

#### The exact computation

1. For each categorical/object column with 3 to 500 distinct levels: normalise (strip,
   casefold, remove punctuation and whitespace); group levels that collapse to the
   same normalised form.
2. Fuzzy pass with `difflib.SequenceMatcher` ratio >= 0.85 between normalised levels
   (ASSUMPTION), only for levels with length >= 4 to avoid merging short codes.
3. Impact: shares and sums before and after merging.

#### Evidence shown

1. The cluster of spellings with counts.
2. "Merged, United States is 41% of revenue and the largest segment; split, its
   largest piece ranks third."
3. Recompute: "Filter Country to anything starting with U."

#### Hedging

Rung 2 "These spellings may be the same thing. If they are, the ranking changes."
Rung 3: "Are these the same <entity>?" The merge is proposed, never applied silently.

---

### 4.20 Seasonality-blind comparison

**Feasibility: NEXT.** Needs at least two full cycles and a seasonal decomposition
that is robust on short business series; statsmodels is not loaded and adding it
costs download size, so this needs its own design.

#### The deception, plainly

"December was our best month, up 40% on November." December is always up 40% on
November. Comparing adjacent periods in a seasonal series measures the calendar.

#### Sketch of computation

Autocorrelation at lags 7 (daily data) and 12 (monthly); if the seasonal lag's
autocorrelation is strong, present same-period-last-year comparison beside the
adjacent-period one, and flag when they disagree in sign. The same-period comparison
is already computed in 4.2 step 8, so the NOW version is a note attached to 4.2's
finding; the full detector waits.

---

## 5. What the detectors hand to Jarvis

The conversation layer never computes. It receives findings ranked by severity, each
with rungs 1 to 3 and the evidence, and does three things: leads ("You should see
this first"), asks the rung-3 question, and offers the `nextSteps`, which are always
one of: open these rows; rerun with these rows excluded (routes to the existing
preprocessing operations); rerun split by this column (routes to the existing
grouped charts); ask the person who made the file this exact question. The detector
supplies the question text, so the user can forward it verbatim.

The "sees what you could not" promise is kept by three properties of this design:
every finding names rows, every finding is recomputable in Excel, and every finding
prints how many things were tried before it was found.

---

## 6. Golden datasets for validation (all real, all public)

The thresholds marked ASSUMPTION above are tuned against these, and the tuned values
are recorded in this file when they change.

- UC Berkeley 1973 admissions (aggregate by department; `UCBAdmissions` in R's
  datasets package). Must trigger 4.1 with Z = Dept. Bickel et al., 1975.
- Kidney stone treatment table (Charig et al., 1986): must trigger 4.1 with
  Z = stone size.
- Titanic passenger list (survival by class and sex; public domain, in many
  packages): a stratification exercise where 4.1 must NOT report a full reversal for
  sex by class, only interaction, to test false-positive control.
- Palmer penguins (Gorman, Williams and Fraser, 2014, PLoS ONE,
  https://doi.org/10.1371/journal.pone.0090081): bill depth vs body mass reverses
  within species. Must trigger 4.10 with C = species.
- Anscombe's quartet (Anscombe, The American Statistician, 1973,
  https://doi.org/10.1080/00031305.1973.10478966): four datasets with identical
  summary statistics. 4.3 and 4.13 must separate them.
- Synthetic controls, generated in-repo with a fixed seed: random data with 30
  categorical columns (4.1 must find nothing after BH); a Pareto column (4.3 must
  fire and the wording must present both numbers); a fabricated-digit column and a
  natural one (4.11 must separate them); a file with exactly 65,536 rows (4.15).

---

## 7. What this engine never claims

- It never says a number is false. It says which rows a number depends on.
- It never says a person did something. It says which segment the pattern lives in.
- It never says "the true value is". It says "under this assumption it would be",
  labelled as a what-if.
- It never reports a finding without the count of things it tried.
- It never hides a threshold. Every gate above is listed with its provenance and is
  shown in the UI on request.
- It never runs anywhere but the user's machine. Every computation above is pandas,
  numpy, scipy and the Python standard library, already inside the worker's CSP.

---

## 8. Open questions for the founding team

1. Row budget: what file size must a full scan handle in the browser within the
   upload wait? This sets the sampling cap in section 2.6 and the bootstrap counts.
2. Should ATTENUATION findings (4.1 grade 3) be shown by default? They are common and
   true, but they dilute the impact of FULL reversals. Proposal: shown, lower on the
   list, phrased as "half the gap is mix".
3. Excel parsing happens in JavaScript before the worker sees CSV. Formulas are lost
   at that step. If the Excel layer can pass a "this cell was a formula" mask, 4.14
   becomes dramatically stronger (an overwritten formula is then a fact, not an
   inference). Worth a look at the sheet parser.
4. Whether to expose the detector thresholds as a settings panel ("audit strictness")
   or keep them fixed and documented. Proposal: fixed in v1, documented, with the
   `testsRun` and `adjustedP` fields visible so a sceptical reader can judge.
