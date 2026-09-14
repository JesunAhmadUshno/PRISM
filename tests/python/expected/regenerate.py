"""
Regenerate the golden-run snapshots under tests/python/expected/.

Run from the repository root:

    python tests/python/expected/regenerate.py

Then read the diff. A changed number is either a deliberate detector change
(explain it in the commit) or a regression (do not commit). The known-answer
tests in test_segment_reversal.py are the authority on what the numbers
should be; these snapshots only catch drift in everything those tests do not
pin individually.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))                      # golden.py
sys.path.insert(0, str(HERE.parents[2] / "src" / "python"))  # prism

import golden  # noqa: E402
from prism import run_detectors  # noqa: E402

ABOUT = (
    "Regression pin for the {name} run (docs/vision/06_LAUNCH.md W1 exit criterion). Every number "
    "here was first checked against a published table or hand arithmetic in test_segment_reversal.py; "
    "this file only guards against unintended drift. Regenerate with tests/python/expected/regenerate.py "
    "and explain the change in the commit."
)


def snapshot(spec: golden.GoldenFile) -> dict:
    run = run_detectors(golden.load(spec))
    for f in run["findings"]:
        # Row index lists are long and fully determined by the counts beside them.
        f["evidence"]["row_indices"] = f"<{len(f['evidence']['row_indices'])} indices omitted>"
    return {
        "_about": ABOUT.format(name=spec.name),
        "dataset": {"name": spec.name, "sha256": spec.sha256, "rows": spec.rows},
        "run": run,
    }


def main() -> None:
    for spec, filename in ((golden.BERKELEY, "berkeley.json"), (golden.TITANIC, "titanic.json")):
        out = HERE / filename
        out.write_text(json.dumps(snapshot(spec), indent=2, allow_nan=False) + "\n", encoding="utf-8")
        print(f"wrote {out}")


if __name__ == "__main__":
    main()
