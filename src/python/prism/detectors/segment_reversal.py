"""
Segment reversal (Simpson's paradox), docs/vision/02_DETECTORS.md section 4.1.

The deception, plainly: the overall number says A beats B. Inside the segments,
B beats A, or the gap mostly disappears. Both are arithmetically true. The
overall number is driven by mix: A happens to be concentrated in the segments
where everyone does well. Whoever shows only the overall number, or only the
segments, chooses your conclusion for you.

What this module does, in order:

1. Builds candidate comparisons X (two-level splits of a categorical column),
   outcomes Y (binary events and numeric measures) and stratifiers Z
   (categorical columns, quartile-binned numeric columns, date parts).
2. For every (X, Y, Z) triple that clears the structural gates (coverage,
   practical size), computes the aggregate effect, the per-stratum effects,
   the Mantel-Haenszel adjusted effect, and the mechanism statistics.
3. Grades the triple: FULL or MAJORITY reversal, ATTENUATION, INTERACTION.
4. Controls the false discovery rate across everything it tested.
5. Bootstraps the sign of the adjusted effect for the survivors.
6. Re-runs each survivor with any catch-all stratum ("Other", "Misc",
   "Unknown") set aside, because a bucket that holds most of the rows and
   cannot be split hides exactly the structure this detector looks for
   (06_LAUNCH request D2).

One decision here departs from the letter of 02 section 4.1 step 8, and it is
the most important line in the file. The p-value that enters the multiplicity
pool is NOT the test of the adjusted effect against zero. On the Berkeley 1973
data, the within-department effect is 1.9 points in favour of women with a
Cochran-Mantel-Haenszel p of 0.21: not distinguishable from zero. Pooling that
p would have made the most famous confounding example in statistics
"not significant" and hidden it. The finding is not "B is ahead within
segments"; the finding is "the overall gap is mix". The hypothesis that
matters is therefore confounding, whose two necessary conditions are that Z
is associated with X (mix) and that Z is associated with Y (segments differ).
Both must hold, so the pooled p is the larger of the two (an intersection-union
test, valid at level alpha). The adjusted effect's own p-value is reported on
the card beside it so the within-segment lead is never overstated.

Every threshold is in ``Thresholds`` with its provenance. Values marked
ASSUMPTION are to be tuned against the golden files in tests/python.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats

from prism import columns as C
from prism.evidence import Finding, k_of_n, num, p_value, pct, points
from prism.multiplicity import benjamini_hochberg

DETECTOR = "segment_reversal"
VERSION = "1.0.0"
REQUIRES_SCIPY = True

GRADE_FULL = "FULL"
GRADE_MAJORITY = "MAJORITY"
GRADE_ATTENUATION = "ATTENUATION"
GRADE_INTERACTION = "INTERACTION"
GRADE_NONE = "NONE"

REVERSAL_GRADES = (GRADE_FULL, GRADE_MAJORITY)
REPORTED_GRADES = (GRADE_FULL, GRADE_MAJORITY, GRADE_ATTENUATION, GRADE_INTERACTION)

CATCHALL_PATTERN = re.compile(
    r"^\s*(other|others|misc|miscellaneous|unknown|unk|n/?a|none|null|unspecified|"
    r"not specified|uncategori[sz]ed|unclassified|blank|\(blank\)|general|all other|rest)\s*$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Thresholds:
    # Minimum rows per (X level, Z level) cell for a stratum to count.
    # ASSUMPTION: the conventional expected-count floor for a 2x2 chi-square is
    # 5; below it a stratum's direction is noise.
    n_min: int = 5
    # Share of valid rows that must sit in qualifying strata. ASSUMPTION: a
    # reversal living in a fifth of the data is a different, weaker story.
    coverage_min: float = 0.8
    # Practical-size gate on the aggregate gap. Binary: two percentage points
    # (ASSUMPTION: below that nobody makes a decision on the gap). Numeric:
    # Cohen's d 0.2, Cohen (1988) "small" (CITED).
    binary_size_gate: float = 0.02
    numeric_size_gate_d: float = 0.2
    # Mix gate: Cramer's V between X and Z. A reversal without mix imbalance is
    # arithmetically impossible, so one that appears without it is noise.
    # ASSUMPTION for the exact value.
    mix_gate_v: float = 0.1
    # ATTENUATION: the adjusted gap is at most this share of the aggregate gap.
    # ASSUMPTION: "half the gap is mix" is where a CEO would want to know.
    attenuation_ratio: float = 0.5
    # MAJORITY: share of qualifying rows in reversed strata. ASSUMPTION.
    majority_share: float = 2.0 / 3.0
    # Bootstrap sign stability required. ASSUMPTION, to be tuned.
    stability_full: float = 0.9
    stability_majority: float = 0.8
    # False discovery rate across the triples tested. Convention.
    fdr_q: float = 0.05
    # Search caps from 02 section 4.1.
    max_x_comparisons: int = 30
    max_z: int = 40
    z_max_levels: int = 20
    # Z is a near copy of X above this Cramer's V.
    near_copy_v: float = 0.95
    # A stratum whose label matches CATCHALL_PATTERN and holds at least this
    # share of rows triggers the set-aside pass. ASSUMPTION.
    catchall_min_share: float = 0.25
    bootstrap_resamples: int = 300
    bootstrap_row_cap: int = 50_000
    seed: int = 20260913
    max_row_indices: int = 500
    primary_findings: int = 3


DEFAULT_THRESHOLDS = Thresholds()


# ---------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------

@dataclass
class Comparison:
    """A two-level split of one column: level a against level b (or the rest)."""
    column: str
    a_label: str
    b_label: str
    codes: np.ndarray  # 1 = a, 0 = b, -1 = null or excluded
    balance: float


@dataclass
class Outcome:
    column: str
    kind: str  # "binary" or "numeric"
    values: np.ndarray  # float; NaN where null; binary is 0/1 with 1 = event
    event_label: Optional[str] = None


@dataclass
class Stratifier:
    source: str
    label: str
    kind: str  # "categorical", "binned", "datepart"
    codes: np.ndarray  # int; -1 = null
    levels: List[str]
    tiny_strata: int
    rebin: Optional[Callable[[], Tuple[np.ndarray, List[str]]]] = None


def _codes_from_labels(series: pd.Series, levels: Sequence[str]) -> np.ndarray:
    lookup = {lvl: i for i, lvl in enumerate(levels)}
    as_str = series.map(lambda v: None if pd.isna(v) else C._label(v))
    return as_str.map(lambda v: lookup.get(v, -1) if v is not None else -1).to_numpy(dtype=int)


def build_comparisons(df: pd.DataFrame, roles: Dict[str, C.ColumnRole], th: Thresholds) -> List[Comparison]:
    out: List[Comparison] = []
    for r in roles.values():
        if r.role not in (C.ROLE_BINARY, C.ROLE_CATEGORICAL) or not (2 <= r.n_levels <= 6):
            continue
        codes_all = _codes_from_labels(df[r.name], r.levels)
        valid = codes_all >= 0
        n_valid = int(valid.sum())
        if n_valid == 0:
            continue
        if r.n_levels == 2:
            codes = np.where(valid, (codes_all == 0).astype(int), -1)
            share = (codes == 1).sum() / n_valid
            out.append(Comparison(r.name, r.levels[0], r.levels[1], codes, min(share, 1 - share)))
            continue
        # k levels, 3..6: each level against the rest, plus the top two head to head.
        for i, lvl in enumerate(r.levels):
            codes = np.where(valid, (codes_all == i).astype(int), -1)
            share = (codes == 1).sum() / n_valid
            out.append(Comparison(r.name, lvl, "rest", codes, min(share, 1 - share)))
        top2 = (codes_all == 0) | (codes_all == 1)
        codes = np.where(top2, (codes_all == 0).astype(int), -1)
        n_top = int(top2.sum())
        if n_top:
            share = (codes == 1).sum() / n_top
            out.append(Comparison(r.name, r.levels[0], r.levels[1], codes, min(share, 1 - share)))
    # Balanced comparisons first: the ones a deck is likely to headline.
    out.sort(key=lambda c: -c.balance)
    return out[: th.max_x_comparisons]


def build_outcomes(df: pd.DataFrame, roles: Dict[str, C.ColumnRole]) -> List[Outcome]:
    out: List[Outcome] = []
    for r in roles.values():
        if r.role == C.ROLE_NUMERIC:
            out.append(Outcome(r.name, "numeric", pd.to_numeric(df[r.name], errors="coerce").to_numpy(dtype=float)))
        elif r.role == C.ROLE_BINARY:
            # The second most frequent level is the event (02 section 4.1).
            codes = _codes_from_labels(df[r.name], r.levels)
            values = np.where(codes >= 0, (codes == 1).astype(float), np.nan)
            out.append(Outcome(r.name, "binary", values, event_label=r.levels[1]))
    return out


def build_stratifiers(df: pd.DataFrame, roles: Dict[str, C.ColumnRole], th: Thresholds) -> List[Stratifier]:
    out: List[Stratifier] = []
    for r in roles.values():
        if r.role in (C.ROLE_BINARY, C.ROLE_CATEGORICAL) and 2 <= r.n_levels <= th.z_max_levels:
            codes = _codes_from_labels(df[r.name], r.levels)
            counts = np.bincount(codes[codes >= 0], minlength=len(r.levels))
            out.append(Stratifier(r.name, r.name, "categorical", codes, list(r.levels), int((counts < 2 * th.n_min).sum())))
        elif r.role == C.ROLE_NUMERIC and r.n_levels >= 8:
            values = pd.to_numeric(df[r.name], errors="coerce")

            def binned(q: int, values: pd.Series = values, name: str = r.name) -> Tuple[np.ndarray, List[str]]:
                try:
                    cats, edges = pd.qcut(values, q, labels=False, retbins=True, duplicates="drop")
                except ValueError:
                    return np.full(len(values), -1, dtype=int), []
                codes = cats.fillna(-1).to_numpy(dtype=int)
                n_bins = len(edges) - 1
                if n_bins < 2:
                    return np.full(len(values), -1, dtype=int), []
                labels = [f"{_edge(edges[i])} to {_edge(edges[i + 1])} of {name}" for i in range(n_bins)]
                return codes, labels

            codes, labels = binned(4)
            if len(labels) >= 2:
                counts = np.bincount(codes[codes >= 0], minlength=len(labels))
                out.append(Stratifier(r.name, f"quartiles of {r.name}", "binned", codes, labels,
                                      int((counts < 2 * th.n_min).sum()), rebin=lambda b=binned: b(3)))
        elif r.role == C.ROLE_DATETIME:
            dt = pd.to_datetime(df[r.name], errors="coerce", format="mixed")
            for part, getter in (("year", dt.dt.year), ("quarter", dt.dt.quarter), ("month", dt.dt.month)):
                levels_series = getter.dropna().astype(int)
                if levels_series.empty:
                    continue
                levels_sorted = sorted(levels_series.unique().tolist())
                if not (2 <= len(levels_sorted) <= th.z_max_levels):
                    continue
                labels = [f"{part} {v}" for v in levels_sorted]
                lookup = {v: i for i, v in enumerate(levels_sorted)}
                codes = getter.map(lambda v: lookup.get(int(v), -1) if pd.notna(v) else -1).to_numpy(dtype=int)
                counts = np.bincount(codes[codes >= 0], minlength=len(labels))
                out.append(Stratifier(r.name, f"{part} of {r.name}", "datepart", codes, labels, int((counts < 2 * th.n_min).sum())))
    # Drop the stratifiers with the most tiny strata first.
    out.sort(key=lambda s: s.tiny_strata)
    return out[: th.max_z]


def _edge(v: float) -> str:
    if float(v).is_integer():
        return f"{int(v):,}"
    return f"{v:,.2f}"


# ---------------------------------------------------------------------------
# Statistics on a 2 x K (binary) or cell-mean (numeric) table
# ---------------------------------------------------------------------------

def _contingency(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Dense contingency table of two non-negative integer-coded arrays."""
    if len(a) == 0:
        return np.zeros((0, 0))
    ka = int(a.max()) + 1
    kb = int(b.max()) + 1
    table = np.bincount(a * kb + b, minlength=ka * kb).reshape(ka, kb)
    # Drop empty rows and columns so the degrees of freedom are right.
    table = table[table.sum(axis=1) > 0][:, table.sum(axis=0) > 0]
    return table


