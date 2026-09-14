"""
PRISM engine: a local examiner for spreadsheets you did not build.

This package is imported directly by pytest (tests/python) and, in the browser,
written into Pyodide's in-memory filesystem by the worker and imported the same
way. Nothing in here may perform I/O beyond the DataFrame it is handed, and
nothing in here may talk to a network. That is the product's promise and the
CSP enforces it; this docstring is the reminder for the human.

Layout (docs/vision/03_ARCHITECTURE.md, section 3.4):

    prism/columns.py        column role inference shared by every detector
    prism/evidence.py       the Finding record and its JSON shape
    prism/multiplicity.py   Benjamini-Hochberg over a run's p-values
    prism/detectors/        one module per detector, registered in __init__

Every detector is a pure function DataFrame -> DetectorResult. Every number a
finding shows is computed here, formatted here, and tested here.
"""

from prism.detectors import run_detectors  # noqa: F401

__version__ = "0.1.0"
