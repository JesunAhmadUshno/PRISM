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

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

// The Python analytics script (embedded for security - no external fetch)
const PRISM_CORE_PYTHON = `
"""
PRISM Core Analytics Engine (Embedded)
"""

import json
import io
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


class PrismAnalytics:
    def __init__(self):
        self.df = None
        self.column_types = {}
        
    def load_csv(self, csv_string, file_type='csv'):
        """Load data - Excel files are pre-converted to CSV in JavaScript"""
        try:
            # Clean the input
            csv_string = csv_string.strip()
            
            # Try standard parsing first
            try:
                self.df = pd.read_csv(
                    io.StringIO(csv_string),
                    on_bad_lines='skip',
                    encoding_errors='replace',
                    engine='python'
                )
            except Exception:
                # Fallback: try with different settings
                self.df = pd.read_csv(
                    io.StringIO(csv_string),
                    sep=None,
                    engine='python',
                    on_bad_lines='skip'
                )
            
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
                    "mean": float(ns.mean()) if pd.notna(ns.mean()) else None,
                    "median": float(ns.median()) if pd.notna(ns.median()) else None,
                    "stdDev": float(ns.std()) if pd.notna(ns.std()) else None,
                    "min": float(ns.min()) if pd.notna(ns.min()) else None,
                    "max": float(ns.max()) if pd.notna(ns.max()) else None,
                    "q1": float(ns.quantile(0.25)) if pd.notna(ns.quantile(0.25)) else None,
                    "q3": float(ns.quantile(0.75)) if pd.notna(ns.quantile(0.75)) else None
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
        if self.df is None or x_col not in self.df.columns:
            return []
        try:
            if chart_type == "histogram":
                series = pd.to_numeric(self.df[x_col], errors='coerce').dropna()
                hist, bins = np.histogram(series, bins=20)
                return [{"bin": f"{bins[i]:.2f}-{bins[i+1]:.2f}", "count": int(hist[i])} for i in range(len(hist))]
            elif chart_type in ["bar", "pie"]:
                if y_col and y_col in self.df.columns:
                    grouped = self.df.groupby(x_col)[y_col].mean().reset_index()
                else:
                    grouped = self.df[x_col].value_counts().reset_index()
                    grouped.columns = [x_col, 'count']
                return grouped.head(limit).to_dict('records')
            else:
                cols = [x_col] + ([y_col] if y_col and y_col in self.df.columns else [])
                return self.df[cols].head(limit).to_dict('records')
        except:
            return []
    
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
                    data = self.get_chart_data(rec['chartType'], rec.get('xAxis', ''), rec.get('yAxis'))
                    if data:
                        chart_data.append({
                            "type": rec['chartType'],
                            "title": f"{rec['chartType'].title()} Chart",
                            "xAxisLabel": rec.get('xAxis', ''),
                            "yAxisLabel": rec.get('yAxis', 'Count'),
                            "data": data
                        })
                except Exception:
                    continue
            
            return json.dumps({
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
            }, default=str)
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
            df = pd.read_csv(io.StringIO(ds['content']), on_bad_lines='skip', engine='python')
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
        data: CSV string
        test_id: ID of the test to run
        columns: List of column names to use
        parameters: Optional dict of additional parameters
    
    Returns:
        JSON string with test results
    """
    try:
        df = pd.read_csv(io.StringIO(data), on_bad_lines='skip', engine='python')
        
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
        
        # Helper to convert numpy types to native Python types
        def to_python(val):
            if val is None:
                return None
            if isinstance(val, (np.bool_, np.integer, np.floating)):
                return val.item()
            if isinstance(val, np.ndarray):
                return val.tolist()
            return val
        
        # Normality Tests
        if test_id == 'shapiro_wilk':
            if len(columns) < 1:
                return json.dumps({"success": False, "error": "Shapiro-Wilk requires 1 numeric column"})
            col_data = get_numeric(columns[0])
            if len(col_data) < 3:
                return json.dumps({"success": False, "error": "Need at least 3 non-null values"})
            if len(col_data) > 5000:
                col_data = col_data.sample(5000)
            stat, p = scipy_stats.shapiro(col_data)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Data {'does NOT appear' if p < alpha else 'appears'} normally distributed (p={p:.4f}). " + \
                ("Reject null hypothesis of normality." if p < alpha else "Cannot reject null hypothesis of normality.")
        
        # One-sample t-test
        elif test_id == 'one_sample_t':
            if len(columns) < 1:
                return json.dumps({"success": False, "error": "One-sample t-test requires 1 numeric column"})
            col_data = get_numeric(columns[0])
            pop_mean = parameters.get('population_mean', 0) if parameters else col_data.mean()
            stat, p = scipy_stats.ttest_1samp(col_data, pop_mean)
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['degreesOfFreedom'] = int(len(col_data) - 1)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"Sample mean ({col_data.mean():.2f}) is {'significantly different from' if p < alpha else 'not significantly different from'} {pop_mean} (t={stat:.3f}, p={p:.4f})."
        
        # Independent t-test
        elif test_id == 'independent_t':
            if len(columns) < 2:
                return json.dumps({"success": False, "error": "Independent t-test requires 1 numeric and 1 categorical column"})
            numeric_col = columns[0]
            group_col = columns[1]
            groups = df[group_col].dropna().unique()[:2]
            if len(groups) < 2:
                return json.dumps({"success": False, "error": "Need at least 2 groups for comparison"})
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
            min_len = min(len(col1), len(col2))
            stat, p = scipy_stats.ttest_rel(col1[:min_len], col2[:min_len])
            result['statistic'] = to_python(stat)
            result['pValue'] = to_python(p)
            result['significant'] = bool(p < alpha)
            result['interpretation'] = f"The paired difference between '{columns[0]}' and '{columns[1]}' is {'statistically significant' if p < alpha else 'not statistically significant'} (t={stat:.3f}, p={p:.4f})."
        
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
            groups = df[group_col].dropna().unique()[:2]
            if len(groups) < 2:
                return json.dumps({"success": False, "error": "Need at least 2 groups"})
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
            result['statistic'] = to_python(stat1)
            result['pValue'] = to_python(min(p1, p2))
            result['significant'] = bool(p1 < alpha or p2 < alpha)
            result['interpretation'] = f"Two-way ANOVA: Factor '{factor1}' (F={stat1:.3f}, p={p1:.4f}) {'significant' if p1 < alpha else 'not significant'}. Factor '{factor2}' (F={stat2:.3f}, p={p2:.4f}) {'significant' if p2 < alpha else 'not significant'}."
        
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
            if contingency.shape != (2, 2):
                # Reduce to 2x2 by taking top 2 categories from each
                contingency = contingency.iloc[:2, :2]
            if contingency.shape != (2, 2):
                return json.dumps({"success": False, "error": "Fisher's exact test requires a 2x2 contingency table (2 categories each)"})
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
        
        return json.dumps(result)
        
    except Exception as e:
        return json.dumps({"success": False, "error": f"Statistical test error: {str(e)}"})


def run_preprocessing(data, operations, columns=None):
    """
    Apply preprocessing operations to data.
    
    Args:
        data: CSV string
        operations: List of operation IDs
        columns: Optional list of columns to apply to (None = all applicable)
    
    Returns:
        JSON string with preprocessed data
    """
    try:
        df = pd.read_csv(io.StringIO(data), on_bad_lines='skip', engine='python')
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
        data: CSV string
        chart_type: Type of chart (bar, line, scatter, pie, histogram, etc.)
        columns: List of column names to use
    
    Returns:
        JSON string with chart configuration
    """
    try:
        df = pd.read_csv(io.StringIO(data), on_bad_lines='skip', engine='python')
        
        if len(columns) == 0:
            return json.dumps({"success": False, "error": "Please select at least one column"})
        
        result = {
            "success": True,
            "chartType": chart_type,
            "title": "",
            "xAxisLabel": "",
            "yAxisLabel": "",
            "data": []
        }
        
        # Helper to convert values to JSON-serializable format
        def to_serializable(val):
            if pd.isna(val):
                return None
            if isinstance(val, (np.bool_, np.integer, np.floating)):
                return val.item()
            return val
        
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
        
        elif chart_type == 'pie':
            # Pie chart: category frequencies
            col = columns[0]
            value_counts = df[col].value_counts().head(10)
            result['title'] = f"Distribution of {col}"
            result['data'] = [
                {"name": str(name), "value": int(count)}
                for name, count in value_counts.items()
            ]
        
        elif chart_type == 'bar':
            if len(columns) == 1:
                # Single column: show value counts
                col = columns[0]
                value_counts = df[col].value_counts().head(15)
                result['title'] = f"Count by {col}"
                result['xAxisLabel'] = col
                result['yAxisLabel'] = "Count"
                result['data'] = [
                    {"category": str(name), "value": int(count)}
                    for name, count in value_counts.items()
                ]
            else:
                # Two columns: aggregate numeric by category
                cat_col = columns[0] if df[columns[0]].dtype == 'object' else columns[1]
                num_col = columns[1] if df[columns[0]].dtype == 'object' else columns[0]
                agg_data = df.groupby(cat_col)[num_col].mean().head(15)
                result['title'] = f"Average {num_col} by {cat_col}"
                result['xAxisLabel'] = cat_col
                result['yAxisLabel'] = f"Avg {num_col}"
                result['data'] = [
                    {"category": str(cat), "value": to_serializable(val)}
                    for cat, val in agg_data.items()
                ]
        
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
            else:
                col = columns[0]
                result['title'] = f"{col} Trend"
                result['xAxisLabel'] = "Index"
                result['yAxisLabel'] = col
                result['data'] = [
                    {"x": i, "y": to_serializable(val)}
                    for i, val in enumerate(df[col].head(100))
                ]
        
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
            else:
                col = columns[0]
                result['title'] = f"{col} Area"
                result['xAxisLabel'] = "Index"
                result['yAxisLabel'] = col
                result['data'] = [
                    {"x": i, "y": to_serializable(val)}
                    for i, val in enumerate(df[col].head(100))
                ]
        
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
        
        else:
            return json.dumps({"success": False, "error": f"Unsupported chart type: {chart_type}"})
        
        return json.dumps(result)
        
    except Exception as e:
        return json.dumps({"success": False, "error": f"Visualization error: {str(e)}"})


def run_custom_analysis(config, data_content):
    """
    Run custom analysis based on configuration.
    """
    try:
        analysis_type = config.get('type')
        
        if analysis_type == 'statistical_test':
            test_id = config.get('testId')
            columns = config.get('columns', [])
            parameters = config.get('parameters', {})
            return run_statistical_test(data_content, test_id, columns, parameters)
        
        elif analysis_type == 'preprocessing':
            operations = config.get('operations', [])
            columns = config.get('columns')
            return run_preprocessing(data_content, operations, columns)
        
        elif analysis_type == 'visualization':
            chart_type = config.get('chartType', 'bar')
            columns = config.get('columns', [])
            return run_visualization(data_content, chart_type, columns)
        
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
 * Initialize Pyodide runtime
 */
async function initializePyodide() {
  if (isInitialized && pyodide) {
    return;
  }

  sendProgress({
    status: 'validating',
    progress: 10,
    message: 'Loading Python runtime...',
    accessibleMessage: 'Loading Python runtime. Please wait.'
  });

  try {
    // Import Pyodide from CDN - this works in classic workers
    importScripts(`${PYODIDE_CDN}pyodide.js`);
    
    sendProgress({
      status: 'parsing',
      progress: 30,
      message: 'Initializing WebAssembly...',
      accessibleMessage: 'Initializing WebAssembly sandbox.'
    });

    // Load Pyodide
    pyodide = await loadPyodide();

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
    const result = JSON.parse(resultJson);

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
    
    const mergeResult = JSON.parse(mergeResultJson);

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
    const result = JSON.parse(resultJson);

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
    // Convert config to Python-compatible format
    pyodide.globals.set('analysis_config', JSON.stringify(config));
    pyodide.globals.set('analysis_data', dataContent);

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
    
    const result = JSON.parse(resultJson);

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