def cramers_v(a: np.ndarray, b: np.ndarray) -> Tuple[float, float]:
    """Cramer's V and the chi-square p-value for two integer-coded arrays."""
    table = _contingency(a, b)
    if table.shape[0] < 2 or table.shape[1] < 2:
        return 0.0, 1.0
    chi2, p, _, _ = scipy_stats.chi2_contingency(table, correction=False)
    n = table.sum()
    k = min(table.shape) - 1
    v = math.sqrt(chi2 / (n * k)) if n > 0 and k > 0 else 0.0
    return float(v), float(p)


def mantel_haenszel_or(a: np.ndarray, b: np.ndarray, c: np.ndarray, d: np.ndarray) -> float:
    """Common odds ratio of the event for group a against group b across strata.

    a = events in group a, b = non-events in group a, c = events in group b,
    d = non-events in group b. Mantel and Haenszel (1959), JNCI 22(4).
    """
    n = a + b + c + d
    numer = float(np.sum(a * d / n))
    denom = float(np.sum(b * c / n))
    if denom == 0:
        return math.inf if numer > 0 else math.nan
    return numer / denom


def cmh_test(a: np.ndarray, b: np.ndarray, c: np.ndarray, d: np.ndarray) -> Tuple[float, float]:
    """Cochran-Mantel-Haenszel chi-square (1 df, no continuity correction) and p."""
    n = a + b + c + d
    r1 = a + b
    r2 = c + d
    m1 = a + c
    m0 = b + d
    ok = n > 1
    expected = r1[ok] * m1[ok] / n[ok]
    var = r1[ok] * r2[ok] * m1[ok] * m0[ok] / (n[ok] ** 2 * (n[ok] - 1))
    total_var = float(var.sum())
    if total_var <= 0:
        return 0.0, 1.0
    chi2 = float((a[ok] - expected).sum() ** 2 / total_var)
    return chi2, float(scipy_stats.chi2.sf(chi2, 1))


