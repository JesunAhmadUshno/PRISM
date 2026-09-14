"""
The Finding record: structured evidence, never prose.

Shape follows docs/vision/03_ARCHITECTURE.md section 3.5 and is pinned by
schema/finding.schema.json. Two rules from that section are enforced here:

* ``confidence`` is an enum, not a float. A rule fired or it did not; a
  statistical finding carries its p-value and effect size in ``aggregates``
  where they can be read for what they are.
* Numbers appear twice: formatted strings in ``slots`` (what the user sees) and
  raw values in ``evidence.aggregates`` (what charts and tests read). The
  formatting lives here, in one place.
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np

SEVERITIES = ("low", "medium", "high")
CONFIDENCES = ("rule", "statistical", "heuristic")


@dataclass
class Finding:
    detector: str
    detector_version: str
    severity: str
    confidence: str
    title_key: str
    slots: Dict[str, str]
    columns: List[str]
    row_indices: List[int]
    row_count: int
    aggregates: Dict[str, Any]
    hypotheses: List[str]
    follow_ups: List[Dict[str, Any]]
    reproduce: str
    chart_spec: Optional[Dict[str, Any]] = None
    id: str = ""
    extra: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.severity not in SEVERITIES:
            raise ValueError(f"severity must be one of {SEVERITIES}, got {self.severity!r}")
        if self.confidence not in CONFIDENCES:
            raise ValueError(f"confidence must be one of {CONFIDENCES}, got {self.confidence!r}")
        if not self.id:
            self.id = self._stable_id()

    def _stable_id(self) -> str:
        # Deterministic: same detector, same title, same columns, same slots
        # gives the same id on every run of the same file. The UI relies on
        # that to keep a user's answers attached to the right card.
        basis = json.dumps(
            [self.detector, self.title_key, self.columns, self.slots],
            sort_keys=True, default=str,
        )
        return "f_" + hashlib.sha256(basis.encode("utf-8")).hexdigest()[:8]

    def to_dict(self) -> Dict[str, Any]:
        evidence: Dict[str, Any] = {
            "row_indices": [int(i) for i in self.row_indices],
            "row_count": int(self.row_count),
            "columns": list(self.columns),
            "aggregates": json_safe(self.aggregates),
        }
        if self.chart_spec is not None:
            evidence["chart_spec"] = json_safe(self.chart_spec)
        out: Dict[str, Any] = {
            "id": self.id,
            "detector": self.detector,
            "detector_version": self.detector_version,
            "severity": self.severity,
            "confidence": self.confidence,
            "title_key": self.title_key,
            "slots": {k: str(v) for k, v in self.slots.items()},
            "evidence": evidence,
            "hypotheses": list(self.hypotheses),
            "follow_ups": json_safe(self.follow_ups),
            "reproduce": self.reproduce,
        }
        if self.extra:
            out["extra"] = json_safe(self.extra)
        return out


def json_safe(value: Any) -> Any:
    """Convert numpy scalars, NaN and infinities into JSON-serialisable values.

    NaN becomes None so that ``json.dumps(..., allow_nan=False)`` on the wire
    can never smuggle a non-number to the UI.
    """
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(v) for v in value]
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, (np.floating, float)):
        f = float(value)
        return None if (math.isnan(f) or math.isinf(f)) else f
    if isinstance(value, np.ndarray):
        return [json_safe(v) for v in value.tolist()]
    return value


# ---------------------------------------------------------------------------
# Formatting. One place, tested once.
# ---------------------------------------------------------------------------

def pct(x: float, digits: int = 1) -> str:
    return f"{100.0 * x:.{digits}f}%"


def points(x: float, digits: int = 1) -> str:
    """A difference of two rates, in percentage points, signed."""
    v = 100.0 * x
    sign = "+" if v > 0 else ""
    return f"{sign}{v:.{digits}f} points"


def k_of_n(k: int, n: int) -> str:
    return f"{int(k):,} of {int(n):,}"


def num(x: Optional[float], digits: int = 3) -> str:
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        return "n/a"
    return f"{x:,.{digits}f}"


def p_value(p: Optional[float]) -> str:
    if p is None or (isinstance(p, float) and math.isnan(p)):
        return "n/a"
    if p < 1e-4:
        return "< 0.0001"
    return f"{p:.4f}"
