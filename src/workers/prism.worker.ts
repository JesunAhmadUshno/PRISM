/**
 * PRISM Web Worker - Pyodide Analytics Engine
 * 
 * Isolated execution environment for Python-based data analysis.
 * Runs in a dedicated thread to prevent UI blocking.
 * 
 * Security Features:
 * - Thread isolation via Web Worker
 * - No DOM access
 * - Structured Clone for message passing (no shared memory)
 * - WASM sandbox for Python execution
 * 
 * @security CRITICAL - All data processing happens here
 */

/// <reference lib="webworker" />

import type { 
  WorkerMessage, 
  WorkerProcessPayload, 
  WorkerResultPayload,
  ProcessingProgress 
} from '@/types';

// Pyodide types
declare const loadPyodide: () => Promise<PyodideInterface>;

interface PyodideInterface {
  loadPackage: (packages: string[]) => Promise<void>;
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
}

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
        
    def load_csv(self, csv_string):
        try:
            self.df = pd.read_csv(io.StringIO(csv_string), on_bad_lines='warn')
            self._detect_column_types()
            return {"success": True, "rows": len(self.df), "columns": len(self.df.columns)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
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
        
        if dtype == 'bool' or dtype == 'boolean':
            return DataType.BOOLEAN
        if pd.api.types.is_datetime64_any_dtype(dtype):
            return DataType.DATETIME
        if dtype == 'object':
            try:
                pd.to_datetime(series.dropna().head(100))
                return DataType.DATETIME
            except:
                pass
        if pd.api.types.is_numeric_dtype(dtype):
            if series.nunique() <= 10:
                return DataType.CATEGORICAL
            return DataType.NUMERIC
        if dtype == 'object' or dtype == 'category':
            if series.nunique() <= 20:
                return DataType.CATEGORICAL
            avg_len = series.dropna().astype(str).str.len().mean()
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
    
    def analyze(self, csv_string):
        import time
        start = time.time()
        result = self.load_csv(csv_string)
        if not result.get("success"):
            return json.dumps({"success": False, "error": result.get("error")})
        
        columns = self.get_column_info()
        statistics = self.compute_statistics()
        recommendations = self.recommend_visualizations()
        insights = self.generate_insights()
        
        chart_data = []
        for rec in recommendations[:3]:
            data = self.get_chart_data(rec['chartType'], rec.get('xAxis', ''), rec.get('yAxis'))
            if data:
                chart_data.append({
                    "type": rec['chartType'],
                    "title": f"{rec['chartType'].title()} Chart",
                    "xAxisLabel": rec.get('xAxis', ''),
                    "yAxisLabel": rec.get('yAxis', 'Count'),
                    "data": data
                })
        
        return json.dumps({
            "success": True,
            "summary": {
                "rowCount": len(self.df),
                "columnCount": len(self.df.columns),
                "columns": columns,
                "statistics": statistics,
                "processingTimeMs": round((time.time() - start) * 1000, 2)
            },
            "recommendations": recommendations,
            "insights": insights,
            "chartData": chart_data
        }, default=str)


def analyze_csv(csv_string):
    return PrismAnalytics().analyze(csv_string)
`;

// ═══════════════════════════════════════════════════════════════════════════
// WORKER STATE
// ═══════════════════════════════════════════════════════════════════════════

let pyodide: PyodideInterface | null = null;
let isInitialized = false;

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send progress update to main thread
 */
function sendProgress(progress: ProcessingProgress): void {
  self.postMessage({
    type: 'PROGRESS',
    payload: progress,
    timestamp: Date.now(),
    id: crypto.randomUUID()
  } satisfies WorkerMessage<ProcessingProgress>);
}

/**
 * Send result to main thread
 */
function sendResult(payload: WorkerResultPayload): void {
  self.postMessage({
    type: 'RESULT',
    payload,
    timestamp: Date.now(),
    id: crypto.randomUUID()
  } satisfies WorkerMessage<WorkerResultPayload>);
}

/**
 * Send error to main thread
 */
function sendError(error: string, code: string = 'UNKNOWN_ERROR'): void {
  self.postMessage({
    type: 'ERROR',
    payload: { code, message: error, recoverable: true },
    timestamp: Date.now(),
    id: crypto.randomUUID()
  } satisfies WorkerMessage);
}

/**
 * Initialize Pyodide runtime
 */
async function initializePyodide(): Promise<void> {
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
    // Import Pyodide from CDN
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

    // Load required packages
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
async function processFile(payload: WorkerProcessPayload): Promise<void> {
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
    // Set the CSV data in Python
    pyodide!.globals.set('csv_data', payload.fileContent);

    sendProgress({
      status: 'analyzing',
      progress: 50,
      message: 'Running statistical analysis...',
      accessibleMessage: 'Computing statistics and detecting patterns.'
    });

    // Run analysis
    const resultJson = await pyodide!.runPythonAsync('analyze_csv(csv_data)');
    const result = JSON.parse(resultJson as string);

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

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE LISTENER
// ═══════════════════════════════════════════════════════════════════════════

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'INIT':
        await initializePyodide();
        break;

      case 'PROCESS_FILE':
        await processFile(payload as WorkerProcessPayload);
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
