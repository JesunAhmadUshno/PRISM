"""
Column role inference.

Detectors do not look at dtypes; they look at roles. A column of integers 1, 2,
3 is a category (passenger class), a column of 891 distinct integers is an
identifier, a column named Fare is an amount. The rules are deliberately plain
so a reader can predict what the engine will do with their file, and every
threshold is a named constant with the reasoning beside it.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

# A column with this many or fewer distinct integer values is a category, not a
# measurement. Six is the largest number of levels the reversal detector will
# use as a comparison axis (02_DETECTORS 4.1), and a "numeric" column with six
# values is a code list in every spreadsheet we have seen. ASSUMPTION.
LOW_CARDINALITY_MAX = 6

# Above this many distinct values a string column is text (names, tickets,
# free comments), not a category. Twenty is the reversal detector's cap on
# strata (02_DETECTORS 4.1); columns between 21 and 50 levels stay categorical
# so other detectors can still group by them, but no detector treats a column
# with more than 50 levels as a grouping axis. ASSUMPTION.
CATEGORICAL_MAX_LEVELS = 50

# Name vocabularies. These decide wording and applicability, never numbers.
AMOUNT_PATTERN = re.compile(
    r"(amount|amt|total|revenue|sales|price|cost|fare|salary|wage|value|balance|"
    r"fee|payment|paid|spend|budget|income|expense|charge|\$|usd|eur|gbp|cad)",
    re.IGNORECASE,
)
# "invoice" is deliberately absent above: an invoice column is a number that
# identifies, and "invoice amount" still matches through "amount".
IDENTIFIER_PATTERN = re.compile(
    r"(^id$|_id$|^id_|\bid\b|identifier|number$|_no$|^no$|code$|key$|ticket|invoice|ref)",
    re.IGNORECASE,
)
# Used only to choose which of two binary columns is read as the outcome when a
# reversal is symmetric in them (the odds ratio is the same either way). The
# numbers do not depend on this; the wording does. ASSUMPTION.
OUTCOME_PATTERN = re.compile(
    r"(admi|surviv|outcome|result|convert|churn|success|status|won|pass|fail|"
    r"default|approved|accept|retain|respon|click|purchase|hired|promot|died|death)",
    re.IGNORECASE,
)

ROLE_CONSTANT = "constant"
ROLE_IDENTIFIER = "identifier"
ROLE_BINARY = "binary"
ROLE_CATEGORICAL = "categorical"
ROLE_NUMERIC = "numeric"
ROLE_DATETIME = "datetime"
ROLE_TEXT = "text"
ROLE_EMPTY = "empty"


@dataclass
class ColumnRole:
    name: str
    role: str
    n_nonnull: int
    n_levels: int
    is_amount: bool = False
    is_integer: bool = False
    # For categorical and binary: level labels ordered by frequency, most
    # frequent first. Detectors use "second most frequent is the event".
    levels: List[str] = field(default_factory=list)

    def as_dict(self) -> Dict[str, object]:
        return {
            "name": self.name,
            "role": self.role,
            "n_nonnull": int(self.n_nonnull),
            "n_levels": int(self.n_levels),
            "is_amount": bool(self.is_amount),
            "is_integer": bool(self.is_integer),
        }


def _looks_like_dates(series: pd.Series) -> bool:
    sample = series.dropna().astype(str).head(200)
    if sample.empty:
        return False
    # Cheap pre-filter so we do not try to parse every text column as a date
    # (which is slow and noisy). A date string has digits and a separator.
    plausible = sample.str.contains(r"\d", regex=True) & sample.str.contains(
        r"[-/:. ]", regex=True
    )
    if plausible.mean() < 0.95:
        return False
    parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
    return bool(parsed.notna().mean() >= 0.95)


def infer_roles(df: pd.DataFrame) -> Dict[str, ColumnRole]:
    """Assign one role to every column. Order of the dict matches the file."""
    roles: Dict[str, ColumnRole] = {}
    n_rows = len(df)
    for name in df.columns:
        s = df[name]
        nonnull = s.dropna()
        n_nonnull = int(len(nonnull))
        if n_nonnull == 0:
            roles[name] = ColumnRole(name, ROLE_EMPTY, 0, 0)
            continue
        n_levels = int(nonnull.nunique())
        if n_levels == 1:
            roles[name] = ColumnRole(name, ROLE_CONSTANT, n_nonnull, 1, levels=[str(nonnull.iloc[0])])
            continue

        is_amount = bool(AMOUNT_PATTERN.search(str(name)))
        name_says_id = bool(IDENTIFIER_PATTERN.search(str(name)))

        if pd.api.types.is_datetime64_any_dtype(s):
            roles[name] = ColumnRole(name, ROLE_DATETIME, n_nonnull, n_levels)
            continue

        if pd.api.types.is_bool_dtype(s):
            counts = nonnull.value_counts()
            roles[name] = ColumnRole(name, ROLE_BINARY, n_nonnull, 2, levels=[str(v) for v in counts.index])
            continue

        if pd.api.types.is_numeric_dtype(s):
            values = nonnull.to_numpy(dtype=float)
            is_integer = bool(np.all(np.isfinite(values)) and np.all(np.equal(np.mod(values, 1), 0)))
            unique_share = n_levels / n_nonnull
            # An identifier column is allowed to contain repeats: finding them
            # is the duplicate detector's job. So a column whose NAME says it
            # is an id qualifies as long as it is mostly distinct; a column
            # with no such name must be almost entirely distinct and long
            # enough that "almost entirely distinct" means something.
            if is_integer and (
                (name_says_id and unique_share >= 0.5)
                or (not is_amount and unique_share >= 0.98 and n_levels >= max(20, n_rows // 2))
            ):
                roles[name] = ColumnRole(name, ROLE_IDENTIFIER, n_nonnull, n_levels, is_integer=True)
                continue
            if is_integer and n_levels <= LOW_CARDINALITY_MAX and not is_amount:
                counts = nonnull.value_counts()
                role = ROLE_BINARY if n_levels == 2 else ROLE_CATEGORICAL
                roles[name] = ColumnRole(
                    name, role, n_nonnull, n_levels, is_integer=True,
                    levels=[_label(v) for v in counts.index],
                )
                continue
            roles[name] = ColumnRole(
                name, ROLE_NUMERIC, n_nonnull, n_levels, is_amount=is_amount, is_integer=is_integer
            )
            continue

        # Object / string columns.
        if _looks_like_dates(nonnull):
            roles[name] = ColumnRole(name, ROLE_DATETIME, n_nonnull, n_levels)
            continue
        counts = nonnull.astype(str).value_counts()
        if n_levels == 2:
            roles[name] = ColumnRole(name, ROLE_BINARY, n_nonnull, 2, levels=[str(v) for v in counts.index])
        elif n_levels <= CATEGORICAL_MAX_LEVELS:
            roles[name] = ColumnRole(
                name, ROLE_CATEGORICAL, n_nonnull, n_levels, levels=[str(v) for v in counts.index]
            )
        elif n_levels / n_nonnull >= 0.98 and (name_says_id or n_nonnull >= 20):
            roles[name] = ColumnRole(name, ROLE_IDENTIFIER, n_nonnull, n_levels)
        else:
            roles[name] = ColumnRole(name, ROLE_TEXT, n_nonnull, n_levels)
    return roles


def _label(value: object) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def is_outcome_name(name: str) -> bool:
    return bool(OUTCOME_PATTERN.search(str(name)))


def has_identifier_or_amount(roles: Dict[str, ColumnRole]) -> Optional[str]:
    """Return the first column that makes a duplicate check meaningful, or None."""
    for r in roles.values():
        if r.role == ROLE_IDENTIFIER:
            return r.name
    for r in roles.values():
        if r.role == ROLE_NUMERIC and r.is_amount:
            return r.name
    return None
