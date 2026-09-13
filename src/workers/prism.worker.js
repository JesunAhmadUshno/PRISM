/**
 * PRISM Web Worker - Pyodide Analytics Engine
 * 
 * Isolated execution environment for Python-based data analysis.
 * Runs in a dedicated thread to prevent UI blocking.
 * 
 * NOTE: This is a CLASSIC worker (not module) to support importScripts
 * 
 * @security CRITICAL - All data processing happens here
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PYODIDE_VERSION = '0.25.1';

// Base URL of the Pyodide distribution. Repoint this at a same-origin path
// (e.g. '/PRISM/pyodide/') once the distribution is vendored into the build:
// the digests below do not change, because the files jsDelivr serves are
// byte-for-byte identical to the ones in the `pyodide` npm package.
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Pinned SHA-384 digests for every Pyodide artifact this worker executes or
// trusts. Without them, `importScripts()` would run whatever the CDN happened
// to return - importScripts cannot carry a subresource-integrity attribute -
// inside a worker that already holds the user's spreadsheet in memory.
//
// Verified against both cdn.jsdelivr.net and the pyodide@0.25.1 npm tarball.
// The package wheels (pandas/numpy/scipy) are deliberately absent: Pyodide
// fetches each one with `fetch(url, { integrity: 'sha256-...' })` taken from
// pyodide-lock.json, so pinning the lock file transitively pins every wheel.
const PYODIDE_INTEGRITY = {
  'pyodide.js': 'sha384-seajjUQIcvEwMC5MMXEiumXqlQqO0Bx2snuTKoW5x3LQ5o2nPJDK7cQsB4M0a7fw',
  'pyodide.asm.js': 'sha384-Lj8+PDRpggK+1+MOR0nQQl7nNK8R2+6Yt8N0O+7Qm6VCt/lee9WTQ9/O4c9paGDh',
  'pyodide.asm.wasm': 'sha384-jazqcjXUeIYMNgPrqcZmv0cjFnPj/e0eC+x9e0NleEYkCOxveIMMtXU3uD7uRlMM',
  'python_stdlib.zip': 'sha384-wYtooCsLebeus5pNVdWFoXc6/A5PscOZFE2zDOnACDvdI9O77C080Eqnat8WO/x0',
  'pyodide-lock.json': 'sha384-kOoqicMyQ/49EzrjGMHO3+jCUhN+tOrhfgLDZvjyjba5f3dIgpogE7TRbL1yeE20'
};

// The Python analytics script (embedded for security - no external fetch)
const PRISM_CORE_PYTHON = `
"""
PRISM Core Analytics Engine (Embedded)
"""

import json
import io
import math
from typing import Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

import pandas as pd
import numpy as np


class DataType(Enum):
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"
    DATETIME = "datetime"
    TEXT = "text"
    BOOLEAN = "boolean"


class ChartType(Enum):
    LINE = "line"
    BAR = "bar"
    SCATTER = "scatter"
    PIE = "pie"
    AREA = "area"
    HISTOGRAM = "histogram"


# NaN and Infinity are valid Python floats but are NOT valid JSON. json.dumps
# never consults default= for them - it emits the bare tokens NaN/Infinity,
# which JSON.parse() on the JavaScript side rejects. Every payload that
# crosses the bridge is scrubbed through these helpers first.
def _finite_or_none(value):
    """Return value as a float, or None when it is NaN/Infinity/unparseable."""
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    return num if math.isfinite(num) else None


def _json_safe(obj):
    """Recursively map numpy scalars and non-finite floats to JSON-safe values."""
    if obj is None:
        return None
    if isinstance(obj, (np.bool_, np.integer, np.floating)):
        obj = obj.item()
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    if isinstance(obj, (str, bool, int)):
        return obj
    if isinstance(obj, np.ndarray):
        return [_json_safe(v) for v in obj.tolist()]
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_json_safe(v) for v in obj]
    try:
        if pd.isna(obj):
            return None
    except (TypeError, ValueError):
        pass
    return obj


# Most recently parsed CSV, kept so repeated workspace actions on the same
# dataset reuse the DataFrame instead of re-parsing the whole file every time.
_cached_csv = None
_cached_df = None


def parse_csv(csv_string):
    """
    Parse a CSV string into a DataFrame, reusing the last parse when the
    content is unchanged. Pass None to reuse the cached DataFrame outright.

    Raises ValueError if there is nothing to parse and nothing cached.
    """
    global _cached_csv, _cached_df

    if csv_string is None:
        if _cached_df is None:
            raise ValueError("No data loaded")
        return _cached_df

    # Clean the input
    csv_string = csv_string.strip()
    if not csv_string:
        raise ValueError("No data could be parsed from file")

    if _cached_df is not None and csv_string == _cached_csv:
        return _cached_df

    # Try the default (C) parser first - it is an order of magnitude faster
    try:
        df = pd.read_csv(
            io.StringIO(csv_string),
            on_bad_lines='skip',
            encoding_errors='replace'
        )
    except Exception:
        # Fallback: sniff the separator (only the python engine can do this)
        df = pd.read_csv(
            io.StringIO(csv_string),
            sep=None,
            engine='python',
            on_bad_lines='skip'
        )

    _cached_csv = csv_string
    _cached_df = df
    return df


class PrismAnalytics:
    def __init__(self):
        self.df = None
        self.column_types = {}

    def load_csv(self, csv_string, file_type='csv'):
        """Load data - Excel files are pre-converted to CSV in JavaScript"""
        try:
            self.df = parse_csv(csv_string)

            if self.df is None or len(self.df) == 0:
                return {"success": False, "error": "No data could be parsed from file"}
            
            self._detect_column_types()
            return {"success": True, "rows": len(self.df), "columns": len(self.df.columns)}
        except Exception as e:
            return {"success": False, "error": f"CSV parsing error: {str(e)}"}
    
    def _detect_column_types(self):
        if self.df is None:
            return
        for col in self.df.columns:
            self.column_types[col] = self._infer_column_type(col)
    
    def _infer_column_type(self, column):
        if self.df is None:
            return DataType.TEXT
        series = self.df[column]
        dtype = series.dtype
        
        # Handle empty columns
        if series.isna().all():
            return DataType.TEXT
        
        if dtype == 'bool' or dtype == 'boolean':
            return DataType.BOOLEAN
        if pd.api.types.is_datetime64_any_dtype(dtype):
            return DataType.DATETIME
        if dtype == 'object':
            try:
                non_null = series.dropna()
                if len(non_null) > 0:
                    pd.to_datetime(non_null.head(100))
                    return DataType.DATETIME
            except:
                pass
        if pd.api.types.is_numeric_dtype(dtype):
            unique_count = series.nunique()
            if unique_count <= 10 and unique_count > 0:
                return DataType.CATEGORICAL
            return DataType.NUMERIC
        if dtype == 'object' or dtype == 'category':
            unique_count = series.nunique()
            if unique_count <= 20:
                return DataType.CATEGORICAL
            non_null = series.dropna()
            if len(non_null) > 0:
                avg_len = non_null.astype(str).str.len().mean()
                if avg_len > 50:
                    return DataType.TEXT
            return DataType.CATEGORICAL
        return DataType.TEXT
    
    def get_column_info(self):
        if self.df is None:
            return []
        columns = []
        for col in self.df.columns:
            series = self.df[col]
            columns.append({
                "name": col,
                "dataType": self.column_types[col].value,
                "nullCount": int(series.isna().sum()),
                "uniqueCount": int(series.nunique()),
                "sampleValues": [str(v) for v in series.dropna().head(5).tolist()]
            })
        return columns
    
    def compute_statistics(self):
        if self.df is None:
            return []
        stats = []
        for col in self.df.columns:
            series = self.df[col]
            col_type = self.column_types[col]
            base = {
                "columnName": col,
                "dataType": col_type.value,
                "count": int(len(series)),
                "nullCount": int(series.isna().sum()),
                "uniqueCount": int(series.nunique())
            }
            if col_type == DataType.NUMERIC:
                ns = pd.to_numeric(series, errors='coerce')
                base.update({
                    "mean": _finite_or_none(ns.mean()),
                    "median": _finite_or_none(ns.median()),
                    "stdDev": _finite_or_none(ns.std()),
                    "min": _finite_or_none(ns.min()),
                    "max": _finite_or_none(ns.max()),
                    "q1": _finite_or_none(ns.quantile(0.25)),
                    "q3": _finite_or_none(ns.quantile(0.75))
                })
            elif col_type == DataType.CATEGORICAL:
                vc = series.value_counts().head(10)
                base.update({
                    "mode": str(series.mode().iloc[0]) if len(series.mode()) > 0 else None,
                    "topValues": [{"value": str(k), "count": int(v)} for k, v in vc.items()]
                })
            stats.append(base)
        return stats
    
    def recommend_visualizations(self):
        if self.df is None:
            return []
        recommendations = []
        numeric_cols = [c for c, t in self.column_types.items() if t == DataType.NUMERIC]
        categorical_cols = [c for c, t in self.column_types.items() if t == DataType.CATEGORICAL]
        datetime_cols = [c for c, t in self.column_types.items() if t == DataType.DATETIME]
        
        if datetime_cols and numeric_cols:
            recommendations.append({
                "chartType": "line", "confidence": 0.9,
                "reason": "Time-based data detected. Line chart shows trends over time.",
                "xAxis": datetime_cols[0], "yAxis": numeric_cols[0], "metrics": numeric_cols[:3]
            })
        if categorical_cols and numeric_cols:
            recommendations.append({
                "chartType": "bar", "confidence": 0.85,
                "reason": "Categorical and numeric data detected. Bar chart enables comparison.",
                "xAxis": categorical_cols[0], "yAxis": numeric_cols[0],
                "groupBy": categorical_cols[1] if len(categorical_cols) > 1 else None
            })
        if numeric_cols:
            recommendations.append({
                "chartType": "histogram", "confidence": 0.8,
                "reason": "Numeric data detected. Histogram shows distribution.",
                "xAxis": numeric_cols[0]
            })
        if len(numeric_cols) >= 2:
            recommendations.append({
                "chartType": "scatter", "confidence": 0.75,
                "reason": "Multiple numeric columns. Scatter plot reveals correlations.",
                "xAxis": numeric_cols[0], "yAxis": numeric_cols[1],
                "groupBy": categorical_cols[0] if categorical_cols else None
            })
        return sorted(recommendations, key=lambda x: x['confidence'], reverse=True)
    
    def generate_insights(self):
        if self.df is None:
            return []
        insights = []
        total_cells = self.df.size
        null_cells = self.df.isna().sum().sum()
        null_pct = (null_cells / total_cells) * 100 if total_cells > 0 else 0
        
        insights.append({
            "id": str(uuid.uuid4())[:8],
            "type": "summary",
            "severity": "info" if null_pct < 5 else "warning" if null_pct < 20 else "critical",
            "title": "Data Quality Overview",
            "description": f"Dataset: {len(self.df):,} rows, {len(self.df.columns)} columns. Missing: {null_pct:.1f}%",
            "affectedColumns": list(self.df.columns[self.df.isna().any()]),
            "confidence": 1.0,
            "accessibleDescription": f"Data has {len(self.df)} rows, {len(self.df.columns)} columns, {null_pct:.1f} percent missing."
        })
        
        numeric_cols = [c for c, t in self.column_types.items() if t == DataType.NUMERIC]
        for col in numeric_cols[:2]:
            series = pd.to_numeric(self.df[col], errors='coerce').dropna()
            if len(series) < 10:
                continue
            x = np.arange(len(series))
            slope = np.polyfit(x, series.values, 1)[0]
            range_val = series.max() - series.min()
            if range_val > 0:
                norm_slope = (slope * len(series)) / range_val
                if abs(norm_slope) > 0.1:
                    direction = "upward" if slope > 0 else "downward"
                    pct = abs(norm_slope) * 100
                    insights.append({
                        "id": str(uuid.uuid4())[:8],
                        "type": "trend",
                        "severity": "info",
                        "title": f"Trend in {col}",
                        "description": f"Values show {direction} trend, ~{pct:.1f}% change.",
                        "affectedColumns": [col],
                        "confidence": 0.8,
                        "accessibleDescription": f"{col} shows {direction} trend, approximately {pct:.1f} percent change."
                    })
        return insights
    
    def get_chart_data(self, chart_type, x_col, y_col=None, limit=100):
        # Rows only, for callers that do not need the counts.
        return self.get_chart_data_with_meta(chart_type, x_col, y_col, limit)["data"]

    def get_chart_data_with_meta(self, chart_type, x_col, y_col=None, limit=100):
        # head(limit) keeps the FIRST n rows or categories, it is not a sample.
        # Every payload therefore carries what was actually plotted, what exists
        # and an explicit truncated flag, so a chart of the first 15 of 400
        # categories cannot be read as a chart of the data.
        def payload(rows, plotted, total, unit="rows", note=None):
            plotted = int(plotted)
            total = int(total)
            return {
                "data": rows,
                "plottedRowCount": plotted,
                "totalRowCount": total,
                "countUnit": unit,
                "truncated": bool(plotted < total),
                "truncationNote": (
                    (note or f"Showing the first {plotted:,} of {total:,} {unit}, not a random sample.")
                    if plotted < total else ""
                )
            }

        if self.df is None or x_col not in self.df.columns:
            return payload([], 0, 0)
        try:
            if chart_type == "histogram":
                series = pd.to_numeric(self.df[x_col], errors='coerce').dropna()
                hist, bins = np.histogram(series, bins=20)
                rows = [{"bin": f"{bins[i]:.2f}-{bins[i+1]:.2f}", "count": int(hist[i])} for i in range(len(hist))]
                binned = payload(rows, len(series), len(self.df))
                if binned["truncated"]:
                    binned["truncationNote"] = f"All {len(series):,} usable values are binned; {len(self.df) - len(series):,} missing or non-numeric row(s) excluded."
                return binned
            elif chart_type in ["bar", "pie"]:
                if y_col and y_col in self.df.columns:
                    grouped = self.df.groupby(x_col)[y_col].mean().reset_index()
                else:
                    grouped = self.df[x_col].value_counts().reset_index()
                    grouped.columns = [x_col, 'count']
                shown = grouped.head(limit)
                # value_counts is frequency-ordered and groupby is key-ordered, so
                # head() means something different in each case. Say which.
                note = None
                if not (y_col and y_col in self.df.columns) and len(shown) < len(grouped):
                    note = f"Showing the {len(shown):,} most frequent of {len(grouped):,} categories."
                return payload(_json_safe(shown.to_dict('records')), len(shown), len(grouped), "categories", note)
            else:
                cols = [x_col] + ([y_col] if y_col and y_col in self.df.columns else [])
                shown = self.df[cols].head(limit)
                return payload(_json_safe(shown.to_dict('records')), len(shown), len(self.df))
        except:
            return payload([], 0, 0)
    
    def analyze(self, data, file_type='csv'):
        import time
        start = time.time()
        
        # Validate input
        if not data or (isinstance(data, str) and len(data.strip()) == 0):
            return json.dumps({"success": False, "error": "Empty file provided"})
        
        result = self.load_csv(data, file_type)
        if not result.get("success"):
            return json.dumps({"success": False, "error": result.get("error", "Failed to parse file")})
        
        try:
            columns = self.get_column_info()
            statistics = self.compute_statistics()
            recommendations = self.recommend_visualizations()
            insights = self.generate_insights()
            
            chart_data = []
            for rec in recommendations[:3]:
                try:
                    chart = self.get_chart_data_with_meta(rec['chartType'], rec.get('xAxis', ''), rec.get('yAxis'))
                    data = chart["data"]
                    if data:
                        chart_data.append({
                            "type": rec['chartType'],
                            "title": f"{rec['chartType'].title()} Chart",
                            "xAxisLabel": rec.get('xAxis', ''),
                            "yAxisLabel": rec.get('yAxis', 'Count'),
                            "data": data,
                            "plottedRowCount": chart["plottedRowCount"],
                            "totalRowCount": chart["totalRowCount"],
                            "truncated": chart["truncated"],
                            "truncationNote": chart["truncationNote"]
                        })
                except Exception:
                    continue
            
            return json.dumps(_json_safe({
                "success": True,
                "summary": {
                    "rowCount": len(self.df) if self.df is not None else 0,
                    "columnCount": len(self.df.columns) if self.df is not None else 0,
                    "columns": columns,
                    "statistics": statistics,
                    "processingTimeMs": round((time.time() - start) * 1000, 2)
                },
                "recommendations": recommendations,
                "insights": insights,
                "chartData": chart_data
            }), default=str, allow_nan=False)
        except Exception as e:
            return json.dumps({"success": False, "error": f"Analysis error: {str(e)}"})


def analyze_csv(data, file_type='csv'):
    return PrismAnalytics().analyze(data, file_type)


def merge_datasets(datasets, links):
    """
    Merge multiple datasets based on defined links.
    
    Args:
        datasets: List of dicts with 'id', 'name', 'content', 'columns'
        links: List of dicts with 'leftDatasetId', 'rightDatasetId', 'leftColumn', 'rightColumn', 'joinType'
    
    Returns:
        JSON string with merged result or error
    """
    try:
        # Load all datasets into DataFrames
        dfs = {}
        for ds in datasets:
            df = parse_csv(ds['content'])
            dfs[ds['id']] = {'df': df, 'name': ds['name']}
        
        if len(dfs) == 0:
            return json.dumps({"success": False, "error": "No datasets to merge"})
        
        if len(dfs) == 1:
            # Single dataset, just return it
            df_id = list(dfs.keys())[0]
            merged_df = dfs[df_id]['df']
        elif len(links) == 0:
            # Multiple datasets but no links - concatenate vertically if same columns
            all_dfs = [dfs[k]['df'] for k in dfs]
            try:
                merged_df = pd.concat(all_dfs, ignore_index=True)
            except Exception:
                # Different schemas - just use first dataset
                merged_df = all_dfs[0]
        else:
            # Apply links sequentially
            first_link = links[0]
            left_df = dfs[first_link['leftDatasetId']]['df']
            right_df = dfs[first_link['rightDatasetId']]['df']
            
            how_map = {'inner': 'inner', 'left': 'left', 'right': 'right', 'outer': 'outer'}
            how = how_map.get(first_link['joinType'], 'inner')
            
            merged_df = pd.merge(
                left_df, 
                right_df, 
                left_on=first_link['leftColumn'], 
                right_on=first_link['rightColumn'], 
                how=how,
                suffixes=('', '_right')
            )
            
            # Process remaining links
            processed_ids = {first_link['leftDatasetId'], first_link['rightDatasetId']}
            
            for link in links[1:]:
                if link['leftDatasetId'] in processed_ids and link['rightDatasetId'] not in processed_ids:
                    right_df = dfs[link['rightDatasetId']]['df']
                    how = how_map.get(link['joinType'], 'inner')
                    merged_df = pd.merge(
                        merged_df, right_df,
                        left_on=link['leftColumn'], right_on=link['rightColumn'],
                        how=how, suffixes=('', '_right')
                    )
                    processed_ids.add(link['rightDatasetId'])
                elif link['rightDatasetId'] in processed_ids and link['leftDatasetId'] not in processed_ids:
                    left_df = dfs[link['leftDatasetId']]['df']
                    how = how_map.get(link['joinType'], 'inner')
                    merged_df = pd.merge(
                        left_df, merged_df,
                        left_on=link['leftColumn'], right_on=link['rightColumn'],
                        how=how, suffixes=('_left', '')
                    )
                    processed_ids.add(link['leftDatasetId'])
        
        # Convert merged dataframe to CSV string
        merged_csv = merged_df.to_csv(index=False)
        
        return json.dumps({
            "success": True, 
            "mergedCsv": merged_csv,
            "rowCount": len(merged_df),
            "columnCount": len(merged_df.columns),
            "columns": list(merged_df.columns)
        })
    except Exception as e:
        return json.dumps({"success": False, "error": f"Merge error: {str(e)}"})


# ═══════════════════════════════════════════════════════════════════════════
# STATISTICAL TESTS (scipy_stats imported lazily when needed)
# ═══════════════════════════════════════════════════════════════════════════

def run_statistical_test(data, test_id, columns, parameters=None):
    """
    Run a statistical test on the data.
    scipy_stats is imported lazily before this function is called.
    
    Args:
        data: CSV string (None to reuse the already parsed DataFrame)
        test_id: ID of the test to run
        columns: List of column names to use
        parameters: Optional dict of additional parameters

    Returns:
        JSON string with test results
    """
    try:
        df = parse_csv(data)
        
        result = {
            "success": True,
            "testName": test_id,
            "statistic": None,
            "pValue": None,
            "degreesOfFreedom": None,
            "interpretation": "",
            "significant": False
        }
        
        alpha = parameters.get('alpha', 0.05) if parameters else 0.05
        
        # Helper to get numeric data
        def get_numeric(col):
            return pd.to_numeric(df[col], errors='coerce').dropna()
        
        # Helper to convert numpy types to native Python types and handle NaN/Inf
        def to_python(val):
            if val is None:
                return None
            if isinstance(val, (np.bool_, np.integer, np.floating)):
                val = val.item()
            if isinstance(val, float):
                # Handle NaN and Infinity - not valid JSON
                if np.isnan(val) or np.isinf(val):
                    return None
            if isinstance(val, np.ndarray):
                return [to_python(v) for v in val.tolist()]
            return val
        
        # Normality Tests
        if test_id == 'shapiro_wilk':
            if len(columns) < 1:
                return json.dumps({"success": False, "error": "Shapiro-Wilk requires 1 numeric column"})
            col_data = get_numeric(columns[0])
            if len(col_data) < 3:
                return json.dumps({"success": False, "error": "Need at least 3 non-null values"})
            # scipy's Shapiro-Wilk p-value is unreliable above ~5000 values, so the
            # subsample stays. What it must not do is stay silent: a normality
            # verdict computed on a random 5,000 of 80,000 values is not a verdict
            # on the column, and the old result gave no way to tell which one it
            # was. Report both counts, the way paired_t reports excluded pairs.
            total_count = int(len(col_data))
            if total_count > 5000:
                # Fixed seed: the same file must give the same p-value on re-run.
                col_data = col_data.sample(5000, random_state=0)
            sampled_count = int(len(col_data))
            stat, p = scipy_stats.shapiro(col_data)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['sampledCount'] = sampled_count
            result['totalCount'] = total_count
            result['subsampled'] = bool(sampled_count < total_count)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Data {'does NOT appear' if p < alpha else 'appears'} normally distributed (p={p:.4f}). " + \
                ("Reject null hypothesis of normality. " if p < alpha else "Cannot reject null hypothesis of normality. ") + \
                (f"Computed on a random sample of {sampled_count:,} of {total_count:,} values, not the whole column, because the Shapiro-Wilk p-value is unreliable above 5,000 values."
                 if sampled_count < total_count else f"Based on all {total_count:,} non-null values.")
        
        # One-sample t-test
        elif test_id == 'one_sample_t':
            if len(columns) < 1:
                return json.dumps({"success": False, "error": "One-sample t-test requires 1 numeric column"})
            col_data = get_numeric(columns[0])
            if len(col_data) < 2:
                return json.dumps({"success": False, "error": "One-sample t-test requires at least 2 non-null values"})
            # A one-sample test compares the sample against an EXTERNAL reference.
            # The previous default fell back to col_data.mean() whenever no
            # parameters were passed, testing the sample against itself: t=0,
            # p=1.0 by construction, reported as "not significantly different"
            # every single time. parameters defaults to None in this function's
            # signature, so that was the default path, not an edge case.
            raw_mean = (parameters or {}).get('population_mean', 0)
            pop_mean = 0.0 if raw_mean is None else float(raw_mean)
            if float(col_data.std(ddof=1)) == 0.0:
                return json.dumps({"success": False, "error": f"Column '{columns[0]}' has zero variance; a t-test is undefined"})
            stat, p = scipy_stats.ttest_1samp(col_data, pop_mean)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['degreesOfFreedom'] = int(len(col_data) - 1)
            result['populationMean'] = pop_mean
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Sample mean ({col_data.mean():.2f}) is {'significantly different from' if p < alpha else 'not significantly different from'} {pop_mean} (t={stat:.3f}, p={p:.4f})."
        
        # Independent t-test
        elif test_id == 'independent_t':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Independent t-test requires 1 numeric and 1 categorical column"})
            numeric_col = columns[0]
            group_col = columns[1]
            # The previous code took .unique()[:2], which keeps whichever two
            # groups happen to appear first, silently discards every row of the
            # others, and still reports a p-value as though all of them had been
            # tested. Refuse instead: a test answering a different question than
            # the one asked is worse than no test, because the user cannot tell.
            groups = df[group_col].dropna().unique()
            if len(groups) < 2:
                return json.dumps({"success": False, "error": "Need at least 2 groups for comparison"})
            if len(groups) > 2:
                names = [str(g) for g in groups]
                return json.dumps({
                    "success": False,
                    "error": (
                        f"An independent t-test compares exactly 2 groups, but '{group_col}' "
                        f"has {len(names)} ({', '.join(names[:6])}"
                        f"{'...' if len(names) > 6 else ''}). "
                        f"Use one-way ANOVA to compare more than two groups, or filter the "
                        f"data down to exactly two groups first."
                    )
                })
            group1 = get_numeric(numeric_col)[df[group_col] == groups[0]]
            group2 = get_numeric(numeric_col)[df[group_col] == groups[1]]
            stat, p = scipy_stats.ttest_ind(group1.dropna(), group2.dropna())
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Groups '{groups[0]}' (mean={group1.mean():.2f}) and '{groups[1]}' (mean={group2.mean():.2f}) {'are significantly different' if p < alpha else 'are not significantly different'} (t={stat:.3f}, p={p:.4f})."
        
        # Paired t-test
        elif test_id == 'paired_t':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Paired t-test requires 2 numeric columns"})
            col1 = get_numeric(columns[0])
            col2 = get_numeric(columns[1])
            # get_numeric drops nulls from each column independently, so the two
            # Series no longer share an index. Pair on the shared index rather
            # than by position - otherwise a single missing value silently
            # shifts every subsequent pair by one row.
            valid_idx = col1.index.intersection(col2.index)
            if len(valid_idx) < 2:
                return json.dumps({"success": False, "error": "Paired t-test requires at least 2 complete pairs"})
            dropped = int(len(col1.index.union(col2.index)) - len(valid_idx))
            stat, p = scipy_stats.ttest_rel(col1.loc[valid_idx], col2.loc[valid_idx])
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['degreesOfFreedom'] = int(len(valid_idx) - 1)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"The paired difference between '{columns[0]}' and '{columns[1]}' is {'statistically significant' if p < alpha else 'not statistically significant'} (t={stat:.3f}, p={p:.4f}), based on {len(valid_idx)} complete pairs." + \
                (f" {dropped} incomplete pair(s) were excluded." if dropped > 0 else "")
        
        # ANOVA
        elif test_id == 'one_way_anova':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "ANOVA requires 1 numeric and 1 categorical column"})
            numeric_col = columns[0]
            group_col = columns[1]
            groups = df[group_col].dropna().unique()
            group_data = [get_numeric(numeric_col)[df[group_col] == g].dropna() for g in groups]
            group_data = [g for g in group_data if len(g) > 0]
            if len(group_data) < 2:
                return json.dumps({"success": False, "error": "Need at least 2 groups with data"})
            stat, p = scipy_stats.f_oneway(*group_data)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"ANOVA across {len(group_data)} groups: {'Significant differences exist' if p < alpha else 'No significant differences'} between group means (F={stat:.3f}, p={p:.4f})."
        
        # Chi-square independence
        elif test_id == 'chi_square_ind':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Chi-square requires 2 categorical columns"})
            contingency = pd.crosstab(df[columns[0]], df[columns[1]])
            stat, p, dof, expected = scipy_stats.chi2_contingency(contingency)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['degreesOfFreedom'] = int(dof)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Chi-square test: '{columns[0]}' and '{columns[1]}' {'are significantly associated' if p < alpha else 'are not significantly associated'} (χ²={stat:.3f}, df={dof}, p={p:.4f})."
        
        # Pearson correlation
        elif test_id == 'pearson':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Pearson requires 2 numeric columns"})
            col1 = get_numeric(columns[0])
            col2 = get_numeric(columns[1])
            valid_idx = col1.index.intersection(col2.index)
            stat, p = scipy_stats.pearsonr(col1.loc[valid_idx], col2.loc[valid_idx])
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            strength = 'strong' if abs(stat) > 0.7 else 'moderate' if abs(stat) > 0.4 else 'weak'
            direction = 'positive' if stat > 0 else 'negative'
            result['interpretation'] = f"Pearson r={stat:.3f}: {strength} {direction} correlation between '{columns[0]}' and '{columns[1]}' (p={p:.4f}). {'Statistically significant.' if p < alpha else 'Not statistically significant.'}"
        
        # Spearman correlation  
        elif test_id == 'spearman':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Spearman requires 2 columns"})
            col1 = get_numeric(columns[0])
            col2 = get_numeric(columns[1])
            valid_idx = col1.index.intersection(col2.index)
            stat, p = scipy_stats.spearmanr(col1.loc[valid_idx], col2.loc[valid_idx])
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Spearman ρ={stat:.3f}: Monotonic relationship between '{columns[0]}' and '{columns[1]}' (p={p:.4f})."
        
        # Mann-Whitney U
        elif test_id == 'mann_whitney':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Mann-Whitney requires 1 numeric and 1 categorical column"})
            numeric_col = columns[0]
            group_col = columns[1]
            # Same defect the independent t-test had: .unique()[:2] answered a
            # two-group question on a column with any number of groups, and the
            # p-value that came back gave the user no way to notice.
            groups = df[group_col].dropna().unique()
            if len(groups) < 2:
                return json.dumps({"success": False, "error": "Need at least 2 groups"})
            if len(groups) > 2:
                names = [str(g) for g in groups]
                return json.dumps({
                    "success": False,
                    "error": (
                        f"Mann-Whitney U compares exactly 2 groups, but '{group_col}' has "
                        f"{len(names)} ({', '.join(names[:6])}"
                        f"{'...' if len(names) > 6 else ''}). "
                        f"Use the Kruskal-Wallis test to compare more than two groups, or "
                        f"filter the data down to exactly two groups first."
                    )
                })
            group1 = get_numeric(numeric_col)[df[group_col] == groups[0]].dropna()
            group2 = get_numeric(numeric_col)[df[group_col] == groups[1]].dropna()
            stat, p = scipy_stats.mannwhitneyu(group1, group2, alternative='two-sided')
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Mann-Whitney U: Groups '{groups[0]}' and '{groups[1]}' {'differ significantly' if p < alpha else 'do not differ significantly'} (U={stat:.1f}, p={p:.4f})."
        
        # Kruskal-Wallis
        elif test_id == 'kruskal_wallis':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Kruskal-Wallis requires 1 numeric and 1 categorical column"})
            numeric_col = columns[0]
            group_col = columns[1]
            groups = df[group_col].dropna().unique()
            group_data = [get_numeric(numeric_col)[df[group_col] == g].dropna() for g in groups]
            group_data = [g for g in group_data if len(g) > 0]
            if len(group_data) < 2:
                return json.dumps({"success": False, "error": f"Kruskal-Wallis requires at least 2 groups with numeric data. Found {len(group_data)} groups. Make sure first column is numeric and second is categorical."})
            stat, p = scipy_stats.kruskal(*group_data)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Kruskal-Wallis: {'Significant differences' if p < alpha else 'No significant differences'} across {len(group_data)} groups (H={stat:.3f}, p={p:.4f})."
        
        # Levene's test
        elif test_id == 'levene':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Levene's test requires 1 numeric and 1 categorical column"})
            numeric_col = columns[0]
            group_col = columns[1]
            groups = df[group_col].dropna().unique()
            group_data = [get_numeric(numeric_col)[df[group_col] == g].dropna() for g in groups]
            group_data = [g for g in group_data if len(g) > 0]
            if len(group_data) < 2:
                return json.dumps({"success": False, "error": f"Levene's test requires at least 2 groups with numeric data. Found {len(group_data)} groups. Make sure first column is numeric and second is categorical."})
            stat, p = scipy_stats.levene(*group_data)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Levene's test: Variances {'are NOT equal' if p < alpha else 'appear equal'} across groups (W={stat:.3f}, p={p:.4f})."
        
        # Linear regression
        elif test_id == 'linear_regression':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Linear regression requires 2 numeric columns (x, y)"})
            x = get_numeric(columns[0])
            y = get_numeric(columns[1])
            valid_idx = x.index.intersection(y.index)
            x_valid = x.loc[valid_idx]
            y_valid = y.loc[valid_idx]
            slope, intercept, r, p, se = scipy_stats.linregress(x_valid, y_valid)
            result['statistic'] = to_python(r**2)  # R-squared
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Linear regression: y = {slope:.3f}x + {intercept:.3f}. R²={r**2:.3f} ({r**2*100:.1f}% variance explained). {'Significant relationship' if p < alpha else 'No significant relationship'} (p={p:.4f})."
        
        # Two-way ANOVA (using statsmodels approach with scipy)
        elif test_id == 'two_way_anova':
            if len(columns) < 3:
                return json.dumps({"success": False, "error": "Two-way ANOVA requires 1 numeric column and 2 categorical columns"})
            numeric_col = columns[0]
            factor1 = columns[1]
            factor2 = columns[2]
            # Perform separate one-way ANOVAs for each factor as approximation
            groups1 = df[factor1].dropna().unique()
            group_data1 = [get_numeric(numeric_col)[df[factor1] == g].dropna() for g in groups1]
            group_data1 = [g for g in group_data1 if len(g) > 0]
            groups2 = df[factor2].dropna().unique()
            group_data2 = [get_numeric(numeric_col)[df[factor2] == g].dropna() for g in groups2]
            group_data2 = [g for g in group_data2 if len(g) > 0]
            if len(group_data1) < 2 or len(group_data2) < 2:
                return json.dumps({"success": False, "error": "Need at least 2 groups for each factor"})
            stat1, p1 = scipy_stats.f_oneway(*group_data1)
            stat2, p2 = scipy_stats.f_oneway(*group_data2)

            # This is NOT a two-way ANOVA. It is two independent one-way ANOVAs:
            # there is no interaction term and no pooled error term, so it cannot
            # answer the question a two-way ANOVA answers. Saying so is the point.
            #
            # The previous code reported min(p1, p2) as "the" p-value and flagged
            # significance on (p1 < alpha or p2 < alpha). Neither is valid: the
            # minimum of two p-values is not a p-value for any hypothesis, and
            # testing twice at alpha inflates the false-positive rate to roughly
            # 2*alpha. Bonferroni over the two factors gives a family-wise value
            # that is defensible, and the per-factor numbers are reported in full
            # so a reader can judge each on its own.
            adjusted = min(1.0, min(p1, p2) * 2)

            result['statistic'] = to_python(stat1)
            result['pValue'] = to_python(adjusted)
            result['significant'] = bool(adjusted < alpha)
            result['pValueAdjustment'] = 'bonferroni-2'
            result['factors'] = [
                {"name": factor1, "statistic": to_python(stat1), "pValue": to_python(p1),
                 "significant": bool(p1 < alpha), "groupCount": int(len(group_data1))},
                {"name": factor2, "statistic": to_python(stat2), "pValue": to_python(p2),
                 "significant": bool(p2 < alpha), "groupCount": int(len(group_data2))},
            ]
            result['interpretation'] = (
                f"Two separate one-way ANOVAs, not a two-way ANOVA: no interaction "
                f"between '{factor1}' and '{factor2}' is estimated. "
                f"Factor '{factor1}': F={stat1:.3f}, p={p1:.4f} "
                f"({'significant' if p1 < alpha else 'not significant'}). "
                f"Factor '{factor2}': F={stat2:.3f}, p={p2:.4f} "
                f"({'significant' if p2 < alpha else 'not significant'}). "
                f"Family-wise p={adjusted:.4f} after Bonferroni correction for the "
                f"two tests. Use a dedicated two-way ANOVA if the interaction matters."
            )
        
        # Chi-square goodness-of-fit
        elif test_id == 'chi_square_gof':
            if len(columns) < 1:
                return json.dumps({"success": False, "error": "Chi-square GoF requires 1 categorical column"})
            observed = df[columns[0]].value_counts()
            n = len(observed)
            expected = [observed.sum() / n] * n  # Uniform expected distribution
            stat, p = scipy_stats.chisquare(observed, expected)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['degreesOfFreedom'] = int(n - 1)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Chi-square Goodness-of-Fit: Distribution of '{columns[0]}' {'significantly differs from' if p < alpha else 'does not significantly differ from'} uniform distribution (χ²={stat:.3f}, df={n-1}, p={p:.4f})."
        
        # Fisher's exact test
        elif test_id == 'fisher_exact':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Fisher's exact test requires 2 categorical columns"})
            contingency = pd.crosstab(df[columns[0]], df[columns[1]])
            # The previous code reduced a larger table with .iloc[:2, :2], which
            # keeps the two ALPHABETICALLY FIRST categories per axis and silently
            # discards every other row of the dataset, then reports a p-value as
            # though the whole dataset had been analysed. Refuse instead: a test
            # answering a different question than the one asked is worse than no
            # test, because the user cannot tell.
            if contingency.shape != (2, 2):
                rows = [str(v) for v in contingency.index.tolist()]
                cols = [str(v) for v in contingency.columns.tolist()]
                return json.dumps({
                    "success": False,
                    "error": (
                        f"Fisher's exact test needs a 2x2 table, but '{columns[0]}' has "
                        f"{len(rows)} categories ({', '.join(rows[:6])}"
                        f"{'...' if len(rows) > 6 else ''}) and '{columns[1]}' has "
                        f"{len(cols)} ({', '.join(cols[:6])}{'...' if len(cols) > 6 else ''}). "
                        f"Use a chi-square test of independence for tables larger than 2x2, "
                        f"or filter the data to exactly two categories per column first."
                    )
                })
            odds_ratio, p = scipy_stats.fisher_exact(contingency)
            result['statistic'] = to_python(odds_ratio)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Fisher's exact test: Odds ratio = {odds_ratio:.3f}. '{columns[0]}' and '{columns[1]}' {'are significantly associated' if p < alpha else 'are not significantly associated'} (p={p:.4f})."
        
        # Wilcoxon signed-rank test
        elif test_id == 'wilcoxon':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Wilcoxon signed-rank requires 2 paired numeric columns"})
            col1 = get_numeric(columns[0])
            col2 = get_numeric(columns[1])
            valid_idx = col1.index.intersection(col2.index)
            col1_valid = col1.loc[valid_idx]
            col2_valid = col2.loc[valid_idx]
            # Remove pairs where difference is 0
            diff = col1_valid - col2_valid
            nonzero_mask = diff != 0
            if nonzero_mask.sum() < 1:
                return json.dumps({"success": False, "error": "All differences are zero, cannot perform test"})
            stat, p = scipy_stats.wilcoxon(col1_valid[nonzero_mask], col2_valid[nonzero_mask])
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Wilcoxon signed-rank: Paired differences between '{columns[0]}' and '{columns[1]}' {'are statistically significant' if p < alpha else 'are not statistically significant'} (W={stat:.1f}, p={p:.4f})."
        
        # F-test for equality of variances
        elif test_id == 'f_test':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "F-test requires 2 numeric columns"})
            col1 = get_numeric(columns[0]).dropna()
            col2 = get_numeric(columns[1]).dropna()
            var1 = col1.var()
            var2 = col2.var()
            if var2 == 0:
                return json.dumps({"success": False, "error": "Variance of second column is zero"})
            f_stat = var1 / var2
            df1 = len(col1) - 1
            df2 = len(col2) - 1
            # Two-tailed p-value
            p = 2 * min(scipy_stats.f.cdf(f_stat, df1, df2), 1 - scipy_stats.f.cdf(f_stat, df1, df2))
            result['statistic'] = to_python(f_stat)
            result['pValue'] = to_python(p)
            result['degreesOfFreedom'] = f"{df1}, {df2}"
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"F-test: Variance ratio = {f_stat:.3f}. Variances of '{columns[0]}' and '{columns[1]}' {'are significantly different' if p < alpha else 'are not significantly different'} (F={f_stat:.3f}, p={p:.4f})."
        
        else:
            return json.dumps({"success": False, "error": f"Unknown test: {test_id}"})
        
        return json.dumps(_json_safe(result), allow_nan=False)
        
    except Exception as e:
        return json.dumps({"success": False, "error": f"Statistical test error: {str(e)}"})


def run_preprocessing(data, operations, columns=None):
    """
    Apply preprocessing operations to data.
    
    Args:
        data: CSV string (None to reuse the already parsed DataFrame)
        operations: List of operation IDs
        columns: Optional list of columns to apply to (None = all applicable)

    Returns:
        JSON string with preprocessed data
    """
    try:
        # Copy: preprocessing mutates columns in place and must not touch the cache
        df = parse_csv(data).copy()
        original_shape = df.shape
        
        # Determine which columns to process
        target_cols = columns if columns else list(df.columns)
        numeric_cols = df[target_cols].select_dtypes(include=[np.number]).columns.tolist()
        
        for op in operations:
            if op == 'remove_nulls':
                df = df.dropna(subset=target_cols)
            
            elif op == 'fill_mean':
                for col in numeric_cols:
                    if col in target_cols:
                        df[col] = df[col].fillna(df[col].mean())
            
            elif op == 'fill_median':
                for col in numeric_cols:
                    if col in target_cols:
                        df[col] = df[col].fillna(df[col].median())
            
            elif op == 'fill_mode':
                for col in target_cols:
                    if col in df.columns:
                        mode_val = df[col].mode()
                        if len(mode_val) > 0:
                            df[col] = df[col].fillna(mode_val.iloc[0])
            
            elif op == 'normalize':
                for col in numeric_cols:
                    if col in target_cols:
                        min_val = df[col].min()
                        max_val = df[col].max()
                        if max_val != min_val:
                            df[col] = (df[col] - min_val) / (max_val - min_val)
            
            elif op == 'standardize':
                for col in numeric_cols:
                    if col in target_cols:
                        mean_val = df[col].mean()
                        std_val = df[col].std()
                        if std_val != 0:
                            df[col] = (df[col] - mean_val) / std_val
            
            elif op == 'log_transform':
                for col in numeric_cols:
                    if col in target_cols:
                        # Add small constant to handle zeros
                        df[col] = np.log1p(df[col].clip(lower=0))
            
            elif op == 'remove_outliers':
                for col in numeric_cols:
                    if col in target_cols:
                        mean_val = df[col].mean()
                        std_val = df[col].std()
                        df = df[(df[col] >= mean_val - 3*std_val) & (df[col] <= mean_val + 3*std_val)]
            
            elif op == 'encode_categorical':
                cat_cols = df[target_cols].select_dtypes(include=['object', 'category']).columns
                for col in cat_cols:
                    df[col] = pd.factorize(df[col])[0]
            
            elif op == 'remove_duplicates':
                df = df.drop_duplicates(subset=target_cols if target_cols else None)
        
        return json.dumps({
            "success": True,
            "preprocessedCsv": df.to_csv(index=False),
            "originalRows": original_shape[0],
            "newRows": len(df),
            "originalCols": original_shape[1],
            "newCols": len(df.columns),
            "operationsApplied": operations
        })
        
    except Exception as e:
        return json.dumps({"success": False, "error": f"Preprocessing error: {str(e)}"})


def run_visualization(data, chart_type, columns):
    """
    Generate visualization data based on chart type and columns.
    
    Args:
        data: CSV string (None to reuse the already parsed DataFrame)
        chart_type: Type of chart (bar, line, scatter, pie, histogram, etc.)
        columns: List of column names to use

    Returns:
        JSON string with chart configuration
    """
    try:
        df = parse_csv(data)
        
        if len(columns) == 0:
            return json.dumps({"success": False, "error": "Please select at least one column"})
        
        result = {
            "success": True,
            "chartType": chart_type,
            "title": "",
            "xAxisLabel": "",
            "yAxisLabel": "",
            "data": [],
            "plottedRowCount": 0,
            "totalRowCount": int(len(df)),
            "countUnit": "rows",
            "truncated": False,
            "truncationNote": ""
        }

        # Helper to convert values to JSON-serializable format
        # (_json_safe also maps NaN/Infinity to None - they are not valid JSON)
        def to_serializable(val):
            return _json_safe(val)

        # The head(n) calls below keep the FIRST n rows or categories, they are
        # not samples. Each branch records what it actually plotted against what
        # exists, so the caller can say so instead of presenting a fraction of
        # the data as the data.
        def set_counts(plotted, total, unit="rows", note=None):
            plotted = int(plotted)
            total = int(total)
            result['plottedRowCount'] = plotted
            result['totalRowCount'] = total
            result['countUnit'] = unit
            result['truncated'] = bool(plotted < total)
            if plotted < total:
                result['truncationNote'] = note or f"Showing the first {plotted:,} of {total:,} {unit}, not a random sample."
            else:
                result['truncationNote'] = ""
        
        if chart_type == 'histogram':
            # Histogram: distribution of a single numeric column
            col = columns[0]
            numeric_data = pd.to_numeric(df[col], errors='coerce').dropna()
            hist, bin_edges = np.histogram(numeric_data, bins='auto')
            result['title'] = f"Distribution of {col}"
            result['xAxisLabel'] = col
            result['yAxisLabel'] = "Frequency"
            result['data'] = [
                {"bin": f"{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}", "count": int(hist[i])}
                for i in range(len(hist))
            ]
            set_counts(len(numeric_data), len(df), note=f"All {len(numeric_data):,} usable values are binned; {len(df) - len(numeric_data):,} missing or non-numeric row(s) excluded.")
        
        elif chart_type == 'pie':
            # Pie chart: category frequencies
            col = columns[0]
            all_counts = df[col].value_counts()
            value_counts = all_counts.head(10)
            result['title'] = f"Distribution of {col}"
            result['data'] = [
                {"name": str(name), "value": int(count)}
                for name, count in value_counts.items()
            ]
            set_counts(len(value_counts), len(all_counts), "categories",
                       note=f"Showing the {len(value_counts):,} most frequent of {len(all_counts):,} categories.")
        
        elif chart_type == 'bar':
            if len(columns) == 1:
                # Single column: show value counts
                col = columns[0]
                all_counts = df[col].value_counts()
                value_counts = all_counts.head(15)
                result['title'] = f"Count by {col}"
                result['xAxisLabel'] = col
                result['yAxisLabel'] = "Count"
                result['data'] = [
                    {"category": str(name), "value": int(count)}
                    for name, count in value_counts.items()
                ]
                set_counts(len(value_counts), len(all_counts), "categories",
                           note=f"Showing the {len(value_counts):,} most frequent of {len(all_counts):,} categories.")
            else:
                # Two columns: aggregate numeric by category
                cat_col = columns[0] if df[columns[0]].dtype == 'object' else columns[1]
                num_col = columns[1] if df[columns[0]].dtype == 'object' else columns[0]
                all_groups = df.groupby(cat_col)[num_col].mean()
                agg_data = all_groups.head(15)
                result['title'] = f"Average {num_col} by {cat_col}"
                result['xAxisLabel'] = cat_col
                result['yAxisLabel'] = f"Avg {num_col}"
                result['data'] = [
                    {"category": str(cat), "value": to_serializable(val)}
                    for cat, val in agg_data.items()
                ]
                set_counts(len(agg_data), len(all_groups), "categories")
        
        elif chart_type == 'line':
            if len(columns) >= 2:
                x_col, y_col = columns[0], columns[1]
                sample = df[[x_col, y_col]].dropna().head(100)
                result['title'] = f"{y_col} over {x_col}"
                result['xAxisLabel'] = x_col
                result['yAxisLabel'] = y_col
                result['data'] = [
                    {"x": to_serializable(row[x_col]), "y": to_serializable(row[y_col])}
                    for _, row in sample.iterrows()
                ]
                set_counts(len(sample), len(df))
            else:
                col = columns[0]
                sample = df[col].head(100)
                result['title'] = f"{col} Trend"
                result['xAxisLabel'] = "Index"
                result['yAxisLabel'] = col
                result['data'] = [
                    {"x": i, "y": to_serializable(val)}
                    for i, val in enumerate(sample)
                ]
                set_counts(len(sample), len(df))
        
        elif chart_type == 'scatter':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Scatter plot requires 2 columns"})
            x_col, y_col = columns[0], columns[1]
            sample = df[[x_col, y_col]].dropna().head(500)
            result['title'] = f"{y_col} vs {x_col}"
            result['xAxisLabel'] = x_col
            result['yAxisLabel'] = y_col
            result['data'] = [
                {"x": to_serializable(row[x_col]), "y": to_serializable(row[y_col])}
                for _, row in sample.iterrows()
            ]
            set_counts(len(sample), len(df))
        
        elif chart_type == 'area':
            if len(columns) >= 2:
                x_col, y_col = columns[0], columns[1]
                sample = df[[x_col, y_col]].dropna().head(100)
                result['title'] = f"{y_col} over {x_col}"
                result['xAxisLabel'] = x_col
                result['yAxisLabel'] = y_col
                result['data'] = [
                    {"x": to_serializable(row[x_col]), "y": to_serializable(row[y_col])}
                    for _, row in sample.iterrows()
                ]
                set_counts(len(sample), len(df))
            else:
                col = columns[0]
                sample = df[col].head(100)
                result['title'] = f"{col} Area"
                result['xAxisLabel'] = "Index"
                result['yAxisLabel'] = col
                result['data'] = [
                    {"x": i, "y": to_serializable(val)}
                    for i, val in enumerate(sample)
                ]
                set_counts(len(sample), len(df))
        
        elif chart_type == 'box':
            # Box plot data
            col = columns[0]
            numeric_data = pd.to_numeric(df[col], errors='coerce').dropna()
            q1, median, q3 = np.percentile(numeric_data, [25, 50, 75])
            iqr = q3 - q1
            result['title'] = f"Box Plot of {col}"
            result['data'] = [{
                "name": col,
                "min": to_serializable(numeric_data.min()),
                "q1": to_serializable(q1),
                "median": to_serializable(median),
                "q3": to_serializable(q3),
                "max": to_serializable(numeric_data.max()),
                "mean": to_serializable(numeric_data.mean())
            }]
            set_counts(len(numeric_data), len(df), note=f"Summary covers the {len(numeric_data):,} usable values; {len(df) - len(numeric_data):,} missing or non-numeric row(s) excluded.")
        
        elif chart_type == 'heatmap':
            # Correlation heatmap
            numeric_df = df[columns].select_dtypes(include=[np.number])
            if len(numeric_df.columns) < 2:
                return json.dumps({"success": False, "error": "Heatmap requires at least 2 numeric columns"})
            corr_matrix = numeric_df.corr()
            result['title'] = "Correlation Heatmap"
            result['data'] = [
                {"x": col1, "y": col2, "value": to_serializable(corr_matrix.loc[col1, col2])}
                for col1 in corr_matrix.columns
                for col2 in corr_matrix.columns
            ]
            set_counts(len(numeric_df), len(df))
        
        else:
            return json.dumps({"success": False, "error": f"Unsupported chart type: {chart_type}"})
        
        return json.dumps(_json_safe(result), allow_nan=False)
        
    except Exception as e:
        return json.dumps({"success": False, "error": f"Visualization error: {str(e)}"})


def run_custom_analysis(config, data_content):
    """
    Run custom analysis based on configuration.
    """
    try:
        analysis_type = config.get('type')

        # Blank content means "reuse the DataFrame this worker already parsed"
        data = data_content if data_content else None

        if analysis_type == 'statistical_test':
            test_id = config.get('testId')
            columns = config.get('columns', [])
            parameters = config.get('parameters', {})
            return run_statistical_test(data, test_id, columns, parameters)

        elif analysis_type == 'preprocessing':
            operations = config.get('operations', [])
            columns = config.get('columns')
            return run_preprocessing(data, operations, columns)

        elif analysis_type == 'visualization':
            chart_type = config.get('chartType', 'bar')
            columns = config.get('columns', [])
            return run_visualization(data, chart_type, columns)
        
        else:
            return json.dumps({"success": False, "error": f"Unknown analysis type: {analysis_type}"})
            
    except Exception as e:
        return json.dumps({"success": False, "error": f"Custom analysis error: {str(e)}"})
`;

// ═══════════════════════════════════════════════════════════════════════════
// WORKER STATE
// ═══════════════════════════════════════════════════════════════════════════

let pyodide = null;
let isInitialized = false;

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

/**
 * Send progress update to main thread
 */
