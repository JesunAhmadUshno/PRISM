"""
Three silent-wrongness defects in the live engine, and the cases that must keep
working after the fix.

All three were silent in the sense that matters for an examiner: the call
returned success, the row count looked right, and the numbers that came back
were not the numbers in the file.

1. merge_datasets with no links ran pd.concat on whatever was uploaded. concat
   does not raise on mismatched columns, it unions them and fills the gaps with
   NaN, so two unrelated files came back as a block-diagonal frame that
   analyze_csv then reported on as one dataset. The try/except that claimed to
   catch this could never fire.

2. run_preprocessing's log_transform clipped at zero before log1p, so every
   refund, credit and reversal in a ledger silently became 0 while the row
   count stayed the same.

3. run_preprocessing's encode_categorical took pd.factorize's -1 for missing at
   face value, turning every blank cell into an ordinary-looking integer one
   step below the first real category.
"""

from __future__ import annotations

import json
import math

import pytest

from extract_engine import load_engine


@pytest.fixture(scope="session")
def engine():
    """The real engine, pulled out of src/workers/prism.worker.js."""
    return load_engine()


def merge(engine, files, links=()):
    """Call the real merge_datasets. ``files`` is a list of (name, csv)."""
    datasets = [
        {"id": name, "name": name, "content": csv, "columns": []}
        for name, csv in files
    ]
    return json.loads(engine.merge_datasets(datasets, list(links)))


def preprocess(engine, csv, operations, columns=None):
    return json.loads(engine.run_preprocessing(csv, list(operations), columns))


def csv_rows(text):
    """Split a CSV payload into a list of cell lists, newline style aside."""
    return [line.split(",") for line in text.strip().splitlines()]


# --------------------------------------------------------------------------
# 1. Unlinked datasets
# --------------------------------------------------------------------------

INVOICES = "invoice_id,amount\nINV-1,100\nINV-2,250\n"
STAFF = "employee,department\nAlice,Finance\nBob,Ops\n"


def test_unrelated_files_with_no_link_are_refused_not_stacked(engine):
    # Previously: success, rowCount 4, and a frame whose amount column had two
    # NaN rows that were never in either file.
    out = merge(engine, [("invoices.csv", INVOICES), ("staff.csv", STAFF)])

    assert out["success"] is False
    assert "mergedCsv" not in out
    # The message has to name the files and the columns, or the user cannot act.
    assert "invoices.csv" in out["error"] and "staff.csv" in out["error"]
    assert "link" in out["error"].lower()


def test_same_schema_files_still_stack(engine):
    # The legitimate case the branch exists for: Q1 and Q2 of one ledger.
    out = merge(engine, [
        ("q1.csv", "id,amount\n1,100\n2,250\n"),
        ("q2.csv", "id,amount\n3,300\n"),
    ])

    assert out["success"] is True
    assert out["rowCount"] == 3
    assert out["columns"] == ["id", "amount"]
    # No NaN padding: every cell in every row came from a file.
    assert csv_rows(out["mergedCsv"]) == [
        ["id", "amount"], ["1", "100"], ["2", "250"], ["3", "300"],
    ]


def test_column_order_alone_does_not_block_a_stack(engine):
    out = merge(engine, [
        ("q1.csv", "id,amount\n1,100\n"),
        ("q2.csv", "amount,id\n300,3\n"),
    ])

    assert out["success"] is True
    assert out["rowCount"] == 2


def test_an_explicit_link_is_unaffected(engine):
    out = merge(
        engine,
        [("a.csv", "id,amount\n1,100\n"), ("b.csv", "id,region\n1,East\n")],
        [{"leftDatasetId": "a.csv", "rightDatasetId": "b.csv",
          "leftColumn": "id", "rightColumn": "id", "joinType": "inner"}],
    )

    assert out["success"] is True
    assert out["columns"] == ["id", "amount", "region"]


def test_a_single_dataset_is_unaffected(engine):
    out = merge(engine, [("only.csv", INVOICES)])

    assert out["success"] is True
    assert out["rowCount"] == 2


# --------------------------------------------------------------------------
# 2. log_transform on signed amounts
# --------------------------------------------------------------------------

LEDGER = "amount,region\n100,East\n-250,West\n50,East\n-75,\n"


def test_log_transform_refuses_a_column_with_negatives(engine):
    # Previously: success, 4 rows, and -250 and -75 both returned as 0.0.
    out = preprocess(engine, LEDGER, ["log_transform"], ["amount"])

    assert out["success"] is False
    assert "preprocessedCsv" not in out
    assert "amount" in out["error"]
    # The count is the part that tells an examiner how much was at stake.
    assert "2" in out["error"]


def test_log_transform_still_works_on_non_negative_values(engine):
    out = preprocess(engine, "amount\n100\n0\n50\n", ["log_transform"], ["amount"])

    assert out["success"] is True
    values = [float(row[0]) for row in csv_rows(out["preprocessedCsv"])[1:]]
    # log1p, not log: 0 maps to 0 rather than to -inf.
    assert values == pytest.approx([math.log1p(100), 0.0, math.log1p(50)], abs=1e-12)


def test_other_preprocessing_operations_still_run_on_signed_amounts(engine):
    # Only log_transform is undefined for negatives; nothing else should refuse.
    out = preprocess(engine, LEDGER, ["remove_nulls"], ["amount"])

    assert out["success"] is True
    assert out["newRows"] == 4


# --------------------------------------------------------------------------
# 3. encode_categorical and missing values
# --------------------------------------------------------------------------


def test_encode_categorical_leaves_missing_values_missing(engine):
    # Previously: the blank region became -1, which then joined every mean and
    # correlation as though it were a category below "East".
    out = preprocess(engine, LEDGER, ["encode_categorical"], ["region"])

    assert out["success"] is True
    region = [row[1] for row in csv_rows(out["preprocessedCsv"])[1:]]
    assert region[3] == "", "a blank cell must stay blank, not become a number"
    assert "-1" not in region


def test_encode_categorical_still_separates_real_categories(engine):
    out = preprocess(engine, LEDGER, ["encode_categorical"], ["region"])

    codes = [row[1] for row in csv_rows(out["preprocessedCsv"])[1:]]
    east_first, west, east_second = codes[0], codes[1], codes[2]
    # Same category, same code; different categories, different codes.
    assert east_first == east_second
    assert east_first != west
    assert float(east_first) >= 0 and float(west) >= 0


def test_encode_categorical_is_unchanged_when_nothing_is_missing(engine):
    out = preprocess(engine, "region\nEast\nWest\nEast\n", ["encode_categorical"], ["region"])

    assert out["success"] is True
    codes = [float(row[0]) for row in csv_rows(out["preprocessedCsv"])[1:]]
    assert codes == [0.0, 1.0, 0.0]
