"""Make ``extract_engine`` and the ``prism`` package importable from anywhere.

Two roots:

* ``tests/python`` itself, for the legacy worker-extraction harness.
* ``src/python``, the real engine package that the pivot introduces
  (docs/vision/03_ARCHITECTURE.md section 3.4). ``import prism`` from a test
  imports exactly the files the worker writes into Pyodide.
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENGINE_ROOT = HERE.parents[1] / "src" / "python"

for root in (HERE, ENGINE_ROOT):
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))
