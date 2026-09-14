"""
Golden datasets for the detector suite: real, public, digest-pinned.

The files are not committed. Berkeley is hosted for teaching by the University
of Illinois Data Science Discovery programme and its redistribution terms are
still to be confirmed with the host (docs/vision/06_LAUNCH.md section 8), so
the repository stores the URL and the SHA-256, downloads on first use into
tests/python/fixtures/golden/ (gitignored), and refuses to run on bytes that do
not match. A test that ran on a silently different file would be worse than
no test.

If the download fails the tests FAIL; they do not skip. The statistics suite
learned that lesson already (see extract_engine.py).
"""

from __future__ import annotations

import hashlib
import io
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures" / "golden"


@dataclass(frozen=True)
class GoldenFile:
    name: str
    url: str
    sha256: str
    rows: int
    citation: str


BERKELEY = GoldenFile(
    name="berkeley.csv",
    url="https://waf.cs.illinois.edu/discovery/berkeley.csv",
    sha256="431abcb370efe34dd12b807ae214111b2ffdf673462635503b7772b46f1b6656",
    rows=12_763,
    citation=("UC Berkeley 1973 graduate admissions, per applicant, as hosted by the University of "
              "Illinois Data Science Discovery programme. Underlying paper: Bickel, Hammel and O'Connell, "
              "Science 187(4175), 1975, https://doi.org/10.1126/science.187.4175.398"),
)

TITANIC = GoldenFile(
    name="titanic.csv",
    url="https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv",
    sha256="4a437fde05fe5264e1701a7387ac6fb75393772ba38bb2c9c566405af5af4bd7",
    rows=891,
    citation="Titanic passenger list, Data Science Dojo mirror of the Kaggle training set; public domain.",
)


class GoldenFileError(RuntimeError):
    pass


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(spec: GoldenFile) -> bytes:
    FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
    path = FIXTURE_DIR / spec.name
    if path.exists():
        data = path.read_bytes()
        if _digest(data) == spec.sha256:
            return data
        raise GoldenFileError(
            f"{path} exists but its SHA-256 is {_digest(data)}, expected {spec.sha256}. "
            f"Delete the file to re-download, or update the pin deliberately with the reason in the commit."
        )
    try:
        with urllib.request.urlopen(spec.url, timeout=60) as resp:  # noqa: S310 (pinned URL, digest-verified)
            data = resp.read()
    except Exception as exc:
        raise GoldenFileError(f"could not download {spec.url}: {exc}") from exc
    actual = _digest(data)
    if actual != spec.sha256:
        raise GoldenFileError(
            f"downloaded {spec.url} but its SHA-256 is {actual}, expected {spec.sha256}. "
            f"The host changed the file; re-measure every expected value before updating the pin."
        )
    path.write_bytes(data)
    return data


def load(spec: GoldenFile) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(fetch(spec)))
    if len(df) != spec.rows:
        raise GoldenFileError(f"{spec.name}: expected {spec.rows} rows, parsed {len(df)}")
    return df
