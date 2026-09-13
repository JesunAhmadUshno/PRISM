"""
Known-answer tests for the PRISM statistics engine.

Ground rules for this file, because the whole point is that it cannot be
satisfied by whatever the code happens to do today:

1. Every expected value is either hand-derivable from the published formula
   (and the derivation is written in the comment), taken from a published
   reference dataset with a published result, or computed here by calling
   SciPy directly with the test's own stated method.
2. Nothing asserts "the engine returns what the engine returns".
3. The regression tests are named for the defect they catch, so a reviewer can
   read the failure name and know which wrong number came back.

Reference sources cited below:
  * Student (1908), "The Probable Error of a Mean", Biometrika 6(1), using the
    Cushny & Peebles (1905) soporific data. Shipped as ``datasets::sleep`` in R.
  * Fisher's tea-tasting 2x2 table, also the worked example in the SciPy
    documentation for ``scipy.stats.fisher_exact``.
  * Closed-form chi-square: for 2 degrees of freedom the survival function is
    exactly ``exp(-chi2 / 2)``.
  * Exact Mann-Whitney null distribution for two fully separated samples.
"""

from __future__ import annotations

import math

import numpy as np
import pytest
from scipy import stats as scipy_stats

from extract_engine import (
    START_MARKER,
    EngineExtractionError,
    analyze,
    extract_python_source,
    load_engine,
    read_worker_source,
    run_test,
    to_csv,
    visualize,
)

# Tolerances. The engine and this file both call SciPy, so agreement should be
# at machine precision; the looser band is only for published figures that were
# printed to four or five significant digits.
EXACT = 1e-12
PUBLISHED_4SF = 5e-4


# --------------------------------------------------------------------------
# Fixtures and reference data
# --------------------------------------------------------------------------


@pytest.fixture(scope="session")
def engine():
    """The real engine, pulled out of src/workers/prism.worker.js."""
    return load_engine()


# Student (1908) soporific data: extra hours of sleep for the same 10 patients
# under drug 1 and drug 2. R reports, for this data:
#   t.test(extra ~ group, data = sleep, paired = TRUE)
#     t = -4.0621, df = 9,  p-value = 0.002833
#   t.test(extra ~ group, data = sleep, var.equal = TRUE)
#     t = -1.8608, df = 18, p-value = 0.07919
SLEEP_DRUG_1 = [0.7, -1.6, -0.2, -1.2, -0.1, 3.4, 3.7, 0.8, 0.0, 2.0]
SLEEP_DRUG_2 = [1.9, 0.8, 1.1, 0.1, -0.1, 4.4, 5.5, 1.6, 4.6, 3.4]

SLEEP_PAIRED_CSV = to_csv({"drug1": SLEEP_DRUG_1, "drug2": SLEEP_DRUG_2})
SLEEP_LONG_CSV = to_csv(
    {
        "extra": SLEEP_DRUG_1 + SLEEP_DRUG_2,
        "group": ["one"] * 10 + ["two"] * 10,
    }
)


def ok(result: dict) -> dict:
    """Assert the engine reported success, and surface its error if not."""
    assert result.get("success") is True, (
        "engine refused a valid request: " + str(result.get("error"))
    )
    return result


def refused(result: dict) -> str:
    """Assert the engine refused, and that it emitted no p-value with the refusal."""
    assert result.get("success") is False, (
        "engine accepted a request it must refuse; it returned " + repr(result)
    )
    assert result.get("pValue") is None, (
        "engine refused but still reported a p-value: " + repr(result)
    )
    error = result.get("error") or ""
    assert error.strip(), "engine refused without saying why: " + repr(result)
    return error


# --------------------------------------------------------------------------
# Harness integrity: if extraction silently breaks, everything below is theatre
# --------------------------------------------------------------------------


def test_engine_extraction_produced_the_real_module(engine):
    for name in ("parse_csv", "run_statistical_test", "run_visualization", "analyze_csv"):
        assert callable(getattr(engine, name, None)), (
            "extract_engine did not recover " + name + " from the worker"
        )