function sendProgress(progress) {
  self.postMessage({
    type: 'PROGRESS',
    payload: progress,
    timestamp: Date.now(),
    id: generateId()
  });
}

/**
 * Send result to main thread
 */
function sendResult(payload) {
  self.postMessage({
    type: 'RESULT',
    payload,
    timestamp: Date.now(),
    id: generateId()
  });
}

/**
 * Send error to main thread
 */
function sendError(error, code = 'UNKNOWN_ERROR') {
  self.postMessage({
    type: 'ERROR',
    payload: { code, message: error, recoverable: true },
    timestamp: Date.now(),
    id: generateId()
  });
}

/**
 * Parse JSON produced by the Python layer.
 *
 * NaN and Infinity are not valid JSON; if any ever escapes the scrubbing in
 * PRISM_CORE_PYTHON, JSON.parse throws a SyntaxError that reads like a generic
 * failure. Name the real cause instead of surfacing "Unexpected token 'N'".
 */
function parseAnalysisJson(resultJson, context) {
  try {
    return JSON.parse(resultJson);
  } catch (error) {
    const nonFinite = /(?:^|[\s,:[{])-?(?:NaN|Infinity)(?=[\s,\]}]|$)/.test(String(resultJson));
    const detail = nonFinite
      ? 'it contained NaN or Infinity, which are not valid JSON (usually a column with missing or overflowing values)'
      : error instanceof Error ? error.message : 'malformed JSON';
    throw new Error(`${context} returned unreadable output: ${detail}`);
  }
}

