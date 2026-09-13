"""
Extract the PRISM statistics engine from the Web Worker and exec it.

PRISM ships its entire Python analytics engine inside a JavaScript template
literal in ``src/workers/prism.worker.js``, where Pyodide runs it in the
browser. That makes the engine unreachable from vitest and, until this harness
existed, unreachable from any test at all.

This module reads the worker file, carves the embedded Python back out of the
template literal (decoding JavaScript escape sequences exactly as a browser
would, so the text we exec is byte-identical to the text Pyodide runs), and
exec's it into a real Python module namespace with ``scipy_stats`` injected the
way the worker injects it at runtime.

Every failure path raises :class:`EngineExtractionError` with a message that
says which assumption broke and where to fix it. A silent extraction failure
would be worse than no harness, because the suite would start passing
vacuously.
"""

from __future__ import annotations

import json
import types
from pathlib import Path
from typing import Any, Optional, Sequence

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKER_PATH = REPO_ROOT / "src" / "workers" / "prism.worker.js"

# The one structural assumption this harness makes about the worker file.
START_MARKER = "const PRISM_CORE_PYTHON = `"

# Names the extracted source must define. If the engine is refactored so that
# any of these disappears, the harness stops rather than testing a stub.
REQUIRED_DEFINITIONS = (
    "def parse_csv(",
    "def run_statistical_test(",
    "def run_visualization(",
    "def analyze_csv(",
    "class PrismAnalytics",
)

_FIX_HINT = (
    "The embedded-Python extraction in tests/python/extract_engine.py no longer "
    "matches src/workers/prism.worker.js. Update START_MARKER / "
    "REQUIRED_DEFINITIONS in that file to match the new layout. Do NOT skip the "
    "statistics suite to get green: it is the only thing checking the numbers."
)


class EngineExtractionError(RuntimeError):
    """Raised when the embedded Python cannot be recovered with confidence."""


def _fail(reason: str) -> None:
    raise EngineExtractionError(reason + "\n\n" + _FIX_HINT)


# ---------------------------------------------------------------------------
# Template literal decoding
# ---------------------------------------------------------------------------

_SIMPLE_ESCAPES = {
    "n": "\n",
    "t": "\t",
    "r": "\r",
    "b": "\b",
    "f": "\f",
    "v": "\v",
    "0": "\0",
    "`": "`",
    "$": "$",
    "\\": "\\",
    "'": "'",
    '"': '"',
}


def _decode_template_literal(raw: str) -> str:
    """Decode the body of a JS template literal into the string JS would build.

    Implements the JavaScript escape rules that matter here: line
    continuations, the simple escapes, ``\\xHH``, ``\\uHHHH`` and ``\\u{...}``.
    Any other escaped character resolves to the character itself, which is what
    JavaScript does.
    """
    out = []
    i = 0
    n = len(raw)
    while i < n:
        ch = raw[i]
        if ch != "\\":
            out.append(ch)
            i += 1
            continue
        i += 1
        if i >= n:
            _fail("Template literal body ends with a dangling backslash.")
        esc = raw[i]
        if esc == "\n":
            i += 1  # line continuation: the newline is removed
            continue
        if esc == "\r":
            i += 1
            if i < n and raw[i] == "\n":
                i += 1
            continue
        if esc == "x":
            hex_digits = raw[i + 1 : i + 3]
            if len(hex_digits) != 2:
                _fail("Truncated \\xHH escape in the embedded Python.")
            out.append(chr(int(hex_digits, 16)))
            i += 3
            continue
        if esc == "u":
            if raw[i + 1 : i + 2] == "{":
                close = raw.find("}", i + 2)
                if close == -1:
                    _fail("Unterminated \\u{...} escape in the embedded Python.")
                out.append(chr(int(raw[i + 2 : close], 16)))
                i = close + 1
                continue
            hex_digits = raw[i + 1 : i + 5]
            if len(hex_digits) != 4:
                _fail("Truncated \\uHHHH escape in the embedded Python.")
            out.append(chr(int(hex_digits, 16)))
            i += 5
            continue
        out.append(_SIMPLE_ESCAPES.get(esc, esc))
        i += 1
    return "".join(out)


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------


def read_worker_source(worker_path: Optional[Path] = None) -> str:
    path = Path(worker_path) if worker_path else WORKER_PATH
    if not path.is_file():
        _fail("Worker file not found at " + str(path) + ".")
    return path.read_text(encoding="utf-8")