def test_extraction_fails_loudly_when_the_worker_layout_changes():
    """A silent extraction failure would make every test below vacuous.

    If someone renames the constant, splits the literal, or drops an
    interpolation into it, the harness must stop with a message that says so,
    not quietly test an empty namespace.
    """
    good = read_worker_source()

    renamed = good.replace(START_MARKER, "const SOMETHING_ELSE = `", 1)
    with pytest.raises(EngineExtractionError, match="Could not find the marker"):
        extract_python_source(renamed)

    truncated = good[: good.index(START_MARKER) + len(START_MARKER) + 200]
    with pytest.raises(EngineExtractionError):
        extract_python_source(truncated)

    body_at = good.index(START_MARKER) + len(START_MARKER)
    interpolated = good[:body_at] + "\n# ${runtimeValue}\n" + good[body_at:]
    with pytest.raises(EngineExtractionError, match="interpolation"):
        extract_python_source(interpolated)

    gutted = good.replace("def run_statistical_test(", "def renamed_away(", 1)
    with pytest.raises(EngineExtractionError, match="missing expected definitions"):
        extract_python_source(gutted)


def test_unknown_test_id_is_refused(engine):
    error = refused(run_test(engine, SLEEP_PAIRED_CSV, "not_a_real_test", ["drug1"]))
    assert "not_a_real_test" in error


# --------------------------------------------------------------------------
# One-sample t
# --------------------------------------------------------------------------


def test_one_sample_t_matches_hand_computed_value(engine):
    # x = 1..5: mean 3, sample sd = sqrt(2.5) = 1.5811388..., n = 5,
    # se = 1.5811388/sqrt(5) = 0.70710678, t = (3 - 0)/0.70710678 = 4.24264069,
    # df = 4, two-sided p = 0.0132356.
    csv = to_csv({"x": [1, 2, 3, 4, 5]})
    result = ok(run_test(engine, csv, "one_sample_t", ["x"], {"population_mean": 0}))
    assert result["statistic"] == pytest.approx(4.242640687119285, abs=EXACT)
    assert result["pValue"] == pytest.approx(0.01323559956368269, abs=EXACT)
    assert result["degreesOfFreedom"] == 4


def test_one_sample_t_against_a_nonzero_reference_mean(engine):
    # Same sample tested against mu = 3, which IS the sample mean, so t must be
    # exactly 0 and p exactly 1. This is the only situation in which t = 0 is
    # the right answer, and it has to still work.
    csv = to_csv({"x": [1, 2, 3, 4, 5]})
    result = ok(run_test(engine, csv, "one_sample_t", ["x"], {"population_mean": 3}))
    assert result["statistic"] == pytest.approx(0.0, abs=EXACT)
    assert result["pValue"] == pytest.approx(1.0, abs=EXACT)


def test_one_sample_t_refuses_a_zero_variance_column(engine):
    csv = to_csv({"x": [7, 7, 7, 7, 7]})
    error = refused(run_test(engine, csv, "one_sample_t", ["x"], {"population_mean": 0}))
    assert "variance" in error.lower()


# --------------------------------------------------------------------------
# Paired t
# --------------------------------------------------------------------------


def test_paired_t_matches_published_sleep_data_result(engine):
    # Student (1908) / R datasets::sleep, paired: t = -4.0621, df = 9, p = 0.002833.
    result = ok(run_test(engine, SLEEP_PAIRED_CSV, "paired_t", ["drug1", "drug2"]))
    assert result["statistic"] == pytest.approx(-4.0621, abs=PUBLISHED_4SF)
    assert result["pValue"] == pytest.approx(0.002833, abs=PUBLISHED_4SF)
    assert result["degreesOfFreedom"] == 9
    assert result["significant"] is True


# --------------------------------------------------------------------------
# Independent t
# --------------------------------------------------------------------------


def test_independent_t_matches_published_sleep_data_result(engine):
    # Same data treated as two independent groups, equal-variance Student form,
    # which is what scipy.stats.ttest_ind computes by default:
    # R: t = -1.8608, df = 18, p-value = 0.07919.
    result = ok(run_test(engine, SLEEP_LONG_CSV, "independent_t", ["extra", "group"]))
    assert result["statistic"] == pytest.approx(-1.8608, abs=PUBLISHED_4SF)
    assert result["pValue"] == pytest.approx(0.07919, abs=PUBLISHED_4SF)
    assert result["significant"] is False


# --------------------------------------------------------------------------
# Mann-Whitney U
# --------------------------------------------------------------------------


def test_mann_whitney_matches_exact_null_distribution(engine):
    # Two fully separated samples of size 4: every value of group A is below
    # every value of group B, so U = 0. Under the exact null there are
    # C(8,4) = 70 equally likely arrangements and exactly one is this extreme in
    # each direction, so the two-sided p is 2/70 = 0.0285714285714...
    csv = to_csv(
        {
            "value": [1, 2, 3, 4, 5, 6, 7, 8],
            "group": ["a"] * 4 + ["b"] * 4,
        }
    )
    result = ok(run_test(engine, csv, "mann_whitney", ["value", "group"]))
    assert result["statistic"] == pytest.approx(0.0, abs=EXACT)
    assert result["pValue"] == pytest.approx(2.0 / 70.0, abs=EXACT)