def breslow_day_test(a: np.ndarray, b: np.ndarray, c: np.ndarray, d: np.ndarray, psi: float) -> Tuple[float, float]:
    """Breslow-Day homogeneity test with Tarone's correction. Returns (stat, p).

    Under a common odds ratio ``psi`` the expected a-cell in each stratum is the
    admissible root of a quadratic; the statistic sums squared deviations over
    their variances and is chi-square with K - 1 degrees of freedom.
    Breslow and Day (1980), Statistical Methods in Cancer Research I, section
    4.4; Tarone (1985), Biometrika 72(1).
    """
    if not math.isfinite(psi) or psi <= 0 or len(a) < 2:
        return 0.0, 1.0
    stat = 0.0
    sum_dev = 0.0
    sum_var = 0.0
    for ai, bi, ci, di in zip(a, b, c, d):
        n = ai + bi + ci + di
        r = ai + bi
        m1 = ai + ci
        # a_tilde * (n - r - m1 + a_tilde) = psi * (r - a_tilde) * (m1 - a_tilde)
        qa = psi - 1.0
        qb = -(psi * (r + m1) + (n - r - m1))
        qc = psi * r * m1
        if abs(qa) < 1e-12:
            roots = [-qc / qb] if qb != 0 else []
        else:
            disc = qb * qb - 4 * qa * qc
            if disc < 0:
                continue
            s = math.sqrt(disc)
            roots = [(-qb - s) / (2 * qa), (-qb + s) / (2 * qa)]
        lo = max(0.0, r + m1 - n)
        hi = min(r, m1)
        admissible = [x for x in roots if lo < x < hi]
        if not admissible:
            continue
        at = admissible[0]
        var = 1.0 / (1.0 / at + 1.0 / (r - at) + 1.0 / (m1 - at) + 1.0 / (n - r - m1 + at))
        if var <= 0:
            continue
        stat += (ai - at) ** 2 / var
        sum_dev += ai - at
        sum_var += var
    if sum_var > 0:
        stat -= sum_dev ** 2 / sum_var  # Tarone's correction
    stat = max(stat, 0.0)
    return float(stat), float(scipy_stats.chi2.sf(stat, len(a) - 1))


def adjusted_difference_closed_form(e_z: np.ndarray, n_a: np.ndarray, n_b: np.ndarray) -> Tuple[float, np.ndarray]:
    """Mantel-Haenszel weighted mean of stratum differences and the weights.

    For a numeric outcome this is exactly the coefficient on the X indicator in
    an ordinary least squares fit of Y on [1, X, Z dummies] (Frisch and Waugh,
    1933): the additive model's X coefficient is the within-stratum difference
    weighted by n_a n_b / (n_a + n_b). tests/python pins that identity against
    numpy.linalg.lstsq.
    """
    w = n_a * n_b / (n_a + n_b)
    return float(np.sum(w * e_z) / np.sum(w)), w


