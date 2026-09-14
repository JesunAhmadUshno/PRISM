"""
Detector registry and the run that produces the checkability data.

``run_detectors`` is the one entry point the worker will call. It returns a
plain dict that serialises with ``json.dumps(..., allow_nan=False)``:

    {
      "schema_version": 1,
      "row_count": 12763,
      "columns": [ {name, role, n_nonnull, n_levels, is_amount, is_integer}, ... ],
      "checks": [ {detector, version, status, reason, tests_run, findings}, ... ],
      "findings": [ <finding.schema.json objects>, ... ]
    }

``checks`` is the checkability screen (00_PLAN section 3, item 1): what ran,
what did not apply and why. A detector that did not apply is not a failure and
not a clean bill; it is a sentence the user sees before any finding.
"""

from __future__ import annotations

import traceback
from typing import Any, Dict, List

import pandas as pd

from prism import columns as C
from prism.detectors import duplicates, segment_reversal
from prism.evidence import json_safe

SCHEMA_VERSION = 1

STATUS_RAN = "ran"
STATUS_DID_NOT_APPLY = "did_not_apply"
STATUS_ERROR = "error"


def _run_duplicates(df: pd.DataFrame, roles: Dict[str, C.ColumnRole]) -> Dict[str, Any]:
    out = duplicates.detect(df, roles)
    return {
        "detector": duplicates.DETECTOR,
        "version": duplicates.VERSION,
        "status": STATUS_RAN if out.applied else STATUS_DID_NOT_APPLY,
        "reason": out.reason,
        "tests_run": 0,
        "findings": len(out.findings),
        "not_implemented": ["near_duplicates", "block_duplicates"],
        "_findings": out.findings,
    }


def _run_segment_reversal(df: pd.DataFrame, roles: Dict[str, C.ColumnRole]) -> Dict[str, Any]:
    out = segment_reversal.detect(df, roles)
    if out.candidates["comparisons"] == 0 or out.candidates["outcomes"] == 0 or out.candidates["stratifiers"] == 0:
        status = STATUS_DID_NOT_APPLY
        reason = ("needs a two to six level column to compare, an outcome column, and a third column "
                  "to split by; this file does not have all three")
    else:
        status = STATUS_RAN
        reason = (f"tested {out.tests_run:,} comparison, outcome, segment triples "
                  f"from {out.candidates['comparisons']} comparisons, {out.candidates['outcomes']} outcomes "
                  f"and {out.candidates['stratifiers']} segment columns")
    return {
        "detector": segment_reversal.DETECTOR,
        "version": segment_reversal.VERSION,
        "status": status,
        "reason": reason,
        "tests_run": out.tests_run,
        "findings": len(out.findings),
        "candidates": out.candidates,
        "skipped": out.skipped,
        "_findings": out.findings,
    }


# Hygiene first, then structure (02_DETECTORS section 3).
DETECTORS = [
    (duplicates.DETECTOR, duplicates.VERSION, duplicates.REQUIRES_SCIPY, _run_duplicates),
    (segment_reversal.DETECTOR, segment_reversal.VERSION, segment_reversal.REQUIRES_SCIPY, _run_segment_reversal),
]


def run_detectors(df: pd.DataFrame) -> Dict[str, Any]:
    roles = C.infer_roles(df)
    checks: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    for name, version, _requires_scipy, runner in DETECTORS:
        try:
            check = runner(df, roles)
        except Exception as exc:  # a detector must never take the run down with it
            check = {
                "detector": name, "version": version, "status": STATUS_ERROR,
                "reason": f"{type(exc).__name__}: {exc}", "tests_run": 0, "findings": 0,
                "traceback": traceback.format_exc(limit=5), "_findings": [],
            }
        for f in check.pop("_findings"):
            findings.append(f.to_dict())
        checks.append(json_safe(check))
    return {
        "schema_version": SCHEMA_VERSION,
        "row_count": int(len(df)),
        "columns": [r.as_dict() for r in roles.values()],
        "checks": checks,
        "findings": findings,
    }
