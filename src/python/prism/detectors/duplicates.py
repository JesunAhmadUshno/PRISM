"""
Duplicate rows, gated (docs/vision/02_DETECTORS.md section 4.5 with request D1
from 06_LAUNCH).

The gate is the whole point of this first version. Ungated, ``df.duplicated``
fires 12,735 times on the Berkeley 1973 file, because every column there is a
category and there are only 28 distinct row patterns. That would be a false
FACT on camera, and a false FACT is release-blocking (05_RED_TEAM). So this
detector runs only when the file has a column on which a repeat is evidence
of double counting: an identifier, or an amount. Otherwise it reports
"does not apply" with the reason, and that sentence appears on the
checkability screen.

Near-duplicate matching (normalised strings, block repeats) is specified in
02 section 4.5 and is not implemented here yet; the checkability output says so.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from prism import columns as C
from prism.evidence import Finding, k_of_n, num

DETECTOR = "duplicates"
VERSION = "1.0.0"
REQUIRES_SCIPY = False

# Exact full-row duplicates are reported when they exceed the larger of this
# many rows and this share of the file (02 section 4.5). ASSUMPTION.
FULL_ROW_MIN_COUNT = 5
FULL_ROW_MIN_SHARE = 0.005
MAX_ROW_INDICES = 500


@dataclass
class DuplicatesOutput:
    findings: List[Finding]
    applied: bool
    reason: str
    key_column: Optional[str]


def detect(df: pd.DataFrame, roles: Optional[Dict[str, C.ColumnRole]] = None) -> DuplicatesOutput:
    roles = roles or C.infer_roles(df)
    key = C.has_identifier_or_amount(roles)
    if key is None:
        return DuplicatesOutput(
            findings=[], applied=False, key_column=None,
            reason="every column is a category, a date or text; with no identifier or amount "
                   "column a repeated row is not evidence of double counting",
        )

    findings: List[Finding] = []
    amount_cols = [r.name for r in roles.values() if r.role == C.ROLE_NUMERIC and r.is_amount]
    n = len(df)

    # 1. Repeats on an identifier column: a fact, not a test.
    for r in roles.values():
        if r.role != C.ROLE_IDENTIFIER:
            continue
        col = df[r.name]
        mask = col.notna() & col.duplicated(keep=False)
        count = int(mask.sum())
        if count == 0:
            continue
        rows = np.flatnonzero(mask.to_numpy())
        distinct_keys = int(col[mask].nunique())
        inflation = {}
        for a in amount_cols:
            values = pd.to_numeric(df[a], errors="coerce")
            total = float(values.sum())
            deduped = float(values[~col.duplicated(keep="first")].sum())
            inflation[a] = {"total": total, "deduplicated_total": deduped, "difference": total - deduped}
        slots = {
            "key_column": r.name,
            "duplicate_rows": f"{count:,}",
            "distinct_keys": f"{distinct_keys:,}",
            "share": f"{100.0 * count / n:.1f}%",
        }
        if inflation:
            first = amount_cols[0]
            slots["amount_column"] = first
            slots["total"] = num(inflation[first]["total"], 2)
            slots["deduplicated_total"] = num(inflation[first]["deduplicated_total"], 2)
            slots["difference"] = num(inflation[first]["difference"], 2)
        findings.append(Finding(
            detector=DETECTOR, detector_version=VERSION, severity="high", confidence="rule",
            title_key=f"{DETECTOR}.repeated_identifier", slots=slots,
            columns=[r.name] + amount_cols[:1],
            row_indices=[int(i) for i in rows[:MAX_ROW_INDICES]], row_count=count,
            aggregates={"duplicate_rows": count, "distinct_keys": distinct_keys, "inflation": inflation},
            hypotheses=[f"{DETECTOR}.legitimate_repeat", f"{DETECTOR}.double_entry", f"{DETECTOR}.merge_artifact"],
            follow_ups=[{"query": "show_rows", "params": {"finding_id": ""}}],
            reproduce=f"In Excel: Data, Remove Duplicates on column {r.name}, and compare the row count before and after.",
        ))

    # 2. Exact full-row duplicates, above the floor.
    mask = df.duplicated(keep=False)
    count = int(mask.sum())
    floor = max(FULL_ROW_MIN_COUNT, int(np.ceil(FULL_ROW_MIN_SHARE * n)))
    if count > floor:
        rows = np.flatnonzero(mask.to_numpy())
        findings.append(Finding(
            detector=DETECTOR, detector_version=VERSION, severity="medium", confidence="rule",
            title_key=f"{DETECTOR}.exact_rows", slots={
                "duplicate_rows": f"{count:,}", "rows": k_of_n(count, n),
                "distinct_patterns": f"{int(df[mask].drop_duplicates().shape[0]):,}",
            },
            columns=list(df.columns),
            row_indices=[int(i) for i in rows[:MAX_ROW_INDICES]], row_count=count,
            aggregates={"duplicate_rows": count, "floor": floor, "n_rows": n},
            hypotheses=[f"{DETECTOR}.legitimate_repeat", f"{DETECTOR}.double_entry"],
            follow_ups=[{"query": "show_rows", "params": {"finding_id": ""}}],
            reproduce="In Excel: Data, Remove Duplicates on all columns, and compare the row count before and after.",
        ))

    for f in findings:
        for fu in f.follow_ups:
            if fu["query"] == "show_rows":
                fu["params"]["finding_id"] = f.id

    return DuplicatesOutput(findings=findings, applied=True, key_column=key,
                            reason=f"ran on identifier or amount column {key}")
