"""
!!! UNUSED MODULE - NOT THE ENGINE THAT RUNS !!!

Nothing imports this file. Verified: no reference to "prism_core" exists
anywhere in src/, vite.config.ts, index.html or package.json.

The analytics engine that ACTUALLY EXECUTES is embedded as a Python string
inside src/workers/prism.worker.js and is loaded into Pyodide from there.
That copy has 22 function definitions to this file's 12, and the two define
analyze_csv differently. They have diverged.

Consequence: reading this file to understand PRISM's statistics gives you the
wrong answer, and any fix applied here changes nothing at runtime. An audit of
this repo would review dead code and miss the live engine entirely.

Decision required, deliberately left open:
  (a) delete this file, since src/workers/prism.worker.js is the real engine, or
  (b) extract the embedded engine back out to this file and have the worker
      fetch it, which restores testability - the embedded copy currently has
      no test harness of any kind.

Option (b) is the better end state: Python embedded in a JS template literal
cannot be linted, typed or unit tested, which is why the paired t-test and
one-sample t-test bugs both survived in it. But it is a real refactor, not a
cleanup, so it is logged rather than done.

Recorded in LEDGER.md. Until resolved, treat this file as documentation of an
older design, not as running code.

-----------------------------------------------------------------------------

PRISM Core Analytics Engine

Browser-based statistical analysis and visualization recommendation system.
Runs entirely in Pyodide (WebAssembly) - no network transmission.

@security: All data processing is client-side only.
@compliance: GDPR Art 32, PIPEDA compliant (zero data exfiltration)

Author: PRISM Architecture Team
Version: 1.0.0
"""

import json
import io
from typing import Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# Pyodide-compatible imports
import pandas as pd
import numpy as np


class DataType(Enum):
    """Classification of column data types."""
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"
    DATETIME = "datetime"
    TEXT = "text"
    BOOLEAN = "boolean"


class ChartType(Enum):
    """Supported visualization types."""
    LINE = "line"
    BAR = "bar"
    SCATTER = "scatter"
    PIE = "pie"
    AREA = "area"
    HISTOGRAM = "histogram"
    BOXPLOT = "boxplot"
    HEATMAP = "heatmap"


class InsightType(Enum):
    """Types of AI-generated insights."""
    TREND = "trend"
    OUTLIER = "outlier"
    CORRELATION = "correlation"
    DISTRIBUTION = "distribution"
    COMPARISON = "comparison"
    SUMMARY = "summary"


@dataclass
class ColumnInfo:
    """Metadata about a single column."""
    name: str
    data_type: str
    null_count: int
    unique_count: int
    sample_values: list


@dataclass
class StatisticalSummary:
    """Statistical summary for a column."""
    column_name: str
    data_type: str
    count: int
    null_count: int
    unique_count: int
    # Numeric fields (optional)
    mean: Optional[float] = None
    median: Optional[float] = None
    std_dev: Optional[float] = None
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    # Categorical fields (optional)
    mode: Optional[str] = None
    top_values: Optional[list] = None


@dataclass
class VisualizationRecommendation:
    """Recommended visualization for the dataset."""
    chart_type: str
    confidence: float
    reason: str
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    group_by: Optional[str] = None
    metrics: Optional[list] = None


@dataclass
class AIInsight:
    """AI-generated insight about the data."""
    id: str
    insight_type: str
    severity: str  # info, warning, critical
    title: str
    description: str
    affected_columns: list
    confidence: float
    accessible_description: str  # Screen reader optimized