def test_mann_whitney_matches_published_sleep_data_result(engine):
    # R: wilcox.test(extra ~ group, data = sleep) gives W = 25.5, p = 0.06933
    # (normal approximation with the tie correction, which is what SciPy falls
    # back to once ties are present).
    result = ok(run_test(engine, SLEEP_LONG_CSV, "mann_whitney", ["extra", "group"]))
    assert result["statistic"] == pytest.approx(25.5, abs=EXACT)
    assert result["pValue"] == pytest.approx(0.06933, abs=PUBLISHED_4SF)


# --------------------------------------------------------------------------
# One-way ANOVA
# --------------------------------------------------------------------------


def test_one_way_anova_matches_hand_computed_f(engine):
    # Groups (1,2,3), (4,5,6), (7,8,9). Grand mean 5.
    # Between: 3 * ((2-5)^2 + (5-5)^2 + (8-5)^2) = 54, df 2, MS 27.
    # Within:  each group contributes 2, total 6, df 6, MS 1.
    # F = 27/1 = 27 exactly, and sf(27; 2, 6) = 0.001 exactly.
    csv = to_csv(
        {
            "value": [1, 2, 3, 4, 5, 6, 7, 8, 9],
            "grp": ["a", "a", "a", "b", "b", "b", "c", "c", "c"],
        }
    )
    result = ok(run_test(engine, csv, "one_way_anova", ["value", "grp"]))
    assert result["statistic"] == pytest.approx(27.0, abs=1e-10)
    assert result["pValue"] == pytest.approx(0.001, abs=EXACT)
    assert result["significant"] is True


def test_one_way_anova_uses_every_group_not_just_the_first_two(engine):
    # Two groups are identical and the third is far away. An ANOVA that only
    # looked at the first two groups would report F = 0, p = 1.
    csv = to_csv(
        {
            "value": [1, 2, 3, 1, 2, 3, 100, 101, 102],
            "grp": ["a", "a", "a", "b", "b", "b", "c", "c", "c"],
        }
    )
    result = ok(run_test(engine, csv, "one_way_anova", ["value", "grp"]))
    assert result["pValue"] < 1e-6, "third group was ignored"
    assert "3 groups" in result["interpretation"]


# --------------------------------------------------------------------------
# Chi-square
# --------------------------------------------------------------------------


def test_chi_square_independence_matches_closed_form(engine):
    # 2x3 contingency table
    #        c1  c2  c3
    #   r1   10  20  30
    #   r2   30  20  10
    # Row totals 60/60, column totals 40/40/40, N = 120, so every expected cell
    # is 20. chi2 = 4 * (10^2 / 20) = 20, df = (2-1)(3-1) = 2. For df = 2 the
    # survival function is exp(-chi2/2) = exp(-10) = 4.5399929762e-05.
    # No continuity correction applies: the table is not 2x2.
    rows = (
        [("r1", "c1")] * 10
        + [("r1", "c2")] * 20
        + [("r1", "c3")] * 30
        + [("r2", "c1")] * 30
        + [("r2", "c2")] * 20
        + [("r2", "c3")] * 10
    )
    csv = to_csv({"row": [r for r, _ in rows], "col": [c for _, c in rows]})
    result = ok(run_test(engine, csv, "chi_square_ind", ["row", "col"]))
    assert result["statistic"] == pytest.approx(20.0, abs=1e-10)
    assert result["degreesOfFreedom"] == 2
    assert result["pValue"] == pytest.approx(math.exp(-10.0), rel=1e-9)


def test_chi_square_goodness_of_fit_matches_closed_form(engine):
    # Counts 10/20/30 against a uniform expectation of 20 each:
    # chi2 = 100/20 + 0 + 100/20 = 10, df = 2, p = exp(-5) = 0.006737947.
    values = ["a"] * 10 + ["b"] * 20 + ["c"] * 30
    csv = to_csv({"cat": values})
    result = ok(run_test(engine, csv, "chi_square_gof", ["cat"]))
    assert result["statistic"] == pytest.approx(10.0, abs=1e-10)
    assert result["degreesOfFreedom"] == 2
    assert result["pValue"] == pytest.approx(math.exp(-5.0), rel=1e-9)


# --------------------------------------------------------------------------
# Fisher exact
# --------------------------------------------------------------------------


