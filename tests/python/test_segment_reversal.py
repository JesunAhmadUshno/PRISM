"""
Known-answer tests for the segment reversal detector, docs/vision/00_PLAN.md
section 6. These five assertions decide whether the product is real:

1. On the six itemised Berkeley departments: crude admission 44.5% men against
   30.4% women; Mantel-Haenszel adjusted odds ratio 0.904; women ahead in four
   of six departments; the detector grades it a reversal.
2. On the full file including "Other": attenuation, not reversal (adjusted
   odds ratio 1.184), with the Other bucket reported as 64.5% of rows.
3. On Titanic: sex by class is an interaction, not a reversal.
4. On a seeded random file with thirty categorical columns: nothing.
5. The duplicate pre-pass does not fire on Berkeley (tests in
   test_duplicates_gate.py; asserted here too through run_detectors).

Ground rules, as in test_statistics.py: every expected value is published,
hand-derivable, or computed here by an independent method. Nothing asserts
"the engine returns what the engine returns".

Published reference for the Berkeley counts: Bickel, Hammel and O'Connell
(1975), Science 187(4175), table 1, reproduced as ``UCBAdmissions`` in R's
datasets package. The per-department admitted and applicant counts below are
that table.
"""

from __future__ import annotations

import json
import math

import numpy as np
import pandas as pd
import pytest
from scipy import stats as scipy_stats

import golden
from prism import run_detectors
from prism.detectors import segment_reversal as sr
from prism.multiplicity import benjamini_hochberg

# Bickel et al. table 1, as reproduced in R's datasets::UCBAdmissions:
# department -> (men admitted, men applied, women admitted, women applied)
BICKEL_TABLE = {
    "A": (512, 825, 89, 108),
    "B": (353, 560, 17, 25),
    "C": (120, 325, 202, 593),
    "D": (138, 417, 131, 375),
    "E": (53, 191, 94, 393),
    "F": (22, 373, 24, 341),
}

# What the hosted per-applicant file actually contains. Measured on the
# digest-pinned bytes (tests/python/golden.py). It differs from the published
# table in exactly two cells: one admitted woman is recorded under F instead
# of C. Totals agree (557 women admitted of 1,835). The detector reports the
# file, not the textbook, so its adjusted odds ratio is 0.9038 (shown as
# 0.904) where R's mantelhaen.test on UCBAdmissions gives 0.9047 (0.905).
# This discrepancy was found by this test suite on 2026-09-13; the launch
# material must quote the file's numbers and say so.
FILE_TABLE = {
    "A": (512, 825, 89, 108),
    "B": (353, 560, 17, 25),
    "C": (120, 325, 201, 593),
    "D": (138, 417, 131, 375),
    "E": (53, 191, 94, 393),
    "F": (22, 373, 25, 341),
}


def _mh_or_from_table(table):
    """Mantel-Haenszel common odds ratio, men against women, by hand."""
    numer = denom = 0.0
    for a_adm, a_n, b_adm, b_n in table.values():
        n = a_n + b_n
        numer += a_adm * (b_n - b_adm) / n
        denom += (a_n - a_adm) * b_adm / n
    return numer / denom


@pytest.fixture(scope="module")
def berkeley() -> pd.DataFrame:
    return golden.load(golden.BERKELEY)


@pytest.fixture(scope="module")
def berkeley_six(berkeley: pd.DataFrame) -> pd.DataFrame:
    return berkeley[berkeley["Major"] != "Other"].reset_index(drop=True)


@pytest.fixture(scope="module")
def titanic() -> pd.DataFrame:
    return golden.load(golden.TITANIC)


@pytest.fixture(scope="module")
def berkeley_run(berkeley: pd.DataFrame):
    return run_detectors(berkeley)


@pytest.fixture(scope="module")
def six_run(berkeley_six: pd.DataFrame):
    return run_detectors(berkeley_six)


@pytest.fixture(scope="module")
def titanic_run(titanic: pd.DataFrame):
    return run_detectors(titanic)