@dataclass
class TripleResult:
    x: Comparison
    y: Outcome
    z: Stratifier
    n_valid: int
    n_qualifying: int
    strata: List[Dict[str, Any]]
    coverage: float
    # Aggregate (all valid rows)
    n_a: int
    n_b: int
    mean_a: float
    mean_b: float
    e_agg: float
    events_a: Optional[int]
    events_b: Optional[int]
    crude_or: Optional[float]
    cohens_d: Optional[float]
    pooled_sd: Optional[float]
    # Adjusted
    e_adj: float
    adjusted_or: Optional[float]
    p_adjusted_effect: float
    p_heterogeneity: float
    reversed_share: float
    reversed_count: int
    # Mechanism
    mix_v: float
    p_mix: float
    p_segment: float
    # Structural grade before multiplicity control, and the two hypotheses.
    grade: str
    reason: str
    p_confounding: float      # max(p_mix, p_segment): intersection-union test
    q_confounding: float = math.nan
    q_heterogeneity: float = math.nan
    # After BH: the p and q that justify the reported grade.
    p_primary: float = math.nan
    q_value: float = math.nan
    stability: Optional[float] = None
    consequence: float = 0.0
    without_catchall: Optional["TripleResult"] = None
    catchall_levels: List[str] = field(default_factory=list)
    catchall_share: float = 0.0
    tertile_confirmed: Optional[bool] = None
    also_holds_for: List[str] = field(default_factory=list)


def evaluate_triple(x: Comparison, y: Outcome, z: Stratifier, th: Thresholds,
                    exclude_z: Optional[Sequence[int]] = None) -> Optional[TripleResult]:
    """Compute everything for one (X, Y, Z). Returns None if a structural gate fails."""
    xc = x.codes
    zc = z.codes
    if exclude_z:
        zc = np.where(np.isin(zc, list(exclude_z)), -1, zc)
    mask = (xc >= 0) & (zc >= 0) & ~np.isnan(y.values)
    n_valid = int(mask.sum())
    if n_valid < 4 * th.n_min:
        return None
    xv = xc[mask]
    zv = zc[mask]
    yv = y.values[mask]
    k = len(z.levels)
    cell = zv * 2 + xv
    cnt = np.bincount(cell, minlength=2 * k).reshape(k, 2).astype(float)  # [:,0]=b, [:,1]=a
    sums = np.bincount(cell, weights=yv, minlength=2 * k).reshape(k, 2)
    sumsq = np.bincount(cell, weights=yv * yv, minlength=2 * k).reshape(k, 2)

    qualifying = (cnt[:, 0] >= th.n_min) & (cnt[:, 1] >= th.n_min)
    n_q = int(cnt[qualifying].sum())
    if qualifying.sum() < 2:
        return None
    coverage = n_q / n_valid
    if coverage < th.coverage_min:
        return None

    n_a = int((xv == 1).sum())
    n_b = int((xv == 0).sum())
    if n_a < th.n_min or n_b < th.n_min:
        return None
    mean_a = float(yv[xv == 1].mean())
    mean_b = float(yv[xv == 0].mean())
    e_agg = mean_a - mean_b

    events_a = events_b = crude_or = cohens_d = pooled_sd = None
    if y.kind == "binary":
        events_a = int(round(yv[xv == 1].sum()))
        events_b = int(round(yv[xv == 0].sum()))
        if abs(e_agg) < th.binary_size_gate:
            return None
        denom = (n_a - events_a) * events_b
        crude_or = (events_a * (n_b - events_b)) / denom if denom > 0 else math.inf
    else:
        va = yv[xv == 1]
        vb = yv[xv == 0]
        pooled_sd = math.sqrt(((n_a - 1) * va.var(ddof=1) + (n_b - 1) * vb.var(ddof=1)) / (n_a + n_b - 2))
        if pooled_sd <= 0:
            return None
        cohens_d = e_agg / pooled_sd
        if abs(cohens_d) < th.numeric_size_gate_d:
            return None

    q_idx = np.flatnonzero(qualifying)
    na_z = cnt[q_idx, 1]
    nb_z = cnt[q_idx, 0]
    ma_z = sums[q_idx, 1] / na_z
    mb_z = sums[q_idx, 0] / nb_z
    e_z = ma_z - mb_z
    e_adj, w = adjusted_difference_closed_form(e_z, na_z, nb_z)

    adjusted_or = None
    if y.kind == "binary":
        a_ev = sums[q_idx, 1]
        c_ev = sums[q_idx, 0]
        b_ne = na_z - a_ev
        d_ne = nb_z - c_ev
        adjusted_or = mantel_haenszel_or(a_ev, b_ne, c_ev, d_ne)
        _, p_adjusted_effect = cmh_test(a_ev, b_ne, c_ev, d_ne)
        _, p_heterogeneity = breslow_day_test(a_ev, b_ne, c_ev, d_ne, adjusted_or)
    else:
        kq = len(q_idx)
        within_ss = float((sumsq[q_idx] - sums[q_idx] ** 2 / cnt[q_idx]).sum())
        interaction_ss = float(np.sum(w * (e_z - e_adj) ** 2))
        df_add = n_q - (kq + 1)
        if df_add <= 0:
            return None
        se = math.sqrt((within_ss + interaction_ss) / df_add / float(w.sum()))
        t = e_adj / se if se > 0 else 0.0
        p_adjusted_effect = float(2 * scipy_stats.t.sf(abs(t), df_add))
        df_cell = n_q - 2 * kq
        if kq > 1 and df_cell > 0 and within_ss > 0:
            f = (interaction_ss / (kq - 1)) / (within_ss / df_cell)
            p_heterogeneity = float(scipy_stats.f.sf(f, kq - 1, df_cell))
        else:
            p_heterogeneity = 1.0

    n_z = na_z + nb_z
    sign_agg = np.sign(e_agg)
    reversed_mask = np.sign(e_z) == -sign_agg
    reversed_share = float(n_z[reversed_mask].sum() / n_z.sum())
    reversed_count = int(reversed_mask.sum())

    # Mechanism, on the qualifying rows only.
    in_q = qualifying[zv]
    mix_v, p_mix = cramers_v(xv[in_q], zv[in_q])
    if y.kind == "binary":
        _, p_segment = cramers_v(zv[in_q], yv[in_q].astype(int))
    else:
        groups = [yv[in_q][zv[in_q] == g] for g in q_idx]
        groups = [g for g in groups if len(g) > 1]
        p_segment = float(scipy_stats.f_oneway(*groups).pvalue) if len(groups) > 1 else 1.0
        if math.isnan(p_segment):
            p_segment = 1.0

    grade, reason = _grade(e_agg, e_adj, e_z, reversed_share, reversed_count, len(q_idx), mix_v, th)
    p_confounding = max(p_mix, p_segment)

    strata = []
    for j, zi in enumerate(q_idx):
        row: Dict[str, Any] = {
            "level": z.levels[zi],
            "n_a": int(na_z[j]), "n_b": int(nb_z[j]),
            "mean_a": float(ma_z[j]), "mean_b": float(mb_z[j]),
            "effect": float(e_z[j]), "weight": float(w[j]),
            "reversed": bool(reversed_mask[j]),
            "share_of_a": float(na_z[j] / n_a), "share_of_b": float(nb_z[j] / n_b),
        }
        if y.kind == "binary":
            row["events_a"] = int(round(sums[zi, 1]))
            row["events_b"] = int(round(sums[zi, 0]))
        strata.append(row)

    consequence = abs(e_agg - e_adj) / (pooled_sd if pooled_sd else 1.0)

    return TripleResult(
        x=x, y=y, z=z, n_valid=n_valid, n_qualifying=n_q, strata=strata, coverage=coverage,
        n_a=n_a, n_b=n_b, mean_a=mean_a, mean_b=mean_b, e_agg=e_agg,
        events_a=events_a, events_b=events_b, crude_or=crude_or, cohens_d=cohens_d, pooled_sd=pooled_sd,
        e_adj=e_adj, adjusted_or=adjusted_or, p_adjusted_effect=p_adjusted_effect,
        p_heterogeneity=p_heterogeneity, reversed_share=reversed_share, reversed_count=reversed_count,
        mix_v=mix_v, p_mix=p_mix, p_segment=p_segment, grade=grade, reason=reason,
        p_confounding=p_confounding, consequence=consequence,
    )