def test_fisher_exact_matches_the_tea_tasting_table(engine):
    # Fisher's tea-tasting experiment, also the worked example in the SciPy
    # docs for fisher_exact: [[3, 1], [1, 3]] gives odds ratio 9.0 and a
    # two-sided p of 17/35 = 0.4857142857142857.
    rows = (
        [("milk", "guessed_milk")] * 3
        + [("milk", "guessed_tea")] * 1
        + [("tea", "guessed_milk")] * 1
        + [("tea", "guessed_tea")] * 3
    )
    csv = to_csv({"poured": [a for a, _ in rows], "guess": [b for _, b in rows]})
    result = ok(run_test(engine, csv, "fisher_exact", ["poured", "guess"]))
    assert result["statistic"] == pytest.approx(9.0, abs=EXACT)
    assert result["pValue"] == pytest.approx(17.0 / 35.0, abs=EXACT)
    assert result["significant"] is False


# --------------------------------------------------------------------------
# Shapiro-Wilk
# --------------------------------------------------------------------------


def test_shapiro_wilk_agrees_with_scipy_on_the_same_sample(engine):
    sample = list(np.round(np.random.default_rng(20260913).normal(50, 8, 120), 6))
    expected_w, expected_p = scipy_stats.shapiro(sample)
    csv = to_csv({"x": sample})
    result = ok(run_test(engine, csv, "shapiro_wilk", ["x"]))
    assert result["statistic"] == pytest.approx(float(expected_w), abs=EXACT)
    assert result["pValue"] == pytest.approx(float(expected_p), abs=EXACT)


def test_shapiro_wilk_separates_normal_from_skewed_data(engine):
    rng = np.random.default_rng(7)
    normal = ok(
        run_test(engine, to_csv({"x": list(np.round(rng.normal(0, 1, 300), 6))}),
                 "shapiro_wilk", ["x"])
    )
    skewed = ok(
        run_test(engine, to_csv({"x": list(np.round(rng.exponential(1.0, 300), 6))}),
                 "shapiro_wilk", ["x"])
    )
    assert normal["pValue"] > 0.05, "normal sample flagged as non-normal"
    assert skewed["pValue"] < 1e-6, "heavily skewed sample passed as normal"
    assert skewed["significant"] is True


def test_shapiro_wilk_refuses_fewer_than_three_values(engine):
    error = refused(run_test(engine, to_csv({"x": [1, 2]}), "shapiro_wilk", ["x"]))
    assert "3" in error


# --------------------------------------------------------------------------
# Correlation and regression
# --------------------------------------------------------------------------


def test_pearson_matches_hand_computed_r(engine):
    # x = 1..5, y = 2,4,5,4,5. Deviations dx = -2,-1,0,1,2; dy = -2,0,1,0,1.
    # sum(dx*dy) = 6, sum(dx^2) = 10, sum(dy^2) = 6, so
    # r = 6 / sqrt(60) = sqrt(0.6) = 0.7745966692414834.
    # t = r*sqrt(3/(1-r^2)) = 2.1213203, df = 3, two-sided p = 0.1240270627.
    csv = to_csv({"x": [1, 2, 3, 4, 5], "y": [2, 4, 5, 4, 5]})
    result = ok(run_test(engine, csv, "pearson", ["x", "y"]))
    assert result["statistic"] == pytest.approx(math.sqrt(0.6), abs=EXACT)
    assert result["pValue"] == pytest.approx(0.12402706265755474, abs=EXACT)
    assert result["significant"] is False


def test_pearson_is_exactly_one_for_a_perfect_linear_relationship(engine):
    csv = to_csv({"x": [1, 2, 3, 4, 5, 6], "y": [3, 5, 7, 9, 11, 13]})
    result = ok(run_test(engine, csv, "pearson", ["x", "y"]))
    assert result["statistic"] == pytest.approx(1.0, abs=1e-12)


def test_spearman_is_one_for_a_monotonic_nonlinear_relationship(engine):
    # y = x^2 on positive x is perfectly monotonic but not linear, so Spearman
    # rho is exactly 1 while Pearson r is not.
    csv = to_csv({"x": [1, 2, 3, 4, 5], "y": [1, 4, 9, 16, 25]})
    spearman = ok(run_test(engine, csv, "spearman", ["x", "y"]))
    pearson = ok(run_test(engine, csv, "pearson", ["x", "y"]))
    assert spearman["statistic"] == pytest.approx(1.0, abs=1e-9)
    assert pearson["statistic"] < 0.99


