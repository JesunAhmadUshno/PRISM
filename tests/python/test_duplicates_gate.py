"""
The duplicate pre-pass gate (06_LAUNCH request D1, risk L1).

The Berkeley file has 12,735 exact duplicate rows out of 12,763 because every
column is a category and there are only 28 distinct row patterns. An ungated
duplicate check makes "12,735 duplicates" the first finding on camera, and a
false FACT is release-blocking. The gate must hold, and it must open again the
moment an identifier or amount column exists.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

import golden
from prism import columns as C
from prism.detectors import duplicates


def test_berkeley_really_is_almost_all_duplicate_rows():
    df = golden.load(golden.BERKELEY)
    # 12,735 rows repeat an earlier row (keep="first"); only 28 patterns exist.
    assert int(df.duplicated().sum()) == 12_735
    assert len(df.drop_duplicates()) == 28
    # Every single row belongs to a duplicate group.
    assert int(df.duplicated(keep=False).sum()) == len(df)


def test_gate_holds_on_berkeley():
    df = golden.load(golden.BERKELEY)
    out = duplicates.detect(df)
    assert out.applied is False
    assert out.findings == []
    assert "identifier or amount" in out.reason


def test_gate_opens_on_an_identifier_and_reports_a_repeat_as_a_rule():
    df = pd.DataFrame({
        "invoice_id": [1001, 1002, 1003, 1003, 1004, 1005],
        "amount": [100.0, 250.0, 75.0, 75.0, 40.0, 10.0],
        "region": list("NNSSEW"),
    })
    roles = C.infer_roles(df)
    assert roles["invoice_id"].role == C.ROLE_IDENTIFIER or roles["amount"].is_amount
    out = duplicates.detect(df, roles)
    assert out.applied is True
    keyed = [f for f in out.findings if f.title_key == "duplicates.repeated_identifier"]
    assert len(keyed) == 1
    f = keyed[0]
    assert f.confidence == "rule" and f.severity == "high"
    assert f.row_count == 2 and f.row_indices == [2, 3]
    assert f.slots["distinct_keys"] == "1"
    # Total 550, de-duplicated 475: the inflation is the repeated 75.
    assert f.slots["total"] == "550.00"
    assert f.slots["deduplicated_total"] == "475.00"
    assert f.slots["difference"] == "75.00"


def test_gate_opens_on_an_amount_column_without_any_identifier():
    rng = np.random.default_rng(0)
    df = pd.DataFrame({"revenue": rng.random(400), "segment": rng.choice(list("ABC"), 400)})
    df = pd.concat([df, df.iloc[:10]], ignore_index=True)  # ten exact repeats
    out = duplicates.detect(df)
    assert out.applied is True
    exact = [f for f in out.findings if f.title_key == "duplicates.exact_rows"]
    assert len(exact) == 1
    assert exact[0].row_count == 20  # both copies of each repeated row


def test_small_repeat_counts_stay_below_the_floor():
    rng = np.random.default_rng(1)
    df = pd.DataFrame({"revenue": rng.random(400), "segment": rng.choice(list("ABC"), 400)})
    df = pd.concat([df, df.iloc[:2]], ignore_index=True)  # two repeats: 4 rows flagged, floor is 5
    out = duplicates.detect(df)
    assert out.applied is True
    assert out.findings == []