def extract_python_source(js_source: str) -> str:
    """Return the Python source embedded in ``PRISM_CORE_PYTHON``."""
    marker_count = js_source.count(START_MARKER)
    if marker_count == 0:
        _fail("Could not find the marker " + repr(START_MARKER) + " in the worker file.")
    if marker_count > 1:
        _fail(
            "Found " + str(marker_count) + " occurrences of " + repr(START_MARKER)
            + "; expected exactly one, so the correct block is ambiguous."
        )

    body_start = js_source.index(START_MARKER) + len(START_MARKER)

    # Walk forward to the first unescaped backtick, which closes the literal.
    i = body_start
    n = len(js_source)
    end = -1
    while i < n:
        ch = js_source[i]
        if ch == "\\":
            i += 2
            continue
        if ch == "$" and js_source[i + 1 : i + 2] == "{":
            _fail(
                "The embedded Python now contains an unescaped ${...} interpolation "
                "at character offset " + str(i - body_start) + ". This harness cannot "
                "reproduce a value that only exists at runtime in the worker."
            )
        if ch == "`":
            end = i
            break
        i += 1

    if end == -1:
        _fail("Never found the backtick closing the PRISM_CORE_PYTHON literal.")

    source = _decode_template_literal(js_source[body_start:end])

    if len(source.strip()) < 1000:
        _fail(
            "Extracted only " + str(len(source.strip())) + " characters of Python; the "
            "engine is far larger than that, so extraction went wrong."
        )

    missing = [name for name in REQUIRED_DEFINITIONS if name not in source]
    if missing:
        _fail("The extracted Python is missing expected definitions: " + ", ".join(missing))

    try:
        compile(source, "prism.worker.js::PRISM_CORE_PYTHON", "exec")
    except SyntaxError as exc:  # pragma: no cover - defensive
        _fail(
            "The extracted Python does not compile (line " + str(exc.lineno) + ": "
            + str(exc.msg) + "). Extraction is misaligned, or the engine itself is broken."
        )

    return source


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

_ENGINE_CACHE = {}


def load_engine(worker_path: Optional[Path] = None) -> types.ModuleType:
    """Exec the embedded engine into a fresh module namespace and return it.

    ``scipy_stats`` is injected because the worker imports it lazily
    (``from scipy import stats as scipy_stats``) right before calling
    ``run_statistical_test``, so the engine expects it as a global.
    """
    key = str(Path(worker_path) if worker_path else WORKER_PATH)
    cached = _ENGINE_CACHE.get(key)
    if cached is not None:
        return cached

    source = extract_python_source(read_worker_source(worker_path))

    module = types.ModuleType("prism_engine")
    module.__file__ = key
    from scipy import stats as scipy_stats

    module.__dict__["scipy_stats"] = scipy_stats
    exec(compile(source, key + "::PRISM_CORE_PYTHON", "exec"), module.__dict__)

    _ENGINE_CACHE[key] = module
    return module


def reset_engine_cache(engine: types.ModuleType) -> None:
    """Clear the engine's memoised DataFrame so tests cannot leak into each other."""
    engine.__dict__["_cached_csv"] = None
    engine.__dict__["_cached_df"] = None


# ---------------------------------------------------------------------------
# Thin call helpers (the engine speaks JSON strings, tests want dicts)
# ---------------------------------------------------------------------------


def _loads(raw: Any, what: str) -> dict:
    if not isinstance(raw, str):
        raise AssertionError(
            what + " returned " + type(raw).__name__ + ", expected a JSON string"
        )
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AssertionError(
            what + " returned unparseable JSON (" + str(exc) + "): " + repr(raw[:400])
        ) from exc


def run_test(
    engine: types.ModuleType,
    csv: str,
    test_id: str,
    columns: Sequence[str],
    parameters: Optional[dict] = None,
) -> dict:
    """Call the real ``run_statistical_test`` and return its decoded result."""
    reset_engine_cache(engine)
    raw = engine.run_statistical_test(csv, test_id, list(columns), parameters)
    return _loads(raw, "run_statistical_test(" + repr(test_id) + ")")


def analyze(engine: types.ModuleType, csv: str) -> dict:
    reset_engine_cache(engine)
    return _loads(engine.analyze_csv(csv), "analyze_csv")


def visualize(
    engine: types.ModuleType, csv: str, chart_type: str, columns: Sequence[str]
) -> dict:
    reset_engine_cache(engine)
    raw = engine.run_visualization(csv, chart_type, list(columns))
    return _loads(raw, "run_visualization(" + repr(chart_type) + ")")


def to_csv(columns: dict) -> str:
    """Build a CSV string from ``{"name": [values...]}``. ``None`` becomes empty."""
    names = list(columns)
    lengths = set(len(columns[k]) for k in names)
    if len(lengths) != 1:
        raise ValueError(
            "Columns have mismatched lengths: "
            + repr(dict((k, len(v)) for k, v in columns.items()))
        )
    rows = [",".join(names)]
    for i in range(lengths.pop()):
        rows.append(
            ",".join(
                "" if columns[k][i] is None else str(columns[k][i]) for k in names
            )
        )
    return "\n".join(rows)


if __name__ == "__main__":  # pragma: no cover - manual smoke check
    eng = load_engine()
    print("Extracted engine from " + str(WORKER_PATH))
    print(
        "Public callables:",
        sorted(
            k for k, v in eng.__dict__.items() if callable(v) and not k.startswith("_")
        ),
    )