def test_linear_regression_reports_r_squared_and_the_fitted_line(engine):
    # y = 3x + 1 exactly, so R^2 = 1, slope 3, intercept 1.
    csv = to_csv({"x": [1, 2, 3, 4, 5, 6], "y": [4, 7, 10, 13, 16, 19]})
    result = ok(run_test(engine, csv, "linear_regression", ["x", "y"]))
    assert result["statistic"] == pytest.approx(1.0, abs=1e-12)
    assert "3.000x" in result["interpretation"]
    assert "1.000" in result["interpretation"]


# --------------------------------------------------------------------------
# Remaining procedures in the catalogue
# --------------------------------------------------------------------------


def test_kruskal_wallis_agrees_with_scipy_across_three_groups(engine):
    a, b, c = [1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15]
    expected = scipy_stats.kruskal(a, b, c)
    csv = to_csv({"value": a + b + c, "grp": ["a"] * 5 + ["b"] * 5 + ["c"] * 5})
    result = ok(run_test(engine, csv, "kruskal_wallis", ["value", "grp"]))
    assert result["statistic"] == pytest.approx(float(expected.statistic), abs=EXACT)
    assert result["pValue"] == pytest.approx(float(expected.pvalue), abs=EXACT)
    assert "3 groups" in result["interpretation"]


def test_levene_detects_unequal_variances(engine):
    tight = [10, 10, 11, 9, 10, 10, 11, 9]
    wide = [10, 40, -20, 60, -30, 50, -10, 30]
    expected = scipy_stats.levene(tight, wide)
    csv = to_csv({"value": tight + wide, "grp": ["tight"] * 8 + ["wide"] * 8})
    result = ok(run_test(engine, csv, "levene", ["value", "grp"]))
    assert result["statistic"] == pytest.approx(float(expected.statistic), abs=EXACT)
    assert result["pValue"] == pytest.approx(float(expected.pvalue), abs=EXACT)
    assert result["significant"] is True


def test_wilcoxon_signed_rank_agrees_with_scipy(engine):
    before = [125, 115, 130, 140, 140, 115, 140, 125, 140, 135]
    after = [110, 122, 125, 120, 140, 124, 123, 137, 135, 145]
    pairs = [(b, a) for b, a in zip(before, after) if b != a]
    expected = scipy_stats.wilcoxon([p[0] for p in pairs], [p[1] for p in pairs])
    csv = to_csv({"before": before, "after": after})
    result = ok(run_test(engine, csv, "wilcoxon", ["before", "after"]))
    assert result["statistic"] == pytest.approx(float(expected.statistic), abs=EXACT)
    assert result["pValue"] == pytest.approx(float(expected.pvalue), abs=EXACT)


def test_f_test_variance_ratio_matches_the_definition(engine):
    a = [1, 2, 3, 4, 5, 6, 7, 8]
    b = [2, 4, 6, 8, 10, 12, 14, 16]
    # var(b) is exactly 4 * var(a) because b = 2a, so the ratio var(a)/var(b)
    # is exactly 0.25 regardless of the underlying variance.
    csv = to_csv({"a": a, "b": b})
    result = ok(run_test(engine, csv, "f_test", ["a", "b"]))
    assert result["statistic"] == pytest.approx(0.25, abs=1e-12)
    df1 = df2 = len(a) - 1
    cdf = float(scipy_stats.f.cdf(0.25, df1, df2))
    assert result["pValue"] == pytest.approx(2 * min(cdf, 1 - cdf), abs=EXACT)
    assert result["degreesOfFreedom"] == "7, 7"


def test_two_way_anova_reports_both_factors(engine):
    # Factor A separates the response, factor B does not. The engine's
    # approximation runs a one-way ANOVA per factor, so factor A must come out
    # significant and factor B must not.
    value = [1, 2, 1, 2, 10, 11, 10, 11]
    fa = ["low", "low", "low", "low", "high", "high", "high", "high"]
    fb = ["x", "y", "x", "y", "x", "y", "x", "y"]
    csv = to_csv({"value": value, "fa": fa, "fb": fb})
    result = ok(run_test(engine, csv, "two_way_anova", ["value", "fa", "fb"]))
    expected_a = scipy_stats.f_oneway([1, 2, 1, 2], [10, 11, 10, 11])
    assert result["statistic"] == pytest.approx(float(expected_a.statistic), abs=EXACT)
    assert result["significant"] is True
    assert "'fa'" in result["interpretation"] and "'fb'" in result["interpretation"]


# --------------------------------------------------------------------------
# Descriptive statistics
# --------------------------------------------------------------------------