/**
 * Fetch one Pyodide artifact with its pinned SHA-384 enforced by the browser.
 * A digest mismatch fails the fetch, so nothing unverified is ever executed.
 */
async function fetchVerified(fileName) {
  const integrity = PYODIDE_INTEGRITY[fileName];
  if (!integrity) {
    throw new Error(`No pinned digest for ${fileName}; refusing to load it.`);
  }

  let response;
  try {
    response = await fetch(`${PYODIDE_BASE}${fileName}`, { integrity, credentials: 'omit' });
  } catch {
    throw new Error(
      `${fileName} could not be downloaded, or its contents did not match the pinned ` +
      `SHA-384 digest. It was NOT executed.`
    );
  }
  if (!response.ok) {
    throw new Error(`Failed to download ${fileName} (HTTP ${response.status}).`);
  }
  return response.text();
}

/**
 * Execute already-verified source in the worker's global scope.
 * A blob URL keeps importScripts semantics (no eval, no strict-mode scoping
 * surprises) while the bytes themselves come from an integrity-checked fetch.
 */
function runVerifiedScript(source) {
  const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    importScripts(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Guard everything Pyodide itself fetches from PYODIDE_BASE.
 *
 * Runtime assets (wasm, stdlib, lock file) get their pinned digest attached;
 * package wheels already carry their own lock-file digest and pass through
 * untouched. Anything else under that base is refused rather than trusted.
 */
function installPyodideFetchGuard() {
  if (self.__prismFetchGuardInstalled) {
    return;
  }
  const nativeFetch = self.fetch.bind(self);

  self.fetch = function guardedFetch(input, init) {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL ? input.href : (input && input.url) || '';

    if (!url.startsWith(PYODIDE_BASE)) {
      return nativeFetch(input, init);
    }

    const fileName = url.slice(PYODIDE_BASE.length).split('?')[0];
    const pinned = PYODIDE_INTEGRITY[fileName];
    if (pinned) {
      return nativeFetch(input, { ...init, integrity: pinned });
    }
    if (init && init.integrity) {
      return nativeFetch(input, init);
    }
    return Promise.reject(new Error(
      `Refusing to load ${fileName} from ${PYODIDE_BASE}: no integrity digest.`
    ));
  };

  self.__prismFetchGuardInstalled = true;
}

/**
 * Initialize Pyodide runtime
 */
async function initializePyodide() {
  if (isInitialized && pyodide) {
    return;
  }

  sendProgress({
    status: 'validating',
    progress: 10,
    message: 'Downloading Python runtime...',
    accessibleMessage: `Downloading the Python runtime from ${PYODIDE_BASE}. No file data is uploaded.`
  });

  try {
    // Every fetch Pyodide makes from PYODIDE_BASE is integrity-checked.
    installPyodideFetchGuard();

    // Fetch the loader ourselves so the browser can enforce a pinned SHA-384
    // before a single byte runs - importScripts() cannot carry one.
    runVerifiedScript(await fetchVerified('pyodide.js'));

    // Pre-load the (verified) runtime module so loadPyodide() finds
    // globalThis._createPyodideModule already defined and never reaches for
    // pyodide.asm.js over an unverified importScripts().
    runVerifiedScript(await fetchVerified('pyodide.asm.js'));
    
    sendProgress({
      status: 'parsing',
      progress: 30,
      message: 'Starting verified WebAssembly runtime...',
      accessibleMessage: 'Starting the verified WebAssembly runtime.'
    });

    // Explicit indexURL: never let the loader infer where to fetch from.
    pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });

    sendProgress({
      status: 'parsing',
      progress: 50,
      message: 'Loading analytics libraries...',
      accessibleMessage: 'Loading Pandas and NumPy libraries.'
    });

    // Load required packages (scipy loaded lazily when needed for statistical tests)
    await pyodide.loadPackage(['pandas', 'numpy']);

    sendProgress({
      status: 'analyzing',
      progress: 70,
      message: 'Preparing analytics engine...',
      accessibleMessage: 'Analytics engine ready.'
    });

    // Load the Python analytics code
    await pyodide.runPythonAsync(PRISM_CORE_PYTHON);

    isInitialized = true;

    sendProgress({
      status: 'complete',
      progress: 100,
      message: 'Ready for analysis',
      accessibleMessage: 'System ready. You can now upload a file.'
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize';
    sendError(`Initialization failed: ${message}`, 'INIT_ERROR');
    throw error;
  }
}

/**
 * Process uploaded file data
 */
async function processFile(payload) {
  if (!pyodide || !isInitialized) {
    await initializePyodide();
  }

  sendProgress({
    status: 'analyzing',
    progress: 20,
    message: 'Parsing file data...',
    accessibleMessage: `Analyzing ${payload.fileName}. Please wait.`
  });

  try {
    // Data is already CSV (Excel files are converted in the main thread)
    const csvData = payload.fileContent;
    
    // Set the CSV data in Python
    pyodide.globals.set('file_data', csvData);
    pyodide.globals.set('file_type', 'csv');

    sendProgress({
      status: 'analyzing',
      progress: 50,
      message: 'Running statistical analysis...',
      accessibleMessage: 'Computing statistics and detecting patterns.'
    });

    // Run analysis
    const resultJson = await pyodide.runPythonAsync('analyze_csv(file_data, file_type)');
    const result = parseAnalysisJson(resultJson, 'Analysis');

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    sendProgress({
      status: 'generating-insights',
      progress: 80,
      message: 'Generating insights...',
      accessibleMessage: 'Generating data insights and chart recommendations.'
    });

    // Parse and send results
    sendResult({
      summary: result.summary,
      recommendations: result.recommendations,
      insights: result.insights,
      chartData: result.chartData
    });

    sendProgress({
      status: 'complete',
      progress: 100,
      message: 'Analysis complete',
      accessibleMessage: `Analysis complete. Found ${result.insights.length} insights.`
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed';
    sendError(`Analysis error: ${message}`, 'ANALYSIS_ERROR');
  }
}

/**
 * Process linked datasets - merge then analyze
 */
async function processLinkedDatasets(payload) {
  if (!pyodide || !isInitialized) {
    await initializePyodide();
  }

  const { datasets, links } = payload;

  sendProgress({
    status: 'analyzing',
    progress: 20,
    message: 'Merging datasets...',
    accessibleMessage: `Merging ${datasets.length} datasets. Please wait.`
  });

  try {
    // Convert to Python-compatible format
    pyodide.globals.set('datasets_data', JSON.stringify(datasets));
    pyodide.globals.set('links_data', JSON.stringify(links));

    sendProgress({
      status: 'analyzing',
      progress: 40,
      message: 'Processing dataset links...',
      accessibleMessage: 'Joining datasets based on defined links.'
    });

    // Merge datasets in Python
    const mergeResultJson = await pyodide.runPythonAsync(`
import json
datasets = json.loads(datasets_data)
links = json.loads(links_data)
merge_datasets(datasets, links)
`);
    
    const mergeResult = parseAnalysisJson(mergeResultJson, 'Dataset merge');

    if (!mergeResult.success) {
      throw new Error(mergeResult.error || 'Failed to merge datasets');
    }

    sendProgress({
      status: 'analyzing',
      progress: 60,
      message: `Analyzing merged data (${mergeResult.rowCount.toLocaleString()} rows)...`,
      accessibleMessage: `Analyzing ${mergeResult.rowCount} rows across ${mergeResult.columnCount} columns.`
    });

    // Now analyze the merged data
    pyodide.globals.set('file_data', mergeResult.mergedCsv);
    pyodide.globals.set('file_type', 'csv');

    const resultJson = await pyodide.runPythonAsync('analyze_csv(file_data, file_type)');
    const result = parseAnalysisJson(resultJson, 'Analysis');

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    sendProgress({
      status: 'generating-insights',
      progress: 80,
      message: 'Generating insights from linked data...',
      accessibleMessage: 'Generating insights and chart recommendations.'
    });

    sendResult({
      summary: result.summary,
      recommendations: result.recommendations,
      insights: result.insights,
      chartData: result.chartData
    });

    sendProgress({
      status: 'complete',
      progress: 100,
      message: 'Analysis complete',
      accessibleMessage: `Analysis complete. Found ${result.insights.length} insights from merged data.`
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed';
    sendError(`Analysis error: ${message}`, 'ANALYSIS_ERROR');
  }
}

// Track if scipy has been loaded
let scipyLoaded = false;

/**
 * Process custom analysis (statistical tests, preprocessing)
 */
async function processCustomAnalysis(payload) {
  if (!pyodide || !isInitialized) {
    await initializePyodide();
  }

  const { config, dataContent } = payload;

  // Load scipy lazily only for statistical tests
  if (config.type === 'statistical_test' && !scipyLoaded) {
    sendProgress({
      status: 'analyzing',
      progress: 20,
      message: 'Loading statistical libraries (first time only)...',
      accessibleMessage: 'Loading SciPy for statistical analysis. This may take a moment on first use.'
    });
    
    await pyodide.loadPackage(['scipy']);
    scipyLoaded = true;
    
    // Import scipy.stats in Python
    await pyodide.runPythonAsync(`from scipy import stats as scipy_stats`);
  }

  sendProgress({
    status: 'analyzing',
    progress: 40,
    message: `Running ${config.type}...`,
    accessibleMessage: `Running custom ${config.type} analysis.`
  });

  try {
    // Convert config to Python-compatible format.
    // dataContent is optional: an empty string tells Python to reuse the
    // DataFrame it already parsed instead of re-parsing the whole CSV.
    pyodide.globals.set('analysis_config', JSON.stringify(config));
    pyodide.globals.set('analysis_data', dataContent || '');

    sendProgress({
      status: 'analyzing',
      progress: 60,
      message: 'Processing...',
      accessibleMessage: 'Executing analysis.'
    });

    // Run the custom analysis
    const resultJson = await pyodide.runPythonAsync(`
import json
config = json.loads(analysis_config)
run_custom_analysis(config, analysis_data)
`);
    
    const result = parseAnalysisJson(resultJson, 'Custom analysis');

    sendProgress({
      status: 'complete',
      progress: 100,
      message: 'Analysis complete',
      accessibleMessage: 'Custom analysis completed successfully.'
    });

    // Build the result payload based on analysis type
    const payload = {
      type: config.type,
      success: result.success,
      error: result.error
    };

    // Add type-specific results
    if (config.type === 'statistical_test' && result.success) {
      payload.testResult = {
        testName: result.testName,
        statistic: result.statistic,
        pValue: result.pValue,
        degreesOfFreedom: result.degreesOfFreedom,
        interpretation: result.interpretation,
        significant: result.significant
      };
    } else if (config.type === 'preprocessing' && result.success) {
      payload.preprocessedData = result.preprocessedCsv;
      payload.originalRows = result.originalRows;
      payload.newRows = result.newRows;
      payload.operationsApplied = result.operationsApplied;
    } else if (config.type === 'visualization' && result.success) {
      // Forward ALL visualization data
      payload.chartType = result.chartType;
      payload.title = result.title;
      payload.xAxisLabel = result.xAxisLabel;
      payload.yAxisLabel = result.yAxisLabel;
      payload.data = result.data;
      // The Python layer computes these so a user can see they are looking at
      // the first 15 of 400 categories rather than all of them. Dropping them
      // here silently undid that: the chart still truncated, and the notice
      // never reached the UI. The whole point of the field is that it survives
      // the trip to the renderer.
      payload.plottedRowCount = result.plottedRowCount;
      payload.totalRowCount = result.totalRowCount;
      payload.countUnit = result.countUnit;
      payload.truncated = result.truncated;
      payload.truncationNote = result.truncationNote;
    }

    // Send custom analysis result
    self.postMessage({
      type: 'CUSTOM_ANALYSIS_RESULT',
      payload,
      timestamp: Date.now(),
      id: generateId()
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Custom analysis failed';
    sendError(`Analysis error: ${message}`, 'ANALYSIS_ERROR');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE LISTENER
// ═══════════════════════════════════════════════════════════════════════════

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'INIT':
        await initializePyodide();
        break;

      case 'PROCESS_FILE':
        await processFile(payload);
        break;

      case 'PROCESS_LINKED_DATASETS':
        await processLinkedDatasets(payload);
        break;

      case 'CUSTOM_ANALYSIS':
        await processCustomAnalysis(payload);
        break;

      default:
        sendError(`Unknown message type: ${type}`, 'INVALID_MESSAGE');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendError(message, 'WORKER_ERROR');
  }
};

// Initialize on load
initializePyodide().catch(console.error);