class PrismAnalytics:
    """
    Main analytics engine for PRISM.
    
    Performs:
    - Column type detection
    - Statistical analysis
    - Visualization recommendations
    - AI-driven insights
    """
    
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.column_types: dict[str, DataType] = {}
        
    def load_csv(self, csv_string: str) -> dict[str, Any]:
        """
        Load and parse CSV data.
        
        Args:
            csv_string: Raw CSV content as string
            
        Returns:
            Dictionary with parsing results
        """
        try:
            # Parse CSV with pandas
            self.df = pd.read_csv(
                io.StringIO(csv_string),
                dtype_backend='numpy_nullable',  # Better null handling
                on_bad_lines='warn'
            )
            
            # Detect column types
            self._detect_column_types()
            
            return {
                "success": True,
                "rows": len(self.df),
                "columns": len(self.df.columns),
                "column_names": list(self.df.columns)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _detect_column_types(self) -> None:
        """Automatically detect data types for each column."""
        if self.df is None:
            return
            
        for col in self.df.columns:
            self.column_types[col] = self._infer_column_type(col)
    
    def _infer_column_type(self, column: str) -> DataType:
        """
        Infer the semantic data type of a column.
        
        Goes beyond pandas dtypes to determine if data is:
        - Numeric (continuous values)
        - Categorical (limited distinct values)
        - DateTime (date/time values)
        - Text (free-form text)
        - Boolean (true/false)
        """
        if self.df is None:
            return DataType.TEXT
            
        series = self.df[column]
        dtype = series.dtype
        
        # Check for boolean
        if dtype == 'bool' or dtype == 'boolean':
            return DataType.BOOLEAN
            
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(dtype):
            return DataType.DATETIME
            
        # Try parsing as datetime
        if dtype == 'object':
            try:
                pd.to_datetime(series.dropna().head(100))
                return DataType.DATETIME
            except (ValueError, TypeError):
                pass
        
        # Check for numeric
        if pd.api.types.is_numeric_dtype(dtype):
            unique_ratio = series.nunique() / len(series) if len(series) > 0 else 0
            # If low cardinality numeric, treat as categorical
            if series.nunique() <= 10 and unique_ratio < 0.05:
                return DataType.CATEGORICAL
            return DataType.NUMERIC
        
        # Check for categorical (limited unique values)
        if dtype == 'object' or dtype == 'category':
            unique_count = series.nunique()
            if unique_count <= 20:
                return DataType.CATEGORICAL
            # Check average string length for text vs categorical
            avg_len = series.dropna().astype(str).str.len().mean()
            if avg_len > 50:
                return DataType.TEXT
            return DataType.CATEGORICAL
        
        return DataType.TEXT
    
    def get_column_info(self) -> list[dict]:
        """Get metadata for all columns."""
        if self.df is None:
            return []
            
        columns = []
        for col in self.df.columns:
            series = self.df[col]
            columns.append(asdict(ColumnInfo(
                name=col,
                data_type=self.column_types[col].value,
                null_count=int(series.isna().sum()),
                unique_count=int(series.nunique()),
                sample_values=series.dropna().head(5).tolist()
            )))
        return columns
    
    def compute_statistics(self) -> list[dict]:
        """
        Compute comprehensive statistics for all columns.
        
        Returns:
            List of statistical summaries per column
        """
        if self.df is None:
            return []
            
        stats = []
        for col in self.df.columns:
            series = self.df[col]
            col_type = self.column_types[col]
            
            base_stats = {
                "column_name": col,
                "data_type": col_type.value,
                "count": int(len(series)),
                "null_count": int(series.isna().sum()),
                "unique_count": int(series.nunique())
            }
            
            if col_type == DataType.NUMERIC:
                # Numeric statistics
                numeric_series = pd.to_numeric(series, errors='coerce')
                base_stats.update({
                    "mean": self._safe_stat(numeric_series.mean),
                    "median": self._safe_stat(numeric_series.median),
                    "std_dev": self._safe_stat(numeric_series.std),
                    "min_val": self._safe_stat(numeric_series.min),
                    "max_val": self._safe_stat(numeric_series.max),
                    "q1": self._safe_stat(lambda: numeric_series.quantile(0.25)),
                    "q3": self._safe_stat(lambda: numeric_series.quantile(0.75))
                })
            elif col_type == DataType.CATEGORICAL:
                # Categorical statistics
                value_counts = series.value_counts().head(10)
                base_stats.update({
                    "mode": str(series.mode().iloc[0]) if len(series.mode()) > 0 else None,
                    "top_values": [
                        {"value": str(k), "count": int(v)} 
                        for k, v in value_counts.items()
                    ]
                })
            
            stats.append(base_stats)
        
        return stats
    
    def _safe_stat(self, func) -> Optional[float]:
        """Safely compute a statistic, returning None on error."""
        try:
            result = func() if callable(func) else func
            if pd.isna(result) or not np.isfinite(result):
                return None
            return round(float(result), 4)
        except Exception:
            return None
    
    def recommend_visualizations(self) -> list[dict]:
        """
        Generate visualization recommendations based on data types.
        
        Uses heuristics to suggest appropriate chart types:
        - Time series → Line chart
        - Categorical → Bar/Pie chart
        - Two numeric → Scatter plot
        - Single numeric → Histogram
        - Multiple categories → Stacked bar
        """
        if self.df is None:
            return []
            
        recommendations = []
        
        numeric_cols = [c for c, t in self.column_types.items() if t == DataType.NUMERIC]
        categorical_cols = [c for c, t in self.column_types.items() if t == DataType.CATEGORICAL]
        datetime_cols = [c for c, t in self.column_types.items() if t == DataType.DATETIME]
        
        # Recommendation 1: Time series line chart
        if datetime_cols and numeric_cols:
            recommendations.append(asdict(VisualizationRecommendation(
                chart_type=ChartType.LINE.value,
                confidence=0.9,
                reason="Time-based data detected. Line chart shows trends over time effectively.",
                x_axis=datetime_cols[0],
                y_axis=numeric_cols[0],
                metrics=numeric_cols[:3]
            )))
        
        # Recommendation 2: Category comparison bar chart
        if categorical_cols and numeric_cols:
            recommendations.append(asdict(VisualizationRecommendation(
                chart_type=ChartType.BAR.value,
                confidence=0.85,
                reason="Categorical and numeric data detected. Bar chart enables clear comparison across categories.",
                x_axis=categorical_cols[0],
                y_axis=numeric_cols[0],
                group_by=categorical_cols[1] if len(categorical_cols) > 1 else None
            )))
        
        # Recommendation 3: Distribution histogram
        if numeric_cols:
            recommendations.append(asdict(VisualizationRecommendation(
                chart_type=ChartType.HISTOGRAM.value,
                confidence=0.8,
                reason="Numeric data detected. Histogram shows value distribution.",
                x_axis=numeric_cols[0]
            )))
        
        # Recommendation 4: Scatter plot for correlations
        if len(numeric_cols) >= 2:
            recommendations.append(asdict(VisualizationRecommendation(
                chart_type=ChartType.SCATTER.value,
                confidence=0.75,
                reason="Multiple numeric columns detected. Scatter plot reveals correlations.",
                x_axis=numeric_cols[0],
                y_axis=numeric_cols[1],
                group_by=categorical_cols[0] if categorical_cols else None
            )))
        
        # Recommendation 5: Pie chart for proportions
        if categorical_cols and len(self.df[categorical_cols[0]].unique()) <= 8:
            recommendations.append(asdict(VisualizationRecommendation(
                chart_type=ChartType.PIE.value,
                confidence=0.7,
                reason="Low-cardinality categorical data detected. Pie chart shows proportional distribution.",
                x_axis=categorical_cols[0],
                y_axis=numeric_cols[0] if numeric_cols else None
            )))
        
        # Sort by confidence
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        
        return recommendations
    
    def generate_insights(self) -> list[dict]:
        """
        Generate AI-driven insights about the data.
        
        Analyzes:
        - Data quality issues
        - Statistical anomalies
        - Trends and patterns
        - Correlations
        """
        if self.df is None:
            return []
            
        insights = []
        
        # Insight 1: Data quality summary
        total_cells = self.df.size
        null_cells = self.df.isna().sum().sum()
        null_pct = (null_cells / total_cells) * 100 if total_cells > 0 else 0
        
        insights.append(asdict(AIInsight(
            id=str(uuid.uuid4())[:8],
            insight_type=InsightType.SUMMARY.value,
            severity="info" if null_pct < 5 else "warning" if null_pct < 20 else "critical",
            title="Data Quality Overview",
            description=f"Dataset contains {len(self.df):,} rows and {len(self.df.columns)} columns. "
                       f"Missing values: {null_pct:.1f}% ({int(null_cells):,} cells).",
            affected_columns=list(self.df.columns[self.df.isna().any()]),
            confidence=1.0,
            accessible_description=f"Data quality summary: {len(self.df):,} rows, "
                                  f"{len(self.df.columns)} columns, "
                                  f"{null_pct:.1f} percent missing values."
        )))
        
        # Insight 2: Numeric trends
        numeric_cols = [c for c, t in self.column_types.items() if t == DataType.NUMERIC]
        for col in numeric_cols[:3]:  # Limit to first 3
            series = pd.to_numeric(self.df[col], errors='coerce').dropna()
            if len(series) < 10:
                continue
                
            # Compute trend (simple linear regression slope)
            x = np.arange(len(series))
            slope = np.polyfit(x, series.values, 1)[0] if len(series) > 1 else 0
            
            # Determine trend direction and magnitude
            range_val = series.max() - series.min()
            if range_val > 0:
                normalized_slope = (slope * len(series)) / range_val
                
                if abs(normalized_slope) > 0.1:
                    direction = "upward" if slope > 0 else "downward"
                    pct_change = abs(normalized_slope) * 100
                    
                    insights.append(asdict(AIInsight(
                        id=str(uuid.uuid4())[:8],
                        insight_type=InsightType.TREND.value,
                        severity="info",
                        title=f"Trend Detected in {col}",
                        description=f"Values show an {direction} trend, "
                                   f"changing approximately {pct_change:.1f}% over the dataset range.",
                        affected_columns=[col],
                        confidence=0.8,
                        accessible_description=f"Trend detected: {col} shows {direction} movement, "
                                              f"approximately {pct_change:.1f} percent change."
                    )))
        
        # Insight 3: Outlier detection (IQR method)
        for col in numeric_cols[:3]:
            series = pd.to_numeric(self.df[col], errors='coerce').dropna()
            if len(series) < 10:
                continue
                
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            outliers = series[(series < lower_bound) | (series > upper_bound)]
            outlier_pct = (len(outliers) / len(series)) * 100
            
            if outlier_pct > 1:
                insights.append(asdict(AIInsight(
                    id=str(uuid.uuid4())[:8],
                    insight_type=InsightType.OUTLIER.value,
                    severity="warning" if outlier_pct > 5 else "info",
                    title=f"Outliers in {col}",
                    description=f"Found {len(outliers)} outlier values ({outlier_pct:.1f}%) "
                               f"outside the normal range ({lower_bound:.2f} to {upper_bound:.2f}).",
                    affected_columns=[col],
                    confidence=0.85,
                    accessible_description=f"Outliers detected: {col} has {len(outliers)} unusual values, "
                                          f"representing {outlier_pct:.1f} percent of data."
                )))
        
        # Insight 4: Correlation detection
        if len(numeric_cols) >= 2:
            try:
                numeric_df = self.df[numeric_cols].apply(pd.to_numeric, errors='coerce')
                corr_matrix = numeric_df.corr()
                
                # Find strong correlations (excluding diagonal)
                for i, col1 in enumerate(numeric_cols):
                    for col2 in numeric_cols[i+1:]:
                        corr = corr_matrix.loc[col1, col2]
                        if pd.notna(corr) and abs(corr) > 0.7:
                            direction = "positive" if corr > 0 else "negative"
                            strength = "strong" if abs(corr) > 0.85 else "moderate"
                            
                            insights.append(asdict(AIInsight(
                                id=str(uuid.uuid4())[:8],
                                insight_type=InsightType.CORRELATION.value,
                                severity="info",
                                title=f"Correlation: {col1} & {col2}",
                                description=f"Found {strength} {direction} correlation (r={corr:.2f}) "
                                           f"between these columns.",
                                affected_columns=[col1, col2],
                                confidence=abs(corr),
                                accessible_description=f"Correlation found: {col1} and {col2} have a "
                                                      f"{strength} {direction} relationship, "
                                                      f"correlation coefficient {corr:.2f}."
                            )))
            except Exception:
                pass  # Skip correlation on error
        
        return insights
    
    def get_chart_data(self, chart_type: str, x_col: str, y_col: Optional[str] = None, 
                       limit: int = 100) -> list[dict]:
        """
        Prepare data for chart rendering.
        
        Args:
            chart_type: Type of chart (bar, line, etc.)
            x_col: X-axis column name
            y_col: Y-axis column name (optional)
            limit: Maximum data points
            
        Returns:
            List of data points for charting
        """
        if self.df is None or x_col not in self.df.columns:
            return []
            
        try:
            if chart_type == "histogram":
                # Histogram data - bin the values
                series = pd.to_numeric(self.df[x_col], errors='coerce').dropna()
                hist, bins = np.histogram(series, bins=20)
                return [
                    {
                        "bin": f"{bins[i]:.2f}-{bins[i+1]:.2f}",
                        "count": int(hist[i]),
                        "binStart": float(bins[i]),
                        "binEnd": float(bins[i+1])
                    }
                    for i in range(len(hist))
                ]
            
            elif chart_type in ["bar", "pie"]:
                # Aggregated data
                if y_col and y_col in self.df.columns:
                    grouped = self.df.groupby(x_col)[y_col].mean().reset_index()
                    grouped.columns = [x_col, y_col]
                else:
                    grouped = self.df[x_col].value_counts().reset_index()
                    grouped.columns = [x_col, 'count']
                    y_col = 'count'
                
                return grouped.head(limit).to_dict('records')
            
            else:
                # Raw data (line, scatter)
                cols = [x_col]
                if y_col and y_col in self.df.columns:
                    cols.append(y_col)
                
                return self.df[cols].head(limit).to_dict('records')
                
        except Exception as e:
            return [{"error": str(e)}]
    
    def analyze(self, csv_string: str) -> str:
        """
        Main analysis entry point.
        
        Args:
            csv_string: Raw CSV content
            
        Returns:
            JSON string with complete analysis results
        """
        import time
        start_time = time.time()
        
        # Load data
        load_result = self.load_csv(csv_string)
        if not load_result.get("success"):
            return json.dumps({
                "success": False,
                "error": load_result.get("error", "Failed to parse CSV")
            })
        
        # Perform analysis
        columns = self.get_column_info()
        statistics = self.compute_statistics()
        recommendations = self.recommend_visualizations()
        insights = self.generate_insights()
        
        # Prepare chart data for top recommendations
        chart_data = []
        for rec in recommendations[:3]:
            data = self.get_chart_data(
                rec['chart_type'],
                rec.get('x_axis', ''),
                rec.get('y_axis')
            )
            if data:
                chart_data.append({
                    "type": rec['chart_type'],
                    "title": f"{rec['chart_type'].title()} Chart",
                    "xAxisLabel": rec.get('x_axis', ''),
                    "yAxisLabel": rec.get('y_axis', 'Count'),
                    "data": data
                })
        
        processing_time = (time.time() - start_time) * 1000  # ms
        
        return json.dumps({
            "success": True,
            "summary": {
                "rowCount": len(self.df) if self.df is not None else 0,
                "columnCount": len(self.df.columns) if self.df is not None else 0,
                "columns": columns,
                "statistics": statistics,
                "processingTimeMs": round(processing_time, 2)
            },
            "recommendations": recommendations,
            "insights": insights,
            "chartData": chart_data
        }, default=str)


# ═══════════════════════════════════════════════════════════════════════════
# PYODIDE INTERFACE
# ═══════════════════════════════════════════════════════════════════════════

def analyze_csv(csv_string: str) -> str:
    """
    Entry point for Pyodide.
    
    This function is called from JavaScript via Pyodide.
    
    Args:
        csv_string: Raw CSV content as string
        
    Returns:
        JSON string with analysis results
    """
    analyzer = PrismAnalytics()
    return analyzer.analyze(csv_string)


# For testing in standard Python environment
if __name__ == "__main__":
    # Sample test data
    test_csv = """date,category,sales,profit
2024-01-01,Electronics,1000,200
2024-01-02,Electronics,1200,250
2024-01-03,Clothing,800,150
2024-01-04,Clothing,750,140
2024-01-05,Electronics,1500,300
2024-01-06,Food,500,50
2024-01-07,Food,600,70
2024-01-08,Electronics,1300,280
2024-01-09,Clothing,900,180
2024-01-10,Food,550,60"""
    
    result = analyze_csv(test_csv)
    print(json.dumps(json.loads(result), indent=2))
