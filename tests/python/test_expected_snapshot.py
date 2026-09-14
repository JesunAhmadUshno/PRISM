"""
Drift guard: the golden runs must match the committed snapshots.

These are NOT known-answer tests. test_segment_reversal.py is the authority on
what the numbers should be. This file catches everything else moving
unintentionally: a slot renamed, a hypothesis dropped, a threshold nudged, a
formatting change. When a failure here is intended, run
tests/python/expected/regenerate.py and explain the change in the commit.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import pytest

import golden
from prism import run_detectors

EXPECTED = Path(__file__).resolve().parent / "expected"
TOL = 1e-9


def _normalise(run: dict) -> dict:
    for f in run["findings"]:
        f["evidence"]["row_indices"] = f"<{len(f['evidence']['row_indices'])} indices omitted>"
    return run


def _assert_same(actual, expected, path="run"):
    if isinstance(expected, dict):
        assert isinstance(actual, dict), path
        assert sorted(actual) == sorted(expected), f"{path}: keys differ: {sorted(set(actual) ^ set(expected))}"
        for k in expected:
            _assert_same(actual[k], expected[k], f"{path}.{k}")
    elif isinstance(expected, list):
        assert isinstance(actual, list) and len(actual) == len(expected), f"{path}: length {len(actual)} vs {len(expected)}"
        for i, (a, e) in enumerate(zip(actual, expected)):
            _assert_same(a, e, f"{path}[{i}]")
    elif isinstance(expected, float) and not isinstance(expected, bool):
        assert isinstance(actual, (int, float)) and math.isclose(actual, expected, rel_tol=TOL, abs_tol=TOL), \
            f"{path}: {actual} vs {expected}"
    else:
        assert actual == expected, f"{path}: {actual!r} vs {expected!r}"


@pytest.mark.parametrize("spec, filename", [(golden.BERKELEY, "berkeley.json"), (golden.TITANIC, "titanic.json")])
def test_golden_run_matches_snapshot(spec: golden.GoldenFile, filename: str):
    snapshot = json.loads((EXPECTED / filename).read_text(encoding="utf-8"))
    assert snapshot["dataset"]["sha256"] == spec.sha256, "snapshot was taken on a different file"
    actual = _normalise(run_detectors(golden.load(spec)))
    _assert_same(actual, snapshot["run"])
