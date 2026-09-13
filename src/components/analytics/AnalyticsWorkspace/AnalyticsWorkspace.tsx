/**
 * PRISM Analytics Workspace
 * 
 * Professional-grade data analytics interface with:
 * - Custom visualization builder
 * - Data preprocessing tools
 * - Statistical tests with recommendations
 * - Descriptive, Diagnostic, Predictive, Prescriptive analytics
 * - ML model selection
 */

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { usePrismStore } from '@/stores/prismStore';
import type { StatisticalTestType, PreprocessingOperation, ChartType } from '@/types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type AnalyticsTab = 
  | 'overview' 
  | 'visualize' 
  | 'preprocess' 
  | 'statistics' 
  | 'analytics' 
  | 'models';

interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  uniqueCount: number;
  nullCount: number;
  sample: string[];
}

interface StatisticalTest {
  id: string;
  name: string;
  category: 'means' | 'proportions' | 'nonparametric' | 'correlation' | 'variance';
  description: string;
  dataRequirement: string;
  whenToUse: string;
}

interface AnalyticsMethod {
  id: string;
  name: string;
  category: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';
  description: string;
  techniques: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TableIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const CalculatorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const LightBulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart', icon: '📊', desc: 'Compare categories' },
  { id: 'line', name: 'Line Chart', icon: '📈', desc: 'Show trends over time' },
  { id: 'area', name: 'Area Chart', icon: '📉', desc: 'Cumulative trends' },
  { id: 'pie', name: 'Pie Chart', icon: '🥧', desc: 'Part-to-whole relationships' },
  { id: 'scatter', name: 'Scatter Plot', icon: '⚬', desc: 'Correlation between variables' },
  { id: 'histogram', name: 'Histogram', icon: '📶', desc: 'Distribution of values' },
  { id: 'box', name: 'Box Plot', icon: '📦', desc: 'Statistical distribution' },
  { id: 'heatmap', name: 'Heatmap', icon: '🗺️', desc: 'Correlation matrix' },
];

const STATISTICAL_TESTS: StatisticalTest[] = [
  // Means tests
  { id: 'one_sample_t', name: 'One-Sample t-Test', category: 'means', description: 'Compare sample mean to known value', dataRequirement: 'One numeric variable, n<30', whenToUse: 'Test if sample differs from population mean' },
  { id: 'independent_t', name: 'Independent t-Test', category: 'means', description: 'Compare means of two independent groups', dataRequirement: 'One numeric, one categorical (2 groups)', whenToUse: 'Compare two separate groups' },
  { id: 'paired_t', name: 'Paired t-Test', category: 'means', description: 'Compare means from same group at different times', dataRequirement: 'Two paired numeric variables', whenToUse: 'Before/after comparisons' },
  { id: 'one_way_anova', name: 'One-Way ANOVA', category: 'means', description: 'Compare means across 3+ groups', dataRequirement: 'One numeric, one categorical (3+ groups)', whenToUse: 'Compare multiple groups' },
  { id: 'two_way_anova', name: 'Two-Way ANOVA', category: 'means', description: 'Compare means with two factors', dataRequirement: 'One numeric, two categorical', whenToUse: 'Multiple factors affecting outcome' },
  
  // Proportions tests
  { id: 'chi_square_ind', name: 'Chi-Square Independence', category: 'proportions', description: 'Test association between categorical variables', dataRequirement: 'Two categorical variables', whenToUse: 'Check if variables are related' },
  { id: 'chi_square_gof', name: 'Chi-Square Goodness-of-Fit', category: 'proportions', description: 'Check if data fits expected distribution', dataRequirement: 'One categorical variable', whenToUse: 'Compare to expected frequencies' },
  { id: 'fisher_exact', name: "Fisher's Exact Test", category: 'proportions', description: 'Chi-square alternative for small samples', dataRequirement: 'Two categorical, small n', whenToUse: 'Small sample categorical comparison' },
  
  // Non-parametric tests
  { id: 'mann_whitney', name: 'Mann-Whitney U Test', category: 'nonparametric', description: 'Non-parametric independent t-test', dataRequirement: 'One numeric (non-normal), two groups', whenToUse: 'Compare two groups, non-normal data' },
  { id: 'wilcoxon', name: 'Wilcoxon Signed-Rank', category: 'nonparametric', description: 'Non-parametric paired t-test', dataRequirement: 'Two paired numeric (non-normal)', whenToUse: 'Paired comparison, non-normal data' },
  { id: 'kruskal_wallis', name: 'Kruskal-Wallis Test', category: 'nonparametric', description: 'Non-parametric ANOVA', dataRequirement: 'One numeric (non-normal), 3+ groups', whenToUse: 'Compare 3+ groups, non-normal' },
  
  // Correlation tests
  { id: 'pearson', name: 'Pearson Correlation', category: 'correlation', description: 'Linear relationship between continuous variables', dataRequirement: 'Two numeric variables (normal)', whenToUse: 'Measure linear association' },
  { id: 'spearman', name: 'Spearman Correlation', category: 'correlation', description: 'Rank-based correlation', dataRequirement: 'Two numeric or ordinal variables', whenToUse: 'Non-linear or ordinal relationships' },
  { id: 'linear_regression', name: 'Linear Regression', category: 'correlation', description: 'Predict outcome from predictors', dataRequirement: 'One+ numeric predictors, numeric outcome', whenToUse: 'Predict continuous outcome' },
  
  // Variance tests
  { id: 'f_test', name: 'F-Test', category: 'variance', description: 'Compare variances of two groups', dataRequirement: 'Two numeric variables', whenToUse: 'Test equality of variances' },
  { id: 'levene', name: "Levene's Test", category: 'variance', description: 'Test homogeneity of variance', dataRequirement: 'One numeric, one categorical', whenToUse: 'Check ANOVA assumptions' },
  { id: 'shapiro_wilk', name: 'Shapiro-Wilk Test', category: 'variance', description: 'Test for normality', dataRequirement: 'One numeric variable', whenToUse: 'Check if data is normally distributed' },
];

