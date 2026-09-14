"""
Benjamini-Hochberg false discovery rate control.

Every automatic search in this engine tries many hypotheses. Reporting the
raw p-value of the one that happened to be smallest is how honest software
produces dishonest findings. Each detector collects the p-values of everything
it actually tested and passes them through here; the adjusted values, and the
count of tests, travel with the finding.

Reference: Benjamini and Hochberg (1995), Journal of the Royal Statistical
Society B 57(1), 289 to 300. The step-up procedure below is the standard one
and matches ``scipy.stats.false_discovery_control(method="bh")``.
"""

from __future__ import annotations

from typing import Sequence

import numpy as np


def benjamini_hochberg(p_values: Sequence[float]) -> np.ndarray:
    """Return BH-adjusted p-values (q-values), same order as the input.

    NaN inputs are left as NaN and do not count toward the number of tests.
    """
    p = np.asarray(p_values, dtype=float)
    out = np.full_like(p, np.nan)
    mask = ~np.isnan(p)
    m = int(mask.sum())
    if m == 0:
        return out
    pv = p[mask]
    order = np.argsort(pv, kind="stable")
    ranked = pv[order] * m / np.arange(1, m + 1)
    # Step-up: enforce monotonicity from the largest rank downward.
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    adjusted = np.empty_like(pv)
    adjusted[order] = np.minimum(ranked, 1.0)
    out[mask] = adjusted
    return out