def test_descriptive_statistics_match_hand_computed_values(engine):
    # x = 1..20. mean = median = 10.5. For 1..n the sample variance (ddof = 1)
    # is n(n+1)/12 = 35, so the standard deviation is sqrt(35) = 5.916079783.
    # Quartiles by linear interpolation (the NumPy and pandas default):
    #   q1 at position 0.25*(20-1) = 4.75 -> 5 + 0.75*(6-5)  = 5.75
    #   q3 at position 0.75*(20-1) = 14.25 -> 15 + 0.25*(16-15) = 15.25
    values = list(range(1, 21))
    csv = to_csv({"x": values, "label": ["r" + str(v) for v in values]})
    result = analyze(engine, csv)
    assert result.get("success") is True, result.get("error")

    stats_by_col = {s["columnName"]: s for s in result["summary"]["statistics"]}
    x = stats_by_col["x"]
    assert x["dataType"] == "numeric", (
        "column of 20 distinct integers was not treated as numeric: " + repr(x)
    )
    assert x["count"] == 20
    assert x["nullCount"] == 0
    assert x["mean"] == pytest.approx(10.5, abs=EXACT)
    assert x["median"] == pytest.approx(10.5, abs=EXACT)
    assert x["stdDev"] == pytest.approx(math.sqrt(35.0), abs=1e-12)
    assert x["min"] == pytest.approx(1.0, abs=EXACT)
    assert x["max"] == pytest.approx(20.0, abs=EXACT)
    assert x["q1"] == pytest.approx(5.75, abs=EXACT)
    assert x["q3"] == pytest.approx(15.25, abs=EXACT)


def test_descriptive_std_is_the_sample_standard_deviation_not_the_population_one(engine):
    # x = 1,2,3,4. Sample sd (ddof = 1) = sqrt(5/3) = 1.29099445.
    # Population sd (ddof = 0) = sqrt(1.25) = 1.11803399. They differ by 15%,
    # and reporting the wrong one understates every confidence interval built
    # on top of it.
    values = [1, 2, 3, 4] * 4 + [5, 6, 7, 8, 9, 10, 11]
    expected = float(np.std(values, ddof=1))
    population = float(np.std(values, ddof=0))
    assert not math.isclose(expected, population, rel_tol=1e-6)
    csv = to_csv({"x": values})
    result = analyze(engine, csv)
    assert result.get("success") is True, result.get("error")
    x = {s["columnName"]: s for s in result["summary"]["statistics"]}["x"]
    assert x["stdDev"] == pytest.approx(expected, abs=1e-12)


def test_box_plot_quartiles_match_hand_computed_values(engine):
    values = list(range(1, 21))
    csv = to_csv({"x": values})
    result = visualize(engine, csv, "box", ["x"])
    assert result.get("success") is True, result.get("error")
    box = result["data"][0]
    assert box["min"] == pytest.approx(1.0, abs=EXACT)
    assert box["q1"] == pytest.approx(5.75, abs=EXACT)
    assert box["median"] == pytest.approx(10.5, abs=EXACT)
    assert box["q3"] == pytest.approx(15.25, abs=EXACT)
    assert box["max"] == pytest.approx(20.0, abs=EXACT)
    assert box["mean"] == pytest.approx(10.5, abs=EXACT)


def test_descriptive_statistics_ignore_nulls_rather_than_treating_them_as_zero(engine):
    # Twelve values (4..15) plus five blanks. The mean of the present values is
    # 114/12 = 9.5; counting the blanks as zero would give 114/17 = 6.706.
    # A second, fully populated column keeps the blank rows in the file: a lone
    # empty field on its own line is just a blank line, and read_csv drops
    # those before we ever see them.
    values = list(range(4, 16)) + [None] * 5
    csv = to_csv({"x": values, "n": list(range(1, 18))})
    result = analyze(engine, csv)
    assert result.get("success") is True, result.get("error")
    x = {s["columnName"]: s for s in result["summary"]["statistics"]}["x"]
    assert x["nullCount"] == 5
    assert x["mean"] == pytest.approx(9.5, abs=EXACT)


# ==========================================================================
# REGRESSION TESTS
#
# Each of these pins a defect that was found by reading the code rather than
# by a failing test. They are named for the wrong answer they catch.
# ==========================================================================