const ANALYTICS_METHODS: AnalyticsMethod[] = [
  { id: 'descriptive', name: 'Descriptive Analytics', category: 'descriptive', description: 'What happened? Summarize and describe data patterns.', techniques: ['Mean, Median, Mode', 'Standard Deviation', 'Frequency Distribution', 'Histograms & Charts', 'KPI Tracking', 'Cohort Analysis'] },
  { id: 'diagnostic', name: 'Diagnostic Analytics', category: 'diagnostic', description: 'Why did it happen? Identify causes and relationships.', techniques: ['Correlation Analysis', 'Root Cause Analysis', 'Drill-down Analysis', 'ANOVA', '5 Whys Method', 'Fishbone Diagrams'] },
  { id: 'predictive', name: 'Predictive Analytics', category: 'predictive', description: 'What will happen? Forecast future outcomes.', techniques: ['Linear Regression', 'Time Series Forecasting', 'Classification Models', 'Clustering', 'Decision Trees', 'Neural Networks'] },
  { id: 'prescriptive', name: 'Prescriptive Analytics', category: 'prescriptive', description: 'What should we do? Recommend optimal actions.', techniques: ['Optimization Models', 'Monte Carlo Simulation', 'A/B Testing', 'Recommendation Engines', 'Decision Analysis', 'Scenario Planning'] },
];

const ML_MODELS = [
  { id: 'linear_reg', name: 'Linear Regression', type: 'regression', desc: 'Predict continuous values', useCase: 'Sales forecasting, price prediction' },
  { id: 'logistic_reg', name: 'Logistic Regression', type: 'classification', desc: 'Binary classification', useCase: 'Churn prediction, spam detection' },
  { id: 'decision_tree', name: 'Decision Tree', type: 'both', desc: 'Tree-based decisions', useCase: 'Customer segmentation, risk assessment' },
  { id: 'random_forest', name: 'Random Forest', type: 'both', desc: 'Ensemble of trees', useCase: 'Feature importance, robust predictions' },
  { id: 'kmeans', name: 'K-Means Clustering', type: 'clustering', desc: 'Group similar items', useCase: 'Customer segments, anomaly detection' },
  { id: 'pca', name: 'PCA', type: 'dimensionality', desc: 'Reduce dimensions', useCase: 'Feature reduction, visualization' },
  { id: 'time_series', name: 'Time Series', type: 'forecasting', desc: 'Temporal patterns', useCase: 'Demand forecasting, trend analysis' },
];

const TAB_ORDER: AnalyticsTab[] = [
  'overview',
  'visualize',
  'preprocess',
  'statistics',
  'analytics',
  'models',
];