def _reversal_findings(run, x=None, y=None, z=None):
    out = []
    for f in run["findings"]:
        if f["detector"] != sr.DETECTOR:
            continue
        s = f["slots"]
        if x and s["x_column"] != x:
            continue
        if y and s["y_column"] != y:
            continue
        if z and s["z_column"] != z:
            continue
        out.append(f)
    return out


# ---------------------------------------------------------------------------
# 0. The file is the file
# ---------------------------------------------------------------------------

def test_berkeley_six_departments_match_the_measured_file_table(berkeley_six: pd.DataFrame):
    for dept, (m_adm, m_n, w_adm, w_n) in FILE_TABLE.items():
        d = berkeley_six[berkeley_six["Major"] == dept]
        men = d[d["Sex"] == "M"]
        women = d[d["Sex"] == "F"]
        assert len(men) == m_n, dept
        assert len(women) == w_n, dept
        assert int((men["Admission"] == "Accepted").sum()) == m_adm, dept
        assert int((women["Admission"] == "Accepted").sum()) == w_adm, dept


def test_file_differs_from_published_table_in_exactly_two_known_cells():
    diffs = {d: (FILE_TABLE[d], BICKEL_TABLE[d]) for d in FILE_TABLE if FILE_TABLE[d] != BICKEL_TABLE[d]}
    assert sorted(diffs) == ["C", "F"]
    # Applicant counts identical everywhere; one admitted woman moves C -> F.
    for d in ("C", "F"):
        assert FILE_TABLE[d][1] == BICKEL_TABLE[d][1] and FILE_TABLE[d][3] == BICKEL_TABLE[d][3]
        assert FILE_TABLE[d][0] == BICKEL_TABLE[d][0]
    assert FILE_TABLE["C"][2] == BICKEL_TABLE["C"][2] - 1
    assert FILE_TABLE["F"][2] == BICKEL_TABLE["F"][2] + 1
    assert sum(v[2] for v in FILE_TABLE.values()) == sum(v[2] for v in BICKEL_TABLE.values()) == 557


def test_published_table_gives_r_mantelhaen_common_odds_ratio():
    # R: mantelhaen.test(UCBAdmissions)$estimate == 0.9046968. Independent
    # check that the hand formula in this file is the Mantel-Haenszel estimator.
    assert _mh_or_from_table(BICKEL_TABLE) == pytest.approx(0.9046968, abs=5e-8)


# ---------------------------------------------------------------------------
# 1. Six departments: the reversal
# ---------------------------------------------------------------------------

def test_six_departments_crude_rates_match_published(six_run):
    (f,) = _reversal_findings(six_run, x="Sex", y="Admission", z="Major")
    agg = f["evidence"]["aggregates"]
    assert agg["n_a"] == 2691 and agg["n_b"] == 1835
    assert agg["events_a"] == 1198 and agg["events_b"] == 557
    assert f["slots"]["agg_a"] == "44.5%"
    assert f["slots"]["agg_b"] == "30.4%"
    assert f["slots"]["agg_a_k_of_n"] == "1,198 of 2,691"


def test_six_departments_adjusted_odds_ratio_is_0_904(six_run):
    (f,) = _reversal_findings(six_run, x="Sex", y="Admission", z="Major")
    agg = f["evidence"]["aggregates"]
    expected = _mh_or_from_table(FILE_TABLE)
    assert expected == pytest.approx(0.9038, abs=5e-5)
    assert agg["adjusted_odds_ratio"] == pytest.approx(expected, rel=1e-12)
    # The card shows the file's number, 0.904. The published table would show
    # 0.905. The launch material quotes 0.904 and must say it is the file's.
    assert f["slots"]["adjusted_or"] == "0.904"
    assert round(_mh_or_from_table(BICKEL_TABLE), 3) == 0.905


def test_six_departments_women_ahead_in_four_of_six(six_run):
    (f,) = _reversal_findings(six_run, x="Sex", y="Admission", z="Major")
    agg = f["evidence"]["aggregates"]
    reversed_depts = sorted(s["level"] for s in agg["strata"] if s["reversed"])
    # Women ahead (men's rate below women's) in A, B, D, F per Bickel table 1.
    expected = sorted(d for d, (ma, mn, wa, wn) in FILE_TABLE.items() if ma / mn < wa / wn)
    assert expected == ["A", "B", "D", "F"]
    assert reversed_depts == expected
    assert f["slots"]["reversed_count"] == "4" and f["slots"]["strata_count"] == "6"