def test_regression_one_sample_t_does_not_test_the_sample_against_itself(engine):
    """One-sample t with no population mean must NOT return t = 0, p = 1.0.

    The original code fell back to ``col_data.mean()`` when no parameters were
    supplied, comparing the sample against its own mean. That yields t = 0 and
    p = 1.0 by construction, and the engine reported it as "not significantly
    different" for every dataset anyone ever loaded. ``parameters`` defaults to
    None in the function signature, so this was the default path.
    """
    csv = to_csv({"x": [1, 2, 3, 4, 5]})

    for parameters in (None, {}, {"alpha": 0.05}, {"population_mean": None}):
        result = ok(run_test(engine, csv, "one_sample_t", ["x"], parameters))
        assert result["statistic"] != 0.0, (
            "one-sample t returned t = 0 with parameters=" + repr(parameters)
            + ": it is testing the sample against itself again"
        )
        assert result["pValue"] != 1.0, (
            "one-sample t returned p = 1.0 with parameters=" + repr(parameters)
        )
        # With no reference supplied the documented behaviour is mu = 0.
        expected = scipy_stats.ttest_1samp([1, 2, 3, 4, 5], 0.0)
        assert result["statistic"] == pytest.approx(
            float(expected.statistic), abs=EXACT
        )
        assert result["pValue"] == pytest.approx(float(expected.pvalue), abs=EXACT)
        assert result.get("populationMean") == pytest.approx(0.0, abs=EXACT)


def test_regression_paired_t_aligns_on_the_shared_index_not_by_position(engine):
    """Paired t must pair rows, not list positions, when the nulls differ.

    Each column is cleaned of nulls independently, so if one column has a gap
    the two cleaned series no longer line up. Pairing by position shifts every
    subsequent row by one and silently answers a different question.

    Construction: row 2 of ``before`` is blank and the matching ``after`` value
    is a large outlier. Aligned on the index that row drops out entirely and
    the remaining seven pairs differ by a small, consistent amount. Paired by
    position, the outlier is matched against the wrong row and drags the
    statistic somewhere else, which is what this test pins.
    """
    before = [10, None, 20, 30, 40, 50, 60, 70]
    after = [12, 99, 25, 33, 47, 55, 66, 71]

    csv = to_csv({"before": before, "after": after})
    result = ok(run_test(engine, csv, "paired_t", ["before", "after"]))

    aligned = [(b, a) for b, a in zip(before, after) if b is not None]
    assert result["degreesOfFreedom"] == len(aligned) - 1, (
        "paired t used the wrong number of pairs; it is not aligning on the index"
    )

    # What position-based pairing would have produced, so the failure message
    # can say which number came back.
    shifted_b = [b for b in before if b is not None]
    shifted_a = after[: len(shifted_b)]
    wrong = scipy_stats.ttest_rel(shifted_b, shifted_a)
    assert result["statistic"] != pytest.approx(float(wrong.statistic), abs=1e-9), (
        "paired t reproduced the position-pairing statistic "
        + str(float(wrong.statistic))
        + "; the misalignment defect is back"
    )

    expected = scipy_stats.ttest_rel([p[0] for p in aligned], [p[1] for p in aligned])
    assert result["statistic"] == pytest.approx(float(expected.statistic), abs=EXACT)
    assert "7 complete pairs" in result["interpretation"]
    assert "1 incomplete pair" in result["interpretation"], (
        "the dropped row was not disclosed to the user: "
        + repr(result["interpretation"])
    )


def test_regression_fisher_exact_refuses_a_table_larger_than_2x2(engine):
    """Fisher exact must REFUSE a bigger table, never silently truncate it.

    The original code applied ``.iloc[:2, :2]``, which keeps the two
    alphabetically first categories on each axis, throws away every other row
    of the dataset, and reports a p-value as though the whole dataset had been
    analysed. The user cannot tell from the output that it happened.
    """
    rows = []
    for outcome in ("pass", "fail"):
        for site in ("alpha", "bravo", "charlie"):
            rows.extend([(site, outcome)] * 7)
    rows.extend([("charlie", "fail")] * 40)  # make the discarded rows decisive

    csv = to_csv({"site": [a for a, _ in rows], "outcome": [b for _, b in rows]})
    result = run_test(engine, csv, "fisher_exact", ["site", "outcome"])
    error = refused(result)

    assert "2x2" in error.replace("×", "x"), (
        "the refusal does not tell the user the shape requirement: " + error
    )
    assert "charlie" in error, (
        "the refusal does not name the categories that made the table too big: " + error
    )
    assert "statistic" not in result or result["statistic"] is None


def test_regression_fisher_exact_still_accepts_a_genuine_2x2_table(engine):
    """The 2x2 guard must not have broken the case Fisher exact is for."""
    rows = (
        [("a", "yes")] * 8 + [("a", "no")] * 2 + [("b", "yes")] * 1 + [("b", "no")] * 9
    )
    csv = to_csv({"g": [a for a, _ in rows], "o": [b for _, b in rows]})
    result = ok(run_test(engine, csv, "fisher_exact", ["g", "o"]))
    # crosstab sorts labels, giving [[no=2, yes=8], [no=9, yes=1]].
    expected = scipy_stats.fisher_exact([[2, 8], [9, 1]])
    assert result["statistic"] == pytest.approx(float(expected.statistic), abs=EXACT)
    assert result["pValue"] == pytest.approx(float(expected.pvalue), abs=EXACT)


