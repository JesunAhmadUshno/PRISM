/**
 * PRISM Type Definitions
 * 
 * Core type system for the analytics platform.
 * All types are designed with strict null safety.
 */

// ═══════════════════════════════════════════════════════════════════════════
// FILE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SupportedFileType = 'csv' | 'xlsx' | 'xml';

export interface FileMetadata {
  readonly name: string;
  readonly size: number;
  readonly type: SupportedFileType;
  readonly lastModified: number;
  readonly mimeType: string;
}

export interface FileValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly metadata?: FileMetadata;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DataType = 'numeric' | 'categorical' | 'datetime' | 'text' | 'boolean';

export interface ColumnInfo {
  readonly name: string;
  readonly dataType: DataType;
  readonly nullCount: number;
  readonly uniqueCount: number;
  readonly sampleValues: readonly unknown[];
}

export interface StatisticalSummary {
  readonly columnName: string;
  readonly dataType: DataType;
  readonly count: number;
  readonly nullCount: number;
  readonly uniqueCount: number;
  
  // Numeric-only fields
  readonly mean?: number;
  readonly median?: number;
  readonly stdDev?: number;
  readonly min?: number;
  readonly max?: number;
  readonly q1?: number;
  readonly q3?: number;
  
  // Categorical-only fields
  readonly mode?: string;
  readonly topValues?: readonly { value: string; count: number }[];
}

export interface DatasetSummary {
  readonly rowCount: number;
  readonly columnCount: number;
  readonly columns: readonly ColumnInfo[];
  readonly statistics: readonly StatisticalSummary[];
  readonly processingTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUALIZATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ChartType = 
  | 'line'
  | 'bar'
  | 'scatter'
  | 'pie'
  | 'area'
  | 'histogram'
  | 'boxplot'
  | 'heatmap';

export interface VisualizationRecommendation {
  readonly chartType: ChartType;
  readonly confidence: number; // 0-1
  readonly reason: string;
  readonly xAxis?: string;
  readonly yAxis?: string;
  readonly groupBy?: string;
  readonly metrics?: readonly string[];
}

export interface ChartDataPoint {
  readonly [key: string]: string | number | null;
}

export interface ChartConfig {
  readonly type: ChartType;
  readonly title: string;
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly data: readonly ChartDataPoint[];
  readonly colors?: readonly string[];
  readonly showLegend?: boolean;
  readonly showGrid?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI INSIGHT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type InsightType = 
  | 'trend'
  | 'outlier'
  | 'correlation'
  | 'distribution'
  | 'comparison'
  | 'summary';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface AIInsight {
  readonly id: string;
  readonly type: InsightType;
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly description: string;
  readonly affectedColumns: readonly string[];
  readonly confidence: number;
  readonly accessibleDescription: string; // Screen reader optimized
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESSING STATE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ProcessingStatus = 
  | 'idle'
  | 'validating'
  | 'parsing'
  | 'analyzing'
  | 'generating-insights'
  | 'complete'
  | 'error';

export interface ProcessingProgress {
  readonly status: ProcessingStatus;
  readonly progress: number; // 0-100
  readonly message: string;
  readonly accessibleMessage: string; // Screen reader optimized
}

export interface ProcessingError {
  readonly code: string;
  readonly message: string;
  readonly details?: string;
  readonly recoverable: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKER MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WorkerMessageType =
  | 'INIT'
  | 'PROCESS_FILE'
  | 'ANALYZE_DATA'
  | 'PROGRESS'
  | 'RESULT'
  | 'ERROR';

export interface WorkerMessage<T = unknown> {
  readonly type: WorkerMessageType;
  readonly payload: T;
  readonly timestamp: number;
  readonly id: string;
}

export interface WorkerInitPayload {
  readonly pyodideVersion: string;
}

export interface WorkerProcessPayload {
  readonly fileContent: string;
  readonly fileType: SupportedFileType;
  readonly fileName: string;
}

export interface WorkerResultPayload {
  readonly summary: DatasetSummary;
  readonly recommendations: readonly VisualizationRecommendation[];
  readonly insights: readonly AIInsight[];
  readonly chartData: readonly ChartConfig[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FontSize = 'normal' | 'large' | 'x-large';
export type ColorScheme = 'system' | 'light' | 'dark' | 'high-contrast';

export interface AccessibilitySettings {
  readonly fontSize: FontSize;
  readonly colorScheme: ColorScheme;
  readonly reducedMotion: boolean;
  readonly sonificationEnabled: boolean;
  readonly screenReaderMode: boolean;
}

export interface SonificationConfig {
  readonly minFrequency: number; // Hz
  readonly maxFrequency: number; // Hz
  readonly duration: number; // ms per data point
  readonly volume: number; // 0-1
}

// ═══════════════════════════════════════════════════════════════════════════
// APPLICATION STATE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PrismState {
  // File state
  file: {
    metadata: FileMetadata | null;
    content: string | null;
    validationStatus: 'pending' | 'valid' | 'invalid';
    validationError: string | null;
  };
  
  // Processing state
  processing: ProcessingProgress;
  error: ProcessingError | null;
  
  // Results state
  results: {
    summary: DatasetSummary | null;
    recommendations: readonly VisualizationRecommendation[];
    insights: readonly AIInsight[];
    chartConfigs: readonly ChartConfig[];
  };
  
  // UI state
  accessibility: AccessibilitySettings;
  activeChartIndex: number;
  
  // Actions
  setFile: (file: File) => Promise<void>;
  clearFile: () => void;
  processData: () => Promise<void>;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  setActiveChart: (index: number) => void;
  reset: () => void;
}