const PREPROCESSING_OPTIONS = [
  { id: 'remove_nulls', name: 'Remove Null Values', desc: 'Drop rows with missing data' },
  { id: 'fill_mean', name: 'Fill with Mean', desc: 'Replace nulls with column mean' },
  { id: 'fill_median', name: 'Fill with Median', desc: 'Replace nulls with column median' },
  { id: 'fill_mode', name: 'Fill with Mode', desc: 'Replace nulls with most frequent value' },
  { id: 'normalize', name: 'Normalize (0-1)', desc: 'Scale values between 0 and 1' },
  { id: 'standardize', name: 'Standardize (Z-score)', desc: 'Transform to mean=0, std=1' },
  { id: 'log_transform', name: 'Log Transform', desc: 'Apply logarithmic transformation' },
  { id: 'remove_outliers', name: 'Remove Outliers', desc: 'Remove values beyond 3 std deviations' },
  { id: 'encode_categorical', name: 'Encode Categorical', desc: 'Convert categories to numbers' },
  { id: 'remove_duplicates', name: 'Remove Duplicates', desc: 'Drop duplicate rows' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tabId: AnalyticsTab;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, tabId }) => (
  <button
    type="button"
    role="tab"
    id={`analytics-tab-${tabId}`}
    aria-selected={active}
    aria-controls={`analytics-panel-${tabId}`}
    aria-label={label}
    tabIndex={active ? 0 : -1}
    onClick={onClick}
    className={clsx(
      'flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200',
      active 
        ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg shadow-prism-500/30' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

interface RecommendationCardProps {
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  action?: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ title, description, confidence, action }) => (
  <div className="glass-card p-4 border-l-4 border-prism-500">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <SparklesIcon />
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            confidence === 'high' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
            confidence === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
            confidence === 'low' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          )}>
            {confidence} confidence
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {action && (
        <button onClick={action} className="btn-primary text-sm px-3 py-1.5">
          <PlayIcon />
          Run
        </button>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AnalyticsWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [selectedPreprocessing, setSelectedPreprocessing] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [preprocessingResults, setPreprocessingResults] = useState<any>(null);
  const [visualizationResults, setVisualizationResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const results = usePrismStore(state => state.results);
  const runAnalysis = usePrismStore(state => state.runCustomAnalysis);

  // Extract column information from results
  const columns: ColumnInfo[] = useMemo(() => {
    if (!results.summary?.statistics) return [];
    return results.summary.statistics.map(stat => ({
      name: stat.columnName,
      type: stat.dataType === 'numeric' ? 'numeric' : 
            stat.dataType === 'datetime' ? 'datetime' : 'categorical',
      uniqueCount: stat.uniqueCount,
      nullCount: stat.nullCount,
      sample: [],
    }));
  }, [results.summary]);

  const numericColumns = columns.filter(c => c.type === 'numeric');
  const categoricalColumns = columns.filter(c => c.type === 'categorical');

  // Generate test recommendations based on selected columns
  const testRecommendations = useMemo(() => {
    const recommendations: { test: StatisticalTest; confidence: 'high' | 'medium' | 'low'; reason: string }[] = [];
    
    const selectedNumeric = selectedColumns.filter(c => 
      columns.find(col => col.name === c)?.type === 'numeric'
    );
    const selectedCategorical = selectedColumns.filter(c => 
      columns.find(col => col.name === c)?.type === 'categorical'
    );

    if (selectedNumeric.length === 1 && selectedCategorical.length === 0) {
      recommendations.push({
        test: STATISTICAL_TESTS.find(t => t.id === 'shapiro_wilk')!,
        confidence: 'high',
        reason: 'Check if your numeric data follows a normal distribution'
      });
      recommendations.push({
        test: STATISTICAL_TESTS.find(t => t.id === 'one_sample_t')!,
        confidence: 'medium',
        reason: 'Compare your sample mean against a hypothetical value'
      });
    }

    if (selectedNumeric.length === 1 && selectedCategorical.length === 1) {
      const catCol = columns.find(c => c.name === selectedCategorical[0]);
      if (catCol && catCol.uniqueCount === 2) {
        recommendations.push({
          test: STATISTICAL_TESTS.find(t => t.id === 'independent_t')!,
          confidence: 'high',
          reason: 'Compare means between your two groups'
        });
        recommendations.push({
          test: STATISTICAL_TESTS.find(t => t.id === 'mann_whitney')!,
          confidence: 'medium',
          reason: 'Use if data is not normally distributed'
        });
      } else if (catCol && catCol.uniqueCount > 2) {
        recommendations.push({
          test: STATISTICAL_TESTS.find(t => t.id === 'one_way_anova')!,
          confidence: 'high',
          reason: 'Compare means across multiple groups'
        });
        recommendations.push({
          test: STATISTICAL_TESTS.find(t => t.id === 'kruskal_wallis')!,
          confidence: 'medium',
          reason: 'Use if data is not normally distributed'
        });
      }
    }

    if (selectedNumeric.length === 2 && selectedCategorical.length === 0) {
      recommendations.push({
        test: STATISTICAL_TESTS.find(t => t.id === 'pearson')!,
        confidence: 'high',
        reason: 'Measure linear correlation between variables'
      });
      recommendations.push({
        test: STATISTICAL_TESTS.find(t => t.id === 'linear_regression')!,
        confidence: 'high',
        reason: 'Predict one variable from the other'
      });
      recommendations.push({
        test: STATISTICAL_TESTS.find(t => t.id === 'spearman')!,
        confidence: 'medium',
        reason: 'Use for non-linear relationships'
      });
    }

    if (selectedCategorical.length === 2 && selectedNumeric.length === 0) {
      recommendations.push({
        test: STATISTICAL_TESTS.find(t => t.id === 'chi_square_ind')!,
        confidence: 'high',
        reason: 'Test if the two categorical variables are associated'
      });
    }

    return recommendations;
  }, [selectedColumns, columns]);

  // Color palette for charts
  const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'
  ];

  // Render chart based on type and data
  const renderChart = (chartData: any) => {
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return <div className="flex items-center justify-center h-full text-slate-500">No data available</div>;
    }

    const { chartType, data, xAxisLabel, yAxisLabel } = chartData;

    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="category" tick={{ fill: '#9ca3af' }} />
            <YAxis tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Legend />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="x" tick={{ fill: '#9ca3af' }} />
            <YAxis tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="x" tick={{ fill: '#9ca3af' }} />
            <YAxis tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Legend />
            <Area type="monotone" dataKey="y" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            />
            <Legend />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="x" name={xAxisLabel} tick={{ fill: '#9ca3af' }} />
            <YAxis dataKey="y" name={yAxisLabel} tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            />
            <Legend />
            <Scatter name="Data Points" data={data} fill="#6366f1" />
          </ScatterChart>
        );

      case 'histogram':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="bin" tick={{ fill: '#9ca3af', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'box':
        // Box plot representation using bar chart with error indicators
        const boxData = data[0];
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-3">
              <h5 className="font-semibold text-slate-900 dark:text-white">{boxData?.name} Statistics</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Min</span>
                  <p className="font-mono font-semibold">{boxData?.min?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Q1</span>
                  <p className="font-mono font-semibold">{boxData?.q1?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-prism-100 dark:bg-prism-900/50 rounded-lg border border-prism-300 dark:border-prism-700">
                  <span className="text-prism-600 dark:text-prism-400">Median</span>
                  <p className="font-mono font-semibold text-prism-700 dark:text-prism-300">{boxData?.median?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-prism-100 dark:bg-prism-900/50 rounded-lg border border-prism-300 dark:border-prism-700">
                  <span className="text-prism-600 dark:text-prism-400">Mean</span>
                  <p className="font-mono font-semibold text-prism-700 dark:text-prism-300">{boxData?.mean?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Q3</span>
                  <p className="font-mono font-semibold">{boxData?.q3?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Max</span>
                  <p className="font-mono font-semibold">{boxData?.max?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'heatmap':
        // Correlation heatmap as a grid
        const uniqueVars = [...new Set(data.map((d: any) => d.x))] as string[];
        return (
          <div className="overflow-auto h-full">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Correlation matrix. Each cell holds the correlation coefficient between the variable named in its row header and the variable named in its column header.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2 text-left text-slate-500"><span className="sr-only">Variable</span></th>
                  {uniqueVars.map((v) => (
                    <th key={v} scope="col" title={v} className="p-2 text-center text-slate-600 dark:text-slate-300 font-medium text-xs">
                      {v.slice(0, 8)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueVars.map((row) => (
                  <tr key={row}>
                    <th scope="row" title={row} className="p-2 text-left text-slate-600 dark:text-slate-300 font-medium text-xs">{row.slice(0, 8)}</th>
                    {uniqueVars.map((col) => {
                      const cell = data.find((d: any) => d.x === row && d.y === col);
                      const value = cell?.value ?? 0;
                      const intensity = Math.abs(value);
                      const bgColor = value >= 0 
                        ? `rgba(99, 102, 241, ${intensity})` 
                        : `rgba(239, 68, 68, ${intensity})`;
                      return (
                        <td 
                          key={`${row}-${col}`} 
                          className="p-2 text-center text-xs font-mono"
                          style={{ backgroundColor: bgColor, color: intensity > 0.5 ? 'white' : 'inherit' }}
                          title={`${row} vs ${col}: ${value.toFixed(3)}`}
                        >
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <div className="flex items-center justify-center h-full text-slate-500">Unsupported chart type: {chartType}</div>;
    }
  };

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnName) 
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const handleRunTest = async (testId: string) => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column for the test');
      return;
    }
    
    setIsRunning(true);
    setSelectedTest(testId);
    setTestResults(null);
    
    try {
      const result = await runAnalysis({
        type: 'statistical_test',
        testId: testId as StatisticalTestType,
        columns: selectedColumns,
      });
      console.log('Test result:', result);
      setTestResults(result);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ success: false, error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateVisualization = async () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column');
      return;
    }
    
    setIsRunning(true);
    setVisualizationResults(null);
    try {
      const result = await runAnalysis({
        type: 'visualization',
        chartType: selectedChartType as ChartType,
        columns: selectedColumns,
      });
      console.log('Visualization result:', result);
      setVisualizationResults(result);
    } catch (error) {
      console.error('Visualization failed:', error);
      setVisualizationResults({ success: false, error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunPreprocessing = async () => {
    if (selectedPreprocessing.length === 0) {
      alert('Please select at least one preprocessing operation');
      return;
    }
    
    setIsRunning(true);
    setPreprocessingResults(null);
    try {
      const config: { 
        type: 'preprocessing'; 
        operations: PreprocessingOperation[]; 
        columns?: string[];
      } = {
        type: 'preprocessing',
        operations: selectedPreprocessing as PreprocessingOperation[],
      };
      if (selectedColumns.length > 0) {
        config.columns = selectedColumns;
      }
      const result = await runAnalysis(config);
      setPreprocessingResults(result);
    } catch (error) {
      console.error('Preprocessing failed:', error);
      setPreprocessingResults({ success: false, error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % TAB_ORDER.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = TAB_ORDER.length - 1;
        break;
      default:
        return;
    }

    const nextTab = TAB_ORDER[nextIndex];
    if (!nextTab) return;

    event.preventDefault();
    setActiveTab(nextTab);
    document.getElementById(`analytics-tab-${nextTab}`)?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      {/*
        The roving-focus key handler lives on the tablist container: keydown
        bubbles up from whichever tab currently holds focus (ARIA APG pattern).
        Because the container itself carries a keyboard handler it must also be
        focusable -- tabIndex={-1} makes it programmatically focusable without
        introducing a second tab stop, keeping the tablist a single tab stop.
      */}
      <div
        role="tablist"
        aria-label="Analytics sections"
        aria-orientation="horizontal"
        tabIndex={-1}
        onKeyDown={handleTabKeyDown}
        className="flex flex-wrap gap-2 p-2 glass-card"
      >
        <TabButton 
          tabId="overview"
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
          icon={<TableIcon />}
          label="Data Overview"
        />
        <TabButton 
          tabId="visualize"
          active={activeTab === 'visualize'} 
          onClick={() => setActiveTab('visualize')}
          icon={<ChartBarIcon />}
          label="Visualize"
        />
        <TabButton 
          tabId="preprocess"
          active={activeTab === 'preprocess'} 
          onClick={() => setActiveTab('preprocess')}
          icon={<BeakerIcon />}
          label="Preprocess"
        />
        <TabButton 
          tabId="statistics"
          active={activeTab === 'statistics'} 
          onClick={() => setActiveTab('statistics')}
          icon={<CalculatorIcon />}
          label="Statistics"
        />
        <TabButton 
          tabId="analytics"
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')}
          icon={<LightBulbIcon />}
          label="Analytics"
        />
        <TabButton 
          tabId="models"
          active={activeTab === 'models'} 
          onClick={() => setActiveTab('models')}
          icon={<CubeIcon />}
          label="ML Models"
        />
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {/* ═══════════════════════════════════════════════════════════════════
            DATA OVERVIEW TAB
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div
            role="tabpanel"
            id="analytics-panel-overview"
            aria-labelledby="analytics-tab-overview"
            tabIndex={0}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TableIcon />
                Dataset Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                  <span className="stat-value">{results.summary?.rowCount.toLocaleString() || 0}</span>
                  <span className="stat-label">Total Rows</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{results.summary?.columnCount || 0}</span>
                  <span className="stat-label">Total Columns</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{numericColumns.length}</span>
                  <span className="stat-label">Numeric Columns</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{categoricalColumns.length}</span>
                  <span className="stat-label">Categorical Columns</span>
                </div>
              </div>
            </div>

            {/* Column Details */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Column Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">
                    Column details: data type, unique value count, missing value count, mean and standard deviation for every column in the dataset.
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th scope="col" className="text-left p-3 font-medium">Column</th>
                      <th scope="col" className="text-left p-3 font-medium">Type</th>
                      <th scope="col" className="text-right p-3 font-medium">Unique</th>
                      <th scope="col" className="text-right p-3 font-medium">Missing</th>
                      <th scope="col" className="text-right p-3 font-medium">Mean</th>
                      <th scope="col" className="text-right p-3 font-medium">Std Dev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.summary?.statistics?.map((stat) => (
                      <tr key={stat.columnName} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <th scope="row" className="text-left p-3 font-medium">{stat.columnName}</th>
                        <td className="p-3">
                          <span className={clsx(
                            'badge-primary',
                            stat.dataType === 'numeric' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
                            stat.dataType === 'categorical' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
                            stat.dataType === 'datetime' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                          )}>
                            {stat.dataType}
                          </span>
                        </td>
                        <td className="p-3 text-right">{stat.uniqueCount.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span className={stat.nullCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                            {stat.nullCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-right">{stat.mean?.toFixed(2) ?? '-'}</td>
                        <td className="p-3 text-right">{stat.stdDev?.toFixed(2) ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auto-generated Insights */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <SparklesIcon />
                Quick Insights
              </h3>
              <div className="grid gap-3">
                {numericColumns.length >= 2 && (
                  <RecommendationCard
                    title="Correlation Analysis Available"
                    description={`You have ${numericColumns.length} numeric columns. Explore relationships between them using correlation analysis.`}
                    confidence="high"
                  />
                )}
                {categoricalColumns.length > 0 && numericColumns.length > 0 && (
                  <RecommendationCard
                    title="Group Comparison Possible"
                    description={`Compare numeric values across categorical groups using t-tests or ANOVA.`}
                    confidence="high"
                  />
                )}
                {results.summary?.statistics?.some(s => s.nullCount > 0) && (
                  <RecommendationCard
                    title="Missing Data Detected"
                    description="Some columns have missing values. Consider using preprocessing to handle them."
                    confidence="medium"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VISUALIZE TAB
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'visualize' && (
          <div
            role="tabpanel"
            id="analytics-panel-visualize"
            aria-labelledby="analytics-tab-visualize"
            tabIndex={0}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Column Selection */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Select Columns</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {columns.map((col) => (
                  <label
                    key={col.name}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                      selectedColumns.includes(col.name)
                        ? 'bg-prism-100 dark:bg-prism-900/50 border border-prism-300 dark:border-prism-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.name)}
                      onChange={() => handleColumnToggle(col.name)}
                      className="w-4 h-4 rounded border-slate-300 text-prism-600 focus:ring-prism-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{col.name}</span>
                      <span className={clsx(
                        'text-xs',
                        col.type === 'numeric' && 'text-blue-600 dark:text-blue-400',
                        col.type === 'categorical' && 'text-purple-600 dark:text-purple-400'
                      )}>
                        {col.type}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Chart Type Selection */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Chart Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {CHART_TYPES.map((chart) => (
                  <button
                    key={chart.id}
                    onClick={() => setSelectedChartType(chart.id)}
                    className={clsx(
                      'p-3 rounded-xl text-left transition-all',
                      selectedChartType === chart.id
                        ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="text-xl">{chart.icon}</span>
                    <p className="font-medium text-sm mt-1">{chart.name}</p>
                    <p className={clsx(
                      'text-xs mt-0.5',
                      selectedChartType === chart.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                    )}>
                      {chart.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview & Create */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Chart Title</label>
                  <input
                    type="text"
                    placeholder="Enter chart title..."
                    className="input"
                  />
                </div>

                {selectedColumns.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-sm font-medium mb-2">Selected:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedColumns.map(col => (
                        <span key={col} className="badge-primary">{col}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateVisualization}
                  disabled={selectedColumns.length === 0 || isRunning}
                  className="btn-primary w-full"
                >
                  {isRunning ? 'Creating...' : 'Create Visualization'}
                </button>

                {/* Smart Recommendations */}
                {selectedColumns.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <LightBulbIcon />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Suggestion</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          {selectedColumns.length === 1 && columns.find(c => c.name === selectedColumns[0])?.type === 'numeric'
                            ? 'Use a Histogram to see the distribution of values.'
                            : selectedColumns.length === 2 && columns.filter(c => selectedColumns.includes(c.name)).every(c => c.type === 'numeric')
                            ? 'Use a Scatter Plot to visualize the relationship between these variables.'
                            : selectedColumns.length === 1 && columns.find(c => c.name === selectedColumns[0])?.type === 'categorical'
                            ? 'Use a Bar Chart or Pie Chart to show category frequencies.'
                            : 'Select columns to get visualization recommendations.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visualization Running State */}
                {isRunning && activeTab === 'visualize' && (
                  <div role="status" aria-live="polite" className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-prism-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Creating visualization...</span>
                    </div>
                  </div>
                )}

                {/* Visualization Results */}
                {visualizationResults && !isRunning && (
                  <div role="status" aria-live="polite" aria-atomic="true" className="mt-4">
                    {visualizationResults.success === false ? (
                      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-400 font-medium">Visualization Failed</p>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{visualizationResults.error || 'Unknown error'}</p>
                      </div>
                    ) : (
                      <div className="glass-card p-6">
                        <h4 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                          {visualizationResults.title || 'Chart'}
                        </h4>
                        <div className="w-full h-[400px] bg-white dark:bg-slate-800 rounded-xl p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart(visualizationResults)}
                          </ResponsiveContainer>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                          Generated from: {selectedColumns.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PREPROCESS TAB
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'preprocess' && (
          <div
            role="tabpanel"
            id="analytics-panel-preprocess"
            aria-labelledby="analytics-tab-preprocess"
            tabIndex={0}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Preprocessing Options */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BeakerIcon />
                Data Preprocessing
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Clean and transform your data before analysis.
              </p>
              
              <div className="space-y-3">
                {PREPROCESSING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={clsx(
                      'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors',
                      selectedPreprocessing.includes(option.id)
                        ? 'bg-prism-100 dark:bg-prism-900/50 border border-prism-300 dark:border-prism-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPreprocessing.includes(option.id)}
                      onChange={() => setSelectedPreprocessing(prev =>
                        prev.includes(option.id)
                          ? prev.filter(p => p !== option.id)
                          : [...prev, option.id]
                      )}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-prism-600 focus:ring-prism-500"
                    />
                    <div>
                      <span className="font-medium">{option.name}</span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleRunPreprocessing}
                disabled={selectedPreprocessing.length === 0 || isRunning}
                className="btn-primary w-full mt-6"
              >
                {isRunning ? 'Processing...' : 'Apply Preprocessing'}
              </button>
            </div>

            {/* Column Selection for Preprocessing */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Apply to Columns</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Select specific columns or leave empty to apply to all applicable columns.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {columns.map((col) => (
                    <label
                      key={col.name}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.name)}
                        onChange={() => handleColumnToggle(col.name)}
                        className="w-4 h-4 rounded border-slate-300 text-prism-600"
                      />
                      <span className="flex-1">{col.name}</span>
                      <span className="text-xs text-slate-500">{col.type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Quality Report */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Data Quality Report</h3>
                <div className="space-y-3">
                  {results.summary?.statistics?.map((stat) => (
                    <div key={stat.columnName} className="flex items-center justify-between">
                      <span className="font-medium truncate">{stat.columnName}</span>
                      <div className="flex items-center gap-2">
                        {stat.nullCount === 0 ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
                            <CheckIcon /> Complete
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-sm">
                            {stat.nullCount} missing
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preprocessing Results */}
              {isRunning && activeTab === 'preprocess' && (
                <div role="status" aria-live="polite" className="glass-card p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                      <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-prism-500 border-t-transparent animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Applying preprocessing...</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
                    </div>
                  </div>
                </div>
              )}

              {preprocessingResults && !isRunning && (
                <div role="status" aria-live="polite" aria-atomic="true" className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckIcon />
                    Preprocessing Results
                  </h3>
                  {preprocessingResults.success === false ? (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-red-700 dark:text-red-400 font-medium">Preprocessing Failed</p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{preprocessingResults.error || 'Unknown error occurred'}</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">✓ Preprocessing Complete</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                        Data has been preprocessed with: {selectedPreprocessing.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STATISTICS TAB
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'statistics' && (
          <div
            role="tabpanel"
            id="analytics-panel-statistics"
            aria-labelledby="analytics-tab-statistics"
            tabIndex={0}
            className="space-y-6"
          >
            {/* Column Selection */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">1. Select Variables</h3>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => handleColumnToggle(col.name)}
                    className={clsx(
                      'px-4 py-2 rounded-xl font-medium transition-all',
                      selectedColumns.includes(col.name)
                        ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {col.name}
                    <span className={clsx(
                      'ml-2 text-xs px-1.5 py-0.5 rounded',
                      selectedColumns.includes(col.name) ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                    )}>
                      {col.type === 'numeric' ? 'N' : 'C'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {testRecommendations.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <SparklesIcon />
                  2. Recommended Tests
                </h3>
                <div className="grid gap-4">
                  {testRecommendations.map(({ test, confidence, reason }) => (
                    <div
                      key={test.id}
                      className={clsx(
                        'p-4 rounded-xl border-2 transition-all cursor-pointer',
                        selectedTest === test.id
                          ? 'border-prism-500 bg-prism-50 dark:bg-prism-900/30'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                      onClick={() => setSelectedTest(test.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{test.name}</h4>
                            <span className={clsx(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              confidence === 'high' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
                              confidence === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                            )}>
                              {confidence} match
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{reason}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunTest(test.id);
                          }}
                          disabled={isRunning}
                          className="btn-primary text-sm px-4"
                        >
                          Run Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Statistical Tests */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">All Statistical Tests</h3>
              
              {(['means', 'proportions', 'nonparametric', 'correlation', 'variance'] as const).map((category) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 capitalize">
                    {category === 'means' && '📊 Tests for Comparing Means'}
                    {category === 'proportions' && '📈 Tests for Proportions'}
                    {category === 'nonparametric' && '📉 Non-Parametric Tests'}
                    {category === 'correlation' && '🔗 Correlation & Regression'}
                    {category === 'variance' && '📐 Variance & Distribution'}
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STATISTICAL_TESTS.filter(t => t.category === category).map((test) => (
                      <button
                        key={test.id}
                        onClick={() => setSelectedTest(test.id)}
                        className={clsx(
                          'p-3 rounded-xl text-left transition-all',
                          selectedTest === test.id
                            ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                        )}
                      >
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className={clsx(
                          'text-xs mt-1',
                          selectedTest === test.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                        )}>
                          {test.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Test Details Panel */}
            {selectedTest && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Test Details</h3>
                {(() => {
                  const test = STATISTICAL_TESTS.find(t => t.id === selectedTest);
                  if (!test) return null;
                  return (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-slate-600 dark:text-slate-400">{test.description}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Requirement</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{test.dataRequirement}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">When to Use</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{test.whenToUse}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRunTest(test.id)}
                        disabled={selectedColumns.length === 0 || isRunning}
                        className="btn-primary"
                      >
                        {isRunning ? 'Running...' : `Run ${test.name}`}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Running State */}
            {isRunning && (
              <div role="status" aria-live="polite" className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-prism-500 border-t-transparent animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Running analysis...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment for the first statistical test (loading scipy).</p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults && !isRunning && (
              <div role="status" aria-live="polite" aria-atomic="true" className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckIcon />
                  Test Results
                </h3>
                {testResults.success === false ? (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-400 font-medium">Test Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{testResults.error || 'Unknown error occurred'}</p>
                  </div>
                ) : testResults.testResult ? (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="stat-card">
                        <span className="stat-value">{testResults.testResult.statistic?.toFixed(4) || '-'}</span>
                        <span className="stat-label">Test Statistic</span>
                      </div>
                      <div className="stat-card">
                        <span className={clsx(
                          'stat-value',
                          testResults.testResult.pValue < 0.05 && 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {testResults.testResult.pValue?.toFixed(4) || '-'}
                        </span>
                        <span className="stat-label">P-Value</span>
                      </div>
                      <div className="stat-card">
                        <span className={clsx(
                          'stat-value',
                          testResults.testResult.significant ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        )}>
                          {testResults.testResult.significant ? '✓ Significant' : '✗ Not Significant'}
                        </span>
                        <span className="stat-label">At α = 0.05</span>
                      </div>
                    </div>
                    {testResults.testResult.degreesOfFreedom != null && (
                      <div className="stat-card inline-block">
                        <span className="stat-value">{testResults.testResult.degreesOfFreedom}</span>
                        <span className="stat-label">Degrees of Freedom</span>
                      </div>
                    )}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <h4 className="font-medium mb-2">Interpretation</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {testResults.testResult.interpretation || 'Results have been calculated.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-slate-600 dark:text-slate-400">Analysis completed but no detailed results available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ANALYTICS TAB
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div
            role="tabpanel"
            id="analytics-panel-analytics"
            aria-labelledby="analytics-tab-analytics"
            tabIndex={0}
            className="space-y-6"
          >
            {/* Analytics Types */}
            <div className="grid md:grid-cols-2 gap-6">
              {ANALYTICS_METHODS.map((method) => (
                <div key={method.id} className={clsx(
                  'glass-card p-6 border-l-4',
                  method.category === 'descriptive' && 'border-blue-500',
                  method.category === 'diagnostic' && 'border-amber-500',
                  method.category === 'predictive' && 'border-emerald-500',
                  method.category === 'prescriptive' && 'border-purple-500'
                )}>
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      'p-3 rounded-xl',
                      method.category === 'descriptive' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
                      method.category === 'diagnostic' && 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
                      method.category === 'predictive' && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
                      method.category === 'prescriptive' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                    )}>
                      {method.category === 'descriptive' && <TableIcon />}
                      {method.category === 'diagnostic' && <BeakerIcon />}
                      {method.category === 'predictive' && <ChartBarIcon />}
                      {method.category === 'prescriptive' && <LightBulbIcon />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{method.name}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{method.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {method.techniques.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <button className="btn-secondary text-sm mt-4">
                        <PlayIcon />
                        Run Analysis
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Analysis Methods */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Business Analysis Tools</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'SWOT Analysis', desc: 'Strengths, Weaknesses, Opportunities, Threats', icon: '🎯' },
                  { name: 'RFM Analysis', desc: 'Recency, Frequency, Monetary segmentation', icon: '👥' },
                  { name: 'Cohort Analysis', desc: 'Track behavior over time', icon: '📊' },
                  { name: 'Market Basket', desc: 'Association rule mining', icon: '🛒' },
                ].map((tool) => (
                  <button
                    key={tool.name}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-2xl">{tool.icon}</span>
                    <h4 className="font-medium mt-2">{tool.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tool.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Measures & Metrics</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Central Tendency</h4>
                  <div className="space-y-2">
                    {['Mean (Average)', 'Median (Middle)', 'Mode (Most Frequent)'].map((m) => (
                      <div key={m} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <CheckIcon />
                        <span className="text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Dispersion</h4>
                  <div className="space-y-2">
                    {['Range', 'Variance', 'Standard Deviation', 'IQR'].map((m) => (
                      <div key={m} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <CheckIcon />
                        <span className="text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ML MODELS TAB
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'models' && (
          <div
            role="tabpanel"
            id="analytics-panel-models"
            aria-labelledby="analytics-tab-models"
            tabIndex={0}
            className="space-y-6"
          >
            {/* Model Selection */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CubeIcon />
                Machine Learning Models
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Select a model type based on your analysis goal.
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ML_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{model.name}</h4>
                      <span className={clsx(
                        'px-2 py-0.5 text-xs rounded-full',
                        model.type === 'regression' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
                        model.type === 'classification' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
                        model.type === 'clustering' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
                        model.type === 'both' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
                        model.type === 'dimensionality' && 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400',
                        model.type === 'forecasting' && 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400'
                      )}>
                        {model.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{model.desc}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      <strong>Use case:</strong> {model.useCase}
                    </p>
                    <button className="btn-secondary text-sm w-full mt-4">
                      Configure Model
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Configuration Workflow */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Model Building Workflow</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {[
                  { step: 1, name: 'Select Features', icon: '📊' },
                  { step: 2, name: 'Choose Target', icon: '🎯' },
                  { step: 3, name: 'Train Model', icon: '⚙️' },
                  { step: 4, name: 'Evaluate', icon: '📈' },
                  { step: 5, name: 'Predict', icon: '🔮' },
                ].map((item, index) => (
                  <React.Fragment key={item.step}>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <span className="text-xs text-slate-500">Step {item.step}</span>
                        <p className="font-medium text-sm">{item.name}</p>
                      </div>
                    </div>
                    {index < 4 && (
                      <svg className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Evaluation Metrics Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Model Evaluation Metrics</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Regression Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span>R² (R-Squared)</span>
                      <span className="text-slate-500">Variance explained</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span>MAE</span>
                      <span className="text-slate-500">Mean Absolute Error</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span>RMSE</span>
                      <span className="text-slate-500">Root Mean Square Error</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Classification Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span>Accuracy</span>
                      <span className="text-slate-500">Correct predictions</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span>Precision</span>
                      <span className="text-slate-500">True positive rate</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span>Recall / F1</span>
                      <span className="text-slate-500">Sensitivity measure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsWorkspace;