THREE_GROUP_CSV = to_csv(
    {
        "value": [1, 2, 3, 4, 5, 6, 100, 101, 102],
        "grp": ["a", "a", "a", "b", "b", "b", "c", "c", "c"],
    }
)


@pytest.mark.parametrize("test_id", ["independent_t", "mann_whitney"])
def test_regression_two_group_tests_refuse_more_than_two_groups(engine, test_id):
    """A two-group test must REFUSE three groups, not analyse the first two.

    ``df[group_col].dropna().unique()[:2]`` kept whichever two groups happened
    to appear first in the file and reported a p-value about them, labelled as
    a result about the dataset. Group "c" here is an order of magnitude away
    from the others, so the discarded data is the entire story, and the caller
    has no way to know it was dropped.
    """
    result = run_test(engine, THREE_GROUP_CSV, test_id, ["value", "grp"])
    error = refused(result)
    assert "3" in error or "three" in error.lower(), (
        "the refusal does not tell the user how many groups were found: " + error
    )


@pytest.mark.parametrize("test_id", ["independent_t", "mann_whitney"])
def test_regression_two_group_tests_still_accept_exactly_two_groups(engine, test_id):
    """The group-count guard must not have broken the two-group case."""
    csv = to_csv(
        {
            "value": [1, 2, 3, 4, 5, 6],
            "grp": ["a", "a", "a", "b", "b", "b"],
        }
    )
    result = ok(run_test(engine, csv, test_id, ["value", "grp"]))
    assert result["pValue"] is not None


def test_regression_shapiro_wilk_reports_when_it_subsamples(engine):
    """Shapiro-Wilk must SAY SO when it tests a subsample instead of the data.

    Above 5,000 rows the engine silently replaces the column with a random
    5,000-row sample and reports the p-value as though it described the whole
    column. For an auditor, an undisclosed sample is an undisclosed change of
    population.
    """
    rng = np.random.default_rng(11)
    values = list(np.round(rng.normal(0, 1, 6000), 6))
    csv = to_csv({"x": values})
    result = ok(run_test(engine, csv, "shapiro_wilk", ["x"]))

    interpretation = (result.get("interpretation") or "").lower()
    disclosed = (
        result.get("subsampled") is True
        or result.get("sampled") is True
        or any(
            key in result
            for key in ("sampleSize", "subsampleSize", "sampledN", "nUsed", "nTested")
        )
        or "subsample" in interpretation
        or "sub-sample" in interpretation
        or "random sample" in interpretation
        or "5,000" in interpretation
        or "5000" in interpretation
    )
    assert disclosed, (
        "Shapiro-Wilk subsampled 6,000 rows down to 5,000 without telling the "
        "user. Result was: " + repr(result)
    )


def test_regression_shapiro_wilk_subsampling_is_reproducible(engine):
    """The same input must give the same p-value twice.

    ``Series.sample(5000)`` with no ``random_state`` draws a different subset on
    every call, so two identical runs of the same file return two different
    p-values. An audit result that changes when you re-run it cannot be signed
    off, regardless of whether the subsampling is disclosed.
    """
    rng = np.random.default_rng(12)
    csv = to_csv({"x": list(np.round(rng.normal(0, 1, 6000), 6))})
    first = ok(run_test(engine, csv, "shapiro_wilk", ["x"]))
    second = ok(run_test(engine, csv, "shapiro_wilk", ["x"]))
    assert first["statistic"] == pytest.approx(second["statistic"], abs=EXACT), (
        "two identical runs returned different Shapiro-Wilk statistics: "
        + str(first["statistic"]) + " then " + str(second["statistic"])
    )
    assert first["pValue"] == pytest.approx(second["pValue"], abs=EXACT)


def test_regression_shapiro_wilk_below_the_threshold_uses_every_row(engine):
    """Under 5,000 rows nothing may be dropped, disclosed or not."""
    rng = np.random.default_rng(13)
    values = list(np.round(rng.normal(0, 1, 4000), 6))
    expected_w, expected_p = scipy_stats.shapiro(values)
    csv = to_csv({"x": values})
    result = ok(run_test(engine, csv, "shapiro_wilk", ["x"]))
    assert result["statistic"] == pytest.approx(float(expected_w), abs=EXACT)
    assert result["pValue"] == pytest.approx(float(expected_p), abs=EXACT)
