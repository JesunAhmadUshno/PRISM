"""
The evidence contract: every finding validates against schema/finding.schema.json,
nothing non-numeric reaches the wire, and ids are stable across runs.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import jsonschema
import numpy as np
import pandas as pd
import pytest

import golden
from prism import run_detectors
from prism.evidence import Finding, json_safe, k_of_n, p_value, pct, points

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "schema" / "finding.schema.json"


@pytest.fixture(scope="module")
def validator() -> jsonschema.Draft202012Validator:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(schema)
    return jsonschema.Draft202012Validator(schema)


@pytest.fixture(scope="module")
def runs():
    berkeley = golden.load(golden.BERKELEY)
    titanic = golden.load(golden.TITANIC)
    keyed = pd.DataFrame({"invoice_id": [1, 2, 2, 3], "amount": [1.0, 2.0, 2.0, 3.0], "r": list("abcd")})
    return {
        "berkeley": run_detectors(berkeley),
        "titanic": run_detectors(titanic),
        "keyed": run_detectors(keyed),
    }


def test_every_finding_validates_against_the_schema(validator, runs):
    total = 0
    for name, run in runs.items():
        for f in run["findings"]:
            errors = sorted(validator.iter_errors(f), key=lambda e: list(e.path))
            assert not errors, f"{name}: {[e.message for e in errors]}"
            total += 1
    assert total >= 3, "the fixtures must actually produce findings for this test to mean anything"


def test_run_serialises_without_nan(runs):
    for run in runs.values():
        text = json.dumps(run, allow_nan=False)
        assert "NaN" not in text and "Infinity" not in text


def test_checkability_lists_every_detector_once(runs):
    for run in runs.values():
        names = [c["detector"] for c in run["checks"]]
        assert names == ["duplicates", "segment_reversal"]
        for c in run["checks"]:
            assert c["status"] in ("ran", "did_not_apply")
            assert c["reason"]


def test_finding_ids_are_stable_across_runs():
    df = golden.load(golden.BERKELEY)
    first = [f["id"] for f in run_detectors(df)["findings"]]
    second = [f["id"] for f in run_detectors(df.copy())["findings"]]
    assert first == second and first


def test_json_safe_turns_nan_and_numpy_into_plain_json():
    payload = json_safe({"a": np.float64("nan"), "b": np.int64(3), "c": np.bool_(True), "d": [np.inf, 1.5],
                         "e": np.array([1, 2])})
    assert payload == {"a": None, "b": 3, "c": True, "d": [None, 1.5], "e": [1, 2]}
    json.dumps(payload, allow_nan=False)


def test_confidence_and_severity_are_enums():
    base = dict(detector="x", detector_version="1.0.0", title_key="x.y", slots={}, columns=["c"],
                row_indices=[], row_count=0, aggregates={}, hypotheses=[], follow_ups=[], reproduce="r")
    with pytest.raises(ValueError):
        Finding(severity="critical", confidence="rule", **base)
    with pytest.raises(ValueError):
        Finding(severity="high", confidence="0.8", **base)


def test_formatting_helpers():
    assert pct(0.4451) == "44.5%"
    assert points(0.097) == "+9.7 points"
    assert points(-0.0186) == "-1.9 points"
    assert k_of_n(1198, 2691) == "1,198 of 2,691"
    assert p_value(0.21214) == "0.2121"
    assert p_value(5e-6) == "< 0.0001"
    assert p_value(math.nan) == "n/a"