def test_six_departments_is_graded_a_reversal_with_the_honest_caveat(six_run):
    (f,) = _reversal_findings(six_run, x="Sex", y="Admission", z="Major")
    agg = f["evidence"]["aggregates"]
    assert agg["grade"] in sr.REVERSAL_GRADES
    assert f["title_key"] == "segment_reversal.majority"
    assert f["severity"] == "high" and f["confidence"] == "statistical"
    # The adjusted effect flips sign and is small.
    assert agg["aggregate_effect"] > 0 > agg["adjusted_effect"]
    # The caveat the card must carry: the within-department lead for women is
    # not itself distinguishable from zero. Bickel et al. reached the same
    # conclusion. If this ever reads as significant, the card is overclaiming.
    assert agg["p_adjusted_effect"] > 0.1
    # What IS significant is the confounding: mix and segment association.
    assert agg["q_value"] < 1e-6
    assert agg["stability"] >= sr.DEFAULT_THRESHOLDS.stability_majority
    assert agg["mix_cramers_v"] > sr.DEFAULT_THRESHOLDS.mix_gate_v


# ---------------------------------------------------------------------------
# 2. Full file: attenuation, and the bucket that cannot be split
# ---------------------------------------------------------------------------

def test_full_file_reports_attenuation_not_reversal(berkeley_run):
    findings = _reversal_findings(berkeley_run)
    assert len(findings) == 1, [f["title_key"] for f in findings]
    (f,) = findings
    agg = f["evidence"]["aggregates"]
    assert agg["grade_all_rows"] == sr.GRADE_ATTENUATION
    assert agg["adjusted_odds_ratio"] == pytest.approx(1.184, abs=5e-4)
    assert agg["crude_odds_ratio"] == pytest.approx(1.504, abs=5e-4)
    assert f["slots"]["agg_a"] == "44.3%" and f["slots"]["agg_b"] == "34.6%"
    assert f["slots"]["agg_gap"] == "+9.7 points"


def test_full_file_names_the_other_bucket_and_its_share(berkeley_run):
    (f,) = _reversal_findings(berkeley_run)
    agg = f["evidence"]["aggregates"]
    assert agg["catchall_levels"] == ["Other"]
    assert agg["catchall_share"] == pytest.approx(8237 / 12763, abs=1e-9)
    assert f["slots"]["catchall_share"] == "64.5%"
    assert "segment_reversal.catchall_cannot_be_split" in f["hypotheses"]


def test_full_file_reversal_exists_only_inside_the_named_departments(berkeley_run):
    (f,) = _reversal_findings(berkeley_run)
    assert f["title_key"] == "segment_reversal.reversal_inside_named_segments"
    w = f["evidence"]["aggregates"]["without_catchall"]
    assert w["grade"] in sr.REVERSAL_GRADES
    assert w["adjusted_odds_ratio"] == pytest.approx(_mh_or_from_table(FILE_TABLE), rel=1e-12)
    assert w["reversed_count"] == 4 and len(w["strata"]) == 6
    assert f["slots"]["named_adjusted_or"] == "0.904"
    assert f["slots"]["named_agg_a"] == "44.5%" and f["slots"]["named_agg_b"] == "30.4%"


def test_berkeley_run_has_exactly_one_finding_and_duplicates_did_not_apply(berkeley_run):
    assert len(berkeley_run["findings"]) == 1
    dup = next(c for c in berkeley_run["checks"] if c["detector"] == "duplicates")
    assert dup["status"] == "did_not_apply"
    assert dup["findings"] == 0
    rev = next(c for c in berkeley_run["checks"] if c["detector"] == sr.DETECTOR)
    assert rev["status"] == "ran" and rev["tests_run"] == 1


# ---------------------------------------------------------------------------
# 3. Titanic: interaction, not reversal (the false-positive control)
# ---------------------------------------------------------------------------