def _grade(e_agg: float, e_adj: float, e_z: np.ndarray, reversed_share: float, reversed_count: int,
           k: int, mix_v: float, th: Thresholds) -> Tuple[str, str]:
    """Structural grade from the effect sizes alone.

    No p-value is consulted here. Whether a graded triple is reported depends
    on the multiplicity-controlled q-value of the matching hypothesis, decided
    in ``detect`` after every triple has been evaluated. Grading first and
    correcting only the survivors is the selection error that turns random
    data into findings; the synthetic control in tests/python pins this.
    """
    flipped = np.sign(e_adj) != np.sign(e_agg) and e_adj != 0
    if flipped and mix_v < th.mix_gate_v:
        return GRADE_NONE, "sign flipped without mix imbalance; treated as noise"
    if flipped and reversed_count == k:
        return GRADE_FULL, "every qualifying stratum reverses and the adjusted effect flips"
    if flipped and reversed_share >= th.majority_share:
        return GRADE_MAJORITY, "most rows sit in reversed strata and the adjusted effect flips"
    if not flipped and abs(e_adj) <= th.attenuation_ratio * abs(e_agg):
        if mix_v < th.mix_gate_v:
            return GRADE_NONE, "gap shrinks but without mix imbalance; treated as noise"
        return GRADE_ATTENUATION, "the gap mostly disappears once the segment is held constant"
    # Interaction candidate: same direction in every stratum, but the size of
    # the gap differs materially. ASSUMPTION: "materially" is a largest stratum
    # effect at least twice the smallest, or a stratum that points the other
    # way without changing the adjusted sign.
    magnitudes = np.abs(e_z)
    same_direction = bool(np.all(np.sign(e_z) == np.sign(e_agg)))
    if same_direction and magnitudes.min() > 0 and magnitudes.max() >= 2.0 * magnitudes.min():
        return GRADE_INTERACTION, "same direction everywhere but the size of the gap differs by segment"
    if not same_direction and not flipped:
        return GRADE_INTERACTION, "some segments point the other way, though the adjusted direction holds"
    return GRADE_NONE, "aggregate and segments agree"


def bootstrap_stability(x: Comparison, y: Outcome, z: Stratifier, th: Thresholds, point_sign: float,
                        exclude_z: Optional[Sequence[int]] = None) -> float:
    """Share of row resamples in which the adjusted effect keeps its sign."""
    xc = x.codes
    zc = z.codes
    if exclude_z:
        zc = np.where(np.isin(zc, list(exclude_z)), -1, zc)
    mask = (xc >= 0) & (zc >= 0) & ~np.isnan(y.values)
    xv = xc[mask]
    zv = zc[mask]
    yv = y.values[mask]
    rng = np.random.default_rng(th.seed)
    n = len(xv)
    if n > th.bootstrap_row_cap:
        keep = rng.choice(n, th.bootstrap_row_cap, replace=False)
        xv, zv, yv = xv[keep], zv[keep], yv[keep]
        n = len(xv)
    k = len(z.levels)
    agree = 0
    for _ in range(th.bootstrap_resamples):
        idx = rng.integers(0, n, n)
        cell = zv[idx] * 2 + xv[idx]
        cnt = np.bincount(cell, minlength=2 * k).reshape(k, 2).astype(float)
        sums = np.bincount(cell, weights=yv[idx], minlength=2 * k).reshape(k, 2)
        ok = (cnt[:, 0] >= th.n_min) & (cnt[:, 1] >= th.n_min)
        if ok.sum() < 2:
            continue
        na, nb = cnt[ok, 1], cnt[ok, 0]
        e_z = sums[ok, 1] / na - sums[ok, 0] / nb
        e_adj, _ = adjusted_difference_closed_form(e_z, na, nb)
        if np.sign(e_adj) == point_sign:
            agree += 1
    return agree / th.bootstrap_resamples


# ---------------------------------------------------------------------------
# The detector
# ---------------------------------------------------------------------------

@dataclass
class DetectorOutput:
    findings: List[Finding]
    tests_run: int
    candidates: Dict[str, int]
    skipped: Dict[str, int]
    results: List[TripleResult]


