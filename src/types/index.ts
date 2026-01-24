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
  | 'ERROR'
  | 'CUSTOM_ANALYSIS'
  | 'CUSTOM_ANALYSIS_RESULT';

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

// Multi-dataset support
export type JoinType = 'inner' | 'left' | 'right' | 'outer';

export interface Dataset {
  readonly id: string;
  readonly name: string;
  readonly metadata: FileMetadata;
  readonly content: string;
  readonly columns: readonly string[];
  readonly rowCount: number;
  readonly isActive: boolean;
}

export interface DatasetLink {
  readonly id: string;
  readonly leftDatasetId: string;
  readonly rightDatasetId: string;
  readonly leftColumn: string;
  readonly rightColumn: string;
  readonly joinType: JoinType;
}

export interface PrismState {
  // File state (legacy single file)
  file: {
    metadata: FileMetadata | null;
    content: string | null;
    validationStatus: 'pending' | 'valid' | 'invalid';
    validationError: string | null;
  };
  
  // Multi-dataset state
  datasets: Dataset[];
  datasetLinks: DatasetLink[];
  activeDatasetId: string | null;
  
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
  
  // Custom analysis results
  customAnalysisResults: CustomAnalysisResult | null;
  
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
  
  // Multi-dataset actions
  addDataset: (file: File) => Promise<void>;
  removeDataset: (id: string) => void;
  setActiveDataset: (id: string) => void;
  addDatasetLink: (link: Omit<DatasetLink, 'id'>) => void;
  removeDatasetLink: (id: string) => void;
  processLinkedDatasets: () => Promise<void>;
  
  // Custom analysis actions
  runCustomAnalysis: (config: CustomAnalysisConfig) => Promise<CustomAnalysisResult>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type StatisticalTestType =
  | 'one_sample_t'
  | 'independent_t'
  | 'paired_t'
  | 'one_way_anova'
  | 'two_way_anova'
  | 'chi_square_ind'
  | 'chi_square_gof'
  | 'fisher_exact'
  | 'mann_whitney'
  | 'wilcoxon'
  | 'kruskal_wallis'
  | 'pearson'
  | 'spearman'
  | 'linear_regression'
  | 'f_test'
  | 'levene'
  | 'shapiro_wilk';

export type PreprocessingOperation =
  | 'remove_nulls'
  | 'fill_mean'
  | 'fill_median'
  | 'fill_mode'
  | 'normalize'
  | 'standardize'
  | 'log_transform'
  | 'remove_outliers'
  | 'encode_categorical'
  | 'remove_duplicates';

export interface CustomAnalysisConfig {
  readonly type: 'statistical_test' | 'visualization' | 'preprocessing' | 'ml_model';
  readonly testId?: StatisticalTestType;
  readonly chartType?: ChartType;
  readonly operations?: PreprocessingOperation[];
  readonly columns?: string[];
  readonly modelType?: string;
  readonly targetColumn?: string;
  readonly parameters?: Record<string, unknown>;
}

export interface StatisticalTestResult {
  readonly testName: string;
  readonly statistic: number;
  readonly pValue: number;
  readonly degreesOfFreedom?: number;
  readonly confidenceInterval?: [number, number];
  readonly effectSize?: number;
  readonly interpretation: string;
  readonly significant: boolean;
}

export interface CustomAnalysisResult {
  readonly type: 'statistical_test' | 'visualization' | 'preprocessing' | 'ml_model';
  readonly success: boolean;
  readonly testResult?: StatisticalTestResult;
  readonly chartConfig?: ChartConfig;
  readonly preprocessedData?: string;
  readonly modelMetrics?: Record<string, number>;
  readonly error?: string;
}