def test_titanic_sex_by_class_is_an_interaction_not_a_reversal(titanic_run):
    matches = _reversal_findings(titanic_run, x="Sex", y="Survived", z="Pclass")
    assert len(matches) == 1, [f["slots"] for f in _reversal_findings(titanic_run, x="Sex", y="Survived")]
    (f,) = matches
    agg = f["evidence"]["aggregates"]
    assert agg["grade"] == sr.GRADE_INTERACTION
    assert f["severity"] == "low"
    # Women survived at a higher rate in every class: no stratum reverses.
    assert agg["reversed_count"] == 0
    assert all(not s["reversed"] for s in agg["strata"])
    # Sex -> Survived is never reported as a reversal by any segment column.
    for other in _reversal_findings(titanic_run, x="Sex", y="Survived"):
        assert other["evidence"]["aggregates"]["grade"] not in sr.REVERSAL_GRADES


def test_titanic_duplicates_ran_on_passenger_id_and_found_none(titanic_run):
    dup = next(c for c in titanic_run["checks"] if c["detector"] == "duplicates")
    assert dup["status"] == "ran"
    assert dup["findings"] == 0


# ---------------------------------------------------------------------------
# 4. Random data: nothing
# ---------------------------------------------------------------------------

def _synthetic_random(seed: int, n: int = 2000) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    frame = {f"cat{i}": rng.choice(list("ABCD")[: int(rng.integers(2, 5))], n) for i in range(30)}
    frame["outcome"] = rng.choice(["yes", "no"], n)
    frame["value"] = rng.normal(size=n)
    frame["amount"] = rng.lognormal(size=n)
    return pd.DataFrame(frame)


@pytest.mark.parametrize("seed", [7, 20260913, 1975])
def test_random_categorical_file_yields_no_findings(seed: int):
    # Under the global null the BH procedure rejects anything at all with
    # probability at most q = 0.05, so a fresh seed can legitimately produce a
    # finding about one time in twenty. These three seeds are pinned; a
    # failure here after a code change is a regression, not bad luck.
    run = run_detectors(_synthetic_random(seed))
    rev = next(c for c in run["checks"] if c["detector"] == sr.DETECTOR)
    assert rev["status"] == "ran"
    assert rev["tests_run"] > 500, "the search must actually have searched"
    assert _reversal_findings(run) == []


# ---------------------------------------------------------------------------
# The arithmetic underneath, pinned to independent methods
# ---------------------------------------------------------------------------

def test_adjusted_difference_equals_ols_coefficient():
    # Frisch-Waugh: the MH-weighted mean of stratum differences is the X
    # coefficient in an additive OLS of Y on [1, X, Z dummies].
    rng = np.random.default_rng(3)
    n = 600
    z = rng.integers(0, 4, n)
    x = (rng.random(n) < 0.3 + 0.15 * z).astype(int)
    y = 2.0 * z - 1.5 * x + rng.normal(size=n)
    design = np.column_stack([np.ones(n), x] + [(z == k).astype(float) for k in range(1, 4)])
    beta = np.linalg.lstsq(design, y, rcond=None)[0][1]

    e_z, n_a, n_b = [], [], []
    for k in range(4):
        ya, yb = y[(z == k) & (x == 1)], y[(z == k) & (x == 0)]
        e_z.append(ya.mean() - yb.mean())
        n_a.append(len(ya))
        n_b.append(len(yb))
    adj, _ = sr.adjusted_difference_closed_form(np.array(e_z), np.array(n_a, float), np.array(n_b, float))
    assert adj == pytest.approx(beta, rel=1e-10)


def test_cmh_with_one_stratum_is_pearson_chi_square():
    a, b, c, d = 30.0, 20.0, 15.0, 35.0
    chi2, p = sr.cmh_test(np.array([a]), np.array([b]), np.array([c]), np.array([d]))
    ref_chi2, ref_p, _, _ = scipy_stats.chi2_contingency([[a, b], [c, d]], correction=False)
    # CMH uses the hypergeometric variance with n - 1; Pearson uses n. The
    # ratio is exactly (n - 1) / n.
    n = a + b + c + d
    assert chi2 == pytest.approx(ref_chi2 * (n - 1) / n, rel=1e-12)
    assert p == pytest.approx(scipy_stats.chi2.sf(chi2, 1), rel=1e-12)
    assert 0 < p < 1 and ref_p > 0