def _orientation_skips(roles: Dict[str, C.ColumnRole]) -> set:
    """For two binary columns the reversal is symmetric; keep one reading.

    Prefer as the outcome the column whose name reads as an outcome; failing
    that, the rightmost column (outcomes sit to the right in most sheets).
    ASSUMPTION about wording only; the numbers are orientation-invariant.
    """
    binaries = [r.name for r in roles.values() if r.role == C.ROLE_BINARY]
    skip = set()
    for i, p in enumerate(binaries):
        for q in binaries[i + 1:]:
            p_out, q_out = C.is_outcome_name(p), C.is_outcome_name(q)
            if p_out and not q_out:
                y_col = p
            elif q_out and not p_out:
                y_col = q
            else:
                y_col = q  # rightmost
            x_col = p if y_col == q else q
            skip.add((y_col, x_col))  # (x, y) orientation to skip
    return skip


def _is_deterministic(zc: np.ndarray, yv: np.ndarray) -> bool:
    """True if Y is constant within every Z level (Z decides Y, or Y decides Z)."""
    mask = (zc >= 0) & ~np.isnan(yv)
    if not mask.any():
        return False
    z = zc[mask]
    y = yv[mask]
    k = int(z.max()) + 1
    sums = np.bincount(z, weights=y, minlength=k)
    counts = np.bincount(z, minlength=k).astype(float)
    with np.errstate(invalid="ignore", divide="ignore"):
        means = sums / counts
    # Y is constant within a level exactly when its within-level variance is 0.
    sq = np.bincount(z, weights=(y - means[z]) ** 2, minlength=k)
    return bool(np.all(sq[counts > 0] <= 1e-12))


def detect(df: pd.DataFrame, roles: Optional[Dict[str, C.ColumnRole]] = None,
           th: Thresholds = DEFAULT_THRESHOLDS) -> DetectorOutput:
    roles = roles or C.infer_roles(df)
    comparisons = build_comparisons(df, roles, th)
    outcomes = build_outcomes(df, roles)
    stratifiers = build_stratifiers(df, roles, th)
    skip_orientation = _orientation_skips(roles)
    skipped: Dict[str, int] = {"same_column": 0, "orientation": 0, "near_copy": 0,
                               "deterministic": 0, "structural_gate": 0, "not_graded": 0,
                               "fdr": 0, "stability": 0, "tertiles": 0}
    results: List[TripleResult] = []

    near_copy_cache: Dict[Tuple[str, str], bool] = {}
    for x in comparisons:
        for z in stratifiers:
            if z.source == x.column:
                skipped["same_column"] += 1
                continue
            key = (x.column, z.label)
            if key not in near_copy_cache:
                m = (x.codes >= 0) & (z.codes >= 0)
                v, _ = cramers_v(x.codes[m], z.codes[m]) if m.any() else (0.0, 1.0)
                near_copy_cache[key] = v > th.near_copy_v
            if near_copy_cache[key]:
                skipped["near_copy"] += 1
                continue
            for y in outcomes:
                if y.column in (x.column, z.source):
                    skipped["same_column"] += 1
                    continue
                if (x.column, y.column) in skip_orientation:
                    skipped["orientation"] += 1
                    continue
                if _is_deterministic(z.codes, y.values):
                    skipped["deterministic"] += 1
                    continue
                res = evaluate_triple(x, y, z, th)
                if res is None:
                    skipped["structural_gate"] += 1
                    continue
                results.append(res)

    # Multiplicity control over EVERY evaluated triple, in two pools: the
    # confounding hypothesis (mix and segment association both hold) and the
    # heterogeneity hypothesis. Only then does a structural grade become a
    # reported finding.
    tests_run = len(results)
    q_conf = benjamini_hochberg([r.p_confounding for r in results])
    q_het = benjamini_hochberg([r.p_heterogeneity for r in results])
    survivors: List[TripleResult] = []
    for r, qc, qh in zip(results, q_conf, q_het):
        r.q_confounding = float(qc)
        r.q_heterogeneity = float(qh)
        if r.grade in (GRADE_FULL, GRADE_MAJORITY, GRADE_ATTENUATION):
            r.p_primary, r.q_value = r.p_confounding, r.q_confounding
        elif r.grade == GRADE_INTERACTION:
            r.p_primary, r.q_value = r.p_heterogeneity, r.q_heterogeneity
        else:
            skipped["not_graded"] += 1
            continue
        if r.q_value <= th.fdr_q:
            survivors.append(r)
        else:
            skipped["fdr"] += 1

    final: List[TripleResult] = []
    for r in survivors:
        # Catch-all set-aside pass (06_LAUNCH request D2).
        shares = {s["level"]: (s["n_a"] + s["n_b"]) / r.n_qualifying for s in r.strata}
        catchall = [lvl for lvl, sh in shares.items() if CATCHALL_PATTERN.match(lvl) and sh >= th.catchall_min_share]
        if catchall:
            idx = [r.z.levels.index(lvl) for lvl in catchall]
            sub = evaluate_triple(r.x, r.y, r.z, th, exclude_z=idx)
            r.catchall_levels = catchall
            r.catchall_share = float(sum(shares[lvl] for lvl in catchall))
            if sub is not None:
                if sub.grade in REVERSAL_GRADES:
                    sub.stability = bootstrap_stability(r.x, r.y, r.z, th, np.sign(sub.e_adj), exclude_z=idx)
                    needed = th.stability_full if sub.grade == GRADE_FULL else th.stability_majority
                    if sub.stability < needed:
                        sub.grade = GRADE_ATTENUATION if abs(sub.e_adj) <= th.attenuation_ratio * abs(sub.e_agg) else GRADE_NONE
                        sub.reason = "sign flipped but not stable under resampling"
                r.without_catchall = sub
        if r.grade in REVERSAL_GRADES:
            r.stability = bootstrap_stability(r.x, r.y, r.z, th, np.sign(r.e_adj))
            needed = th.stability_full if r.grade == GRADE_FULL else th.stability_majority
            if r.stability < needed:
                skipped["stability"] += 1
                if abs(r.e_adj) <= th.attenuation_ratio * abs(r.e_agg):
                    r.grade, r.reason = GRADE_ATTENUATION, "sign flipped but not stable under resampling; reported as attenuation"
                else:
                    continue
            if r.z.kind == "binned" and r.z.rebin is not None:
                codes3, labels3 = r.z.rebin()
                confirmed = False
                if labels3:
                    z3 = Stratifier(r.z.source, r.z.label, "binned", codes3, labels3, 0)
                    sub3 = evaluate_triple(r.x, r.y, z3, th)
                    confirmed = bool(sub3 is not None and sub3.grade in REVERSAL_GRADES)
                r.tertile_confirmed = confirmed
                if not confirmed:
                    skipped["tertiles"] += 1
                    continue
        final.append(r)

    # One finding per (comparison column, outcome column). Several splits of
    # the same column (C vs rest, S vs C) and several segment columns tell the
    # same story; the card leads with the segment column that moves the number
    # most and lists the others under "also holds for".
    final.sort(key=lambda r: -r.consequence)
    by_pair: Dict[Tuple[str, str], TripleResult] = {}
    for r in final:
        key = (r.x.column, r.y.column)
        if key in by_pair:
            keeper = by_pair[key]
            label = r.z.label if r.z.label != keeper.z.label else f"{r.z.label} ({r.x.a_label} vs {r.x.b_label})"
            if label not in keeper.also_holds_for:
                keeper.also_holds_for.append(label)
            skipped["merged_into_pair"] = skipped.get("merged_into_pair", 0) + 1
        else:
            by_pair[key] = r
    final = list(by_pair.values())
    findings = [_to_finding(r, rank, tests_run, th, df) for rank, r in enumerate(final)]
    return DetectorOutput(
        findings=findings, tests_run=tests_run,
        candidates={"comparisons": len(comparisons), "outcomes": len(outcomes), "stratifiers": len(stratifiers),
                    "triples_evaluated": len(results)},
        skipped=skipped, results=final,
    )


# ---------------------------------------------------------------------------
# Finding assembly
# ---------------------------------------------------------------------------

_SEVERITY = {GRADE_FULL: "high", GRADE_MAJORITY: "high", GRADE_ATTENUATION: "medium", GRADE_INTERACTION: "low"}


def _fmt_effect(r: TripleResult, value: float) -> str:
    if r.y.kind == "binary":
        return points(value)
    return f"{value:+,.3g} {r.y.column}"


def _fmt_mean(r: TripleResult, value: float) -> str:
    return pct(value) if r.y.kind == "binary" else num(value)


def _headline_grade(r: TripleResult) -> Tuple[str, TripleResult]:
    """The grade the card leads with, and the result it comes from."""
    if r.without_catchall is not None and r.without_catchall.grade in REVERSAL_GRADES and r.grade not in REVERSAL_GRADES:
        return r.without_catchall.grade, r.without_catchall
    return r.grade, r


def _to_finding(r: TripleResult, rank: int, tests_run: int, th: Thresholds, df: pd.DataFrame) -> Finding:
    lead_grade, lead = _headline_grade(r)
    inside_named = lead is not r
    if inside_named:
        title_key = f"{DETECTOR}.reversal_inside_named_segments"
    else:
        title_key = f"{DETECTOR}.{lead_grade.lower()}"

    a, b = r.x.a_label, r.x.b_label
    slots: Dict[str, str] = {
        "x_column": r.x.column, "a": a, "b": b,
        "y_column": r.y.column, "event": r.y.event_label or r.y.column,
        "z_column": r.z.label,
        "grade": lead_grade,
        "grade_all_rows": r.grade,
        "agg_a": _fmt_mean(r, r.mean_a), "agg_b": _fmt_mean(r, r.mean_b),
        "agg_gap": _fmt_effect(r, r.e_agg),
        "adjusted_gap": _fmt_effect(r, r.e_adj),
        "adjusted_p": p_value(r.p_adjusted_effect),
        "strata_count": str(len(r.strata)),
        "reversed_count": str(r.reversed_count),
        "coverage": pct(r.coverage, 0),
        "tests_run": f"{tests_run:,}",
        "q_value": p_value(r.q_value),
        "mix_v": num(r.mix_v, 2),
        "rank": str(rank + 1),
        "display": "primary" if rank < th.primary_findings else "also_found",
    }
    if r.y.kind == "binary":
        slots["agg_a_k_of_n"] = k_of_n(r.events_a or 0, r.n_a)
        slots["agg_b_k_of_n"] = k_of_n(r.events_b or 0, r.n_b)
        slots["crude_or"] = num(r.crude_or)
        slots["adjusted_or"] = num(r.adjusted_or)
    else:
        slots["cohens_d"] = num(r.cohens_d, 2)
    if r.stability is not None:
        slots["stability"] = pct(r.stability, 0)
    if r.catchall_levels:
        slots["catchall_level"] = ", ".join(r.catchall_levels)
        slots["catchall_share"] = pct(r.catchall_share)
    if inside_named:
        w = r.without_catchall
        assert w is not None
        slots.update({
            "named_agg_a": _fmt_mean(w, w.mean_a), "named_agg_b": _fmt_mean(w, w.mean_b),
            "named_agg_gap": _fmt_effect(w, w.e_agg), "named_adjusted_gap": _fmt_effect(w, w.e_adj),
            "named_adjusted_p": p_value(w.p_adjusted_effect),
            "named_reversed_count": str(w.reversed_count), "named_strata_count": str(len(w.strata)),
        })
        if w.y.kind == "binary":
            slots["named_agg_a_k_of_n"] = k_of_n(w.events_a or 0, w.n_a)
            slots["named_agg_b_k_of_n"] = k_of_n(w.events_b or 0, w.n_b)
            slots["named_adjusted_or"] = num(w.adjusted_or)
            slots["named_crude_or"] = num(w.crude_or)
        if w.stability is not None:
            slots["named_stability"] = pct(w.stability, 0)

    # The rows that carry the aggregate: group a inside the stratum where a is
    # most over-represented relative to b.
    carrier = max(r.strata, key=lambda s: s["share_of_a"] - s["share_of_b"])
    carrier_idx = r.z.levels.index(carrier["level"])
    carrier_mask = (r.x.codes == 1) & (r.z.codes == carrier_idx) & ~np.isnan(r.y.values)
    carrier_rows = np.flatnonzero(carrier_mask)

    aggregates: Dict[str, Any] = {
        "grade": lead_grade,
        "grade_all_rows": r.grade,
        "reason": lead.reason,
        "n_valid": r.n_valid, "n_qualifying": r.n_qualifying, "coverage": r.coverage,
        "n_a": r.n_a, "n_b": r.n_b, "mean_a": r.mean_a, "mean_b": r.mean_b,
        "events_a": r.events_a, "events_b": r.events_b,
        "aggregate_effect": r.e_agg, "adjusted_effect": r.e_adj,
        "crude_odds_ratio": r.crude_or, "adjusted_odds_ratio": r.adjusted_or,
        "cohens_d": r.cohens_d,
        "p_adjusted_effect": r.p_adjusted_effect,
        "p_heterogeneity": r.p_heterogeneity,
        "p_mix": r.p_mix, "p_segment": r.p_segment, "p_confounding": r.p_confounding,
        "q_confounding": r.q_confounding, "q_heterogeneity": r.q_heterogeneity,
        "p_primary": r.p_primary, "q_value": r.q_value, "tests_run": tests_run,
        "also_holds_for": r.also_holds_for,
        "mix_cramers_v": r.mix_v,
        "reversed_share": r.reversed_share, "reversed_count": r.reversed_count,
        "stability": r.stability,
        "strata": r.strata,
        "carrier_stratum": carrier["level"],
        # A segment column that reads as an outcome (Survived, Status) is the
        # one split that is misleading by construction: conditioning on a
        # consequence. The detector cannot know causal order, so it flags the
        # name and the card leads with the mediator question. Wording only.
        "z_reads_as_outcome": C.is_outcome_name(r.z.source),
        "catchall_levels": r.catchall_levels, "catchall_share": r.catchall_share,
        "tertile_confirmed": r.tertile_confirmed,
        "thresholds": {
            "n_min": th.n_min, "coverage_min": th.coverage_min,
            "binary_size_gate": th.binary_size_gate, "numeric_size_gate_d": th.numeric_size_gate_d,
            "mix_gate_v": th.mix_gate_v, "attenuation_ratio": th.attenuation_ratio,
            "majority_share": th.majority_share, "stability_full": th.stability_full,
            "stability_majority": th.stability_majority, "fdr_q": th.fdr_q,
            "bootstrap_resamples": th.bootstrap_resamples, "seed": th.seed,
        },
    }
    if r.without_catchall is not None:
        w = r.without_catchall
        aggregates["without_catchall"] = {
            "grade": w.grade, "reason": w.reason,
            "n_valid": w.n_valid, "n_a": w.n_a, "n_b": w.n_b,
            "mean_a": w.mean_a, "mean_b": w.mean_b, "events_a": w.events_a, "events_b": w.events_b,
            "aggregate_effect": w.e_agg, "adjusted_effect": w.e_adj,
            "crude_odds_ratio": w.crude_or, "adjusted_odds_ratio": w.adjusted_or,
            "p_adjusted_effect": w.p_adjusted_effect, "p_heterogeneity": w.p_heterogeneity,
            "reversed_share": w.reversed_share, "reversed_count": w.reversed_count,
            "stability": w.stability, "strata": w.strata, "mix_cramers_v": w.mix_v,
        }

    hypotheses = [
        f"{DETECTOR}.mix_is_the_story",          # innocent: a is concentrated where everyone does well
        f"{DETECTOR}.segment_chosen_before",      # then compare within segments
        f"{DETECTOR}.segment_is_a_consequence",   # then the overall number stands
    ]
    if r.catchall_levels:
        hypotheses.append(f"{DETECTOR}.catchall_cannot_be_split")
    if lead_grade == GRADE_INTERACTION:
        hypotheses = [f"{DETECTOR}.effect_size_varies_by_segment"]

    follow_ups = [
        {"query": "show_rows", "params": {"finding_id": "", "description": "carrier_rows"}},
        {"query": "strata_rows", "params": {"x_column": r.x.column, "x_level": a, "z_column": r.z.source}},
        {"query": "mediator_answer", "params": {"z_column": r.z.source, "x_column": r.x.column,
                                                 "options": ["before", "after", "not_sure"]}},
    ]

    if r.y.kind == "binary":
        reproduce = (
            f"In Excel: filter {r.z.source} to one value, then compute the share of rows where "
            f"{r.y.column} = {r.y.event_label} for {r.x.column} = {a} and for {r.x.column} = {b}. "
            f"Repeat for each {r.z.source} value. Then remove the filter and compute both shares again."
        )
    else:
        reproduce = (
            f"In Excel: filter {r.z.source} to one value, then average {r.y.column} for "
            f"{r.x.column} = {a} and for {r.x.column} = {b}. Repeat for each {r.z.source} value. "
            f"Then remove the filter and average again."
        )

    finding = Finding(
        detector=DETECTOR, detector_version=VERSION,
        severity=_SEVERITY[lead_grade], confidence="statistical",
        title_key=title_key, slots=slots,
        columns=[r.x.column, r.y.column, r.z.source],
        row_indices=[int(i) for i in carrier_rows[: th.max_row_indices]],
        row_count=int(len(carrier_rows)),
        aggregates=aggregates, hypotheses=hypotheses, follow_ups=follow_ups, reproduce=reproduce,
        chart_spec={"kind": "strata_vs_aggregate", "x": r.x.column, "y": r.y.column, "z": r.z.source},
    )
    for fu in finding.follow_ups:
        if fu["query"] == "show_rows":
            fu["params"]["finding_id"] = finding.id
    return finding