def test_mantel_haenszel_odds_ratio_hand_computed():
    # Two strata, worked by hand: (a d / n) summed over (b c / n).
    a = np.array([10.0, 20.0])
    b = np.array([20.0, 10.0])
    c = np.array([5.0, 15.0])
    d = np.array([15.0, 5.0])
    expected = (10 * 15 / 50 + 20 * 5 / 50) / (20 * 5 / 50 + 10 * 15 / 50)
    assert sr.mantel_haenszel_or(a, b, c, d) == pytest.approx(expected, rel=1e-12)


def test_breslow_day_is_zero_when_odds_ratios_are_identical():
    # Every stratum has odds ratio exactly 3: homogeneity holds, statistic 0.
    a = np.array([30.0, 60.0, 15.0])
    b = np.array([10.0, 20.0, 5.0])
    c = np.array([20.0, 40.0, 10.0])
    d = np.array([20.0, 40.0, 10.0])
    psi = sr.mantel_haenszel_or(a, b, c, d)
    assert psi == pytest.approx(3.0, rel=1e-12)
    stat, p = sr.breslow_day_test(a, b, c, d, psi)
    assert stat == pytest.approx(0.0, abs=1e-9)
    assert p == pytest.approx(1.0, abs=1e-9)


def test_breslow_day_and_cmh_are_calibrated_under_the_null():
    # 1,500 simulated 2x2x4 tables with a common odds ratio of 1 and random
    # stratum-specific base rates. Rejection at 0.05 must sit near 5%.
    rng = np.random.default_rng(1)
    bd_rejections = cmh_rejections = 0
    sims = 1500
    for _ in range(sims):
        n_a = rng.integers(20, 200, 4)
        n_b = rng.integers(20, 200, 4)
        p = rng.uniform(0.2, 0.8, 4)
        a = rng.binomial(n_a, p).astype(float)
        c = rng.binomial(n_b, p).astype(float)
        b = n_a - a
        d = n_b - c
        psi = sr.mantel_haenszel_or(a, b, c, d)
        bd_rejections += sr.breslow_day_test(a, b, c, d, psi)[1] < 0.05
        cmh_rejections += sr.cmh_test(a, b, c, d)[1] < 0.05
    assert 0.03 <= bd_rejections / sims <= 0.07
    assert 0.03 <= cmh_rejections / sims <= 0.07


def test_benjamini_hochberg_matches_scipy():
    rng = np.random.default_rng(11)
    p = rng.random(200) ** 3
    ours = benjamini_hochberg(p)
    ref = scipy_stats.false_discovery_control(p, method="bh")
    assert np.allclose(ours, ref, rtol=0, atol=1e-12)


def test_benjamini_hochberg_leaves_nan_out_of_the_count():
    q = benjamini_hochberg([0.01, math.nan, 0.04])
    assert math.isnan(q[1])
    # Two real tests: 0.01 * 2 / 1 = 0.02, 0.04 * 2 / 2 = 0.04.
    assert q[0] == pytest.approx(0.02) and q[2] == pytest.approx(0.04)


def test_grading_never_consults_a_p_value():
    # A reversal that would be significant is still graded from effect sizes
    # alone; multiplicity control happens later in detect(). Guard the design.
    e_z = np.array([-0.1, -0.2, -0.05])
    grade, _ = sr._grade(0.1, -0.12, e_z, 1.0, 3, 3, 0.3, sr.DEFAULT_THRESHOLDS)
    assert grade == sr.GRADE_FULL
    grade, _ = sr._grade(0.1, -0.12, e_z, 1.0, 3, 3, 0.0, sr.DEFAULT_THRESHOLDS)
    assert grade == sr.GRADE_NONE, "a flip without mix imbalance is arithmetically impossible: noise"


def test_run_output_is_json_without_nan(berkeley_run, titanic_run):
    for run in (berkeley_run, titanic_run):
        json.dumps(run, allow_nan=False)
