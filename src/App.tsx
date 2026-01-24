/**
 * PRISM Main Application Component
 * 
 * Root component that orchestrates the data analytics flow.
 * Implements accessible layout with skip links and ARIA landmarks.
 */

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { FileUploader } from '@/components/core/FileUploader';
import { SmartChart } from '@/components/visualization/SmartChart';
import { InsightCard } from '@/components/visualization/InsightCard';
import { DatasetManager } from '@/components/core/DatasetManager';
import { AnalyticsWorkspace } from '@/components/analytics/AnalyticsWorkspace';
import { usePrismStore } from '@/stores/prismStore';

type AnalysisMode = 'single' | 'multi';
type ResultsView = 'summary' | 'workspace';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TableIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

// PRISM Logo Component
const PrismLogo = ({ size = 48 }: { size?: number }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} className="drop-shadow-lg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1"/>
        <stop offset="50%" stopColor="#8b5cf6"/>
        <stop offset="100%" stopColor="#a855f7"/>
      </linearGradient>
      <linearGradient id="logoBeamBlue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
      <linearGradient id="logoBeamGreen" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0"/>
        <stop offset="100%" stopColor="#84cc16"/>
      </linearGradient>
      <linearGradient id="logoBeamPink" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ec4899" stopOpacity="0"/>
        <stop offset="100%" stopColor="#f43f5e"/>
      </linearGradient>
    </defs>
    <circle cx="256" cy="256" r="240" className="fill-slate-900 dark:fill-slate-800"/>
    <circle cx="256" cy="256" r="225" fill="none" stroke="url(#logoGrad)" strokeWidth="3" opacity="0.4"/>
    {/* Light beams */}
    <line x1="300" y1="200" x2="400" y2="150" stroke="url(#logoBeamBlue)" strokeWidth="8" strokeLinecap="round"/>
    <line x1="300" y1="256" x2="420" y2="256" stroke="url(#logoBeamGreen)" strokeWidth="8" strokeLinecap="round"/>
    <line x1="300" y1="312" x2="400" y2="362" stroke="url(#logoBeamPink)" strokeWidth="8" strokeLinecap="round"/>
    {/* Input beam */}
    <line x1="90" y1="256" x2="175" y2="256" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.9"/>
    {/* Prism */}
    <polygon points="175,115 325,256 175,397" fill="url(#logoGrad)"/>
    <polygon points="175,115 230,175 175,235" fill="#fff" opacity="0.25"/>
    <line x1="175" y1="115" x2="175" y2="397" stroke="#fff" strokeWidth="3" opacity="0.5"/>
    {/* Data points */}
    <circle cx="365" cy="165" r="10" fill="#3b82f6"/>
    <circle cx="385" cy="256" r="10" fill="#22c55e"/>
    <circle cx="365" cy="347" r="10" fill="#ec4899"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const App: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('single');
  const [resultsView, setResultsView] = useState<ResultsView>('summary');
  
  const {
    file,
    processing,
    error,
    results,
    accessibility,
    setFile,
    clearFile,
    setAccessibility,
  } = usePrismStore();

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Color scheme
    if (accessibility.colorScheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('high-contrast');
    } else if (accessibility.colorScheme === 'light') {
      root.classList.remove('dark', 'high-contrast');
    } else if (accessibility.colorScheme === 'high-contrast') {
      root.classList.add('dark', 'high-contrast');
    }

    // Font size
    const fontSizeMap = {
      normal: '100%',
      large: '125%',
      'x-large': '150%',
    };
    root.style.fontSize = fontSizeMap[accessibility.fontSize];
  }, [accessibility]);

  const isProcessing = processing.status !== 'idle' && processing.status !== 'complete' && processing.status !== 'error';
  const hasResults = results.summary !== null;

  return (
    <div className="min-h-screen mesh-bg text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <PrismLogo size={48} />
              <div>
                <h1 className="text-xl font-bold gradient-text">PRISM</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Secure Analytics Platform</p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Font Size */}
              <select
                id="font-size"
                value={accessibility.fontSize}
                onChange={(e) => setAccessibility({ fontSize: e.target.value as 'normal' | 'large' | 'x-large' })}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-sm font-medium border-0 focus-visible-ring cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Adjust font size"
              >
                <option value="normal">A</option>
                <option value="large">A+</option>
                <option value="x-large">A++</option>
              </select>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setAccessibility({ 
                  colorScheme: accessibility.colorScheme === 'dark' ? 'light' : 'dark' 
                })}
                className={clsx(
                  'p-3 rounded-xl transition-all duration-200',
                  'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700',
                  'text-slate-600 dark:text-slate-300',
                  'focus-visible-ring'
                )}
                aria-label={`Switch to ${accessibility.colorScheme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {accessibility.colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        id="main-content" 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-labelledby="main-heading"
      >
        <h2 id="main-heading" className="sr-only">
          Data Analysis Dashboard
        </h2>

        {/* Security Banner */}
        <div 
          className="mb-8 glass-card p-4 flex items-center justify-center gap-3"
          role="status"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <ShieldIcon />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero-Trust Mode Active</span>
            <span className="mx-2">•</span>
            All processing happens locally in your browser. No data leaves your device.
          </p>
        </div>

        {/* File Upload Section */}
        {!hasResults && (
          <section 
            id="file-upload"
            aria-labelledby="upload-heading"
            className="max-w-3xl mx-auto"
          >
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h3 id="upload-heading" className="text-3xl font-bold mb-3 text-balance">
                Analyze your data with
                <span className="gradient-text"> complete privacy</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Upload CSV or Excel files for instant insights. Everything runs locally.
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center p-1 rounded-2xl glass-card" role="tablist" aria-label="Analysis mode">
                <button
                  role="tab"
                  aria-selected={analysisMode === 'single'}
                  aria-controls="single-file-panel"
                  id="single-file-tab"
                  onClick={() => setAnalysisMode('single')}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200',
                    analysisMode === 'single' 
                      ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg shadow-prism-500/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  )}
                >
                  <DocumentIcon />
                  <span>Single File</span>
                </button>
                <button
                  role="tab"
                  aria-selected={analysisMode === 'multi'}
                  aria-controls="multi-dataset-panel"
                  id="multi-dataset-tab"
                  onClick={() => setAnalysisMode('multi')}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200',
                    analysisMode === 'multi' 
                      ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg shadow-prism-500/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  )}
                >
                  <LinkIcon />
                  <span>Link Datasets</span>
                </button>
              </div>
            </div>

            {/* Single File Mode */}
            {analysisMode === 'single' && (
              <div 
                role="tabpanel" 
                id="single-file-panel" 
                aria-labelledby="single-file-tab"
                className="animate-in fade-in duration-300"
              >
                <FileUploader
                  onFileSelect={setFile}
                  isProcessing={isProcessing}
                />
              </div>
            )}

            {/* Multi-Dataset Mode */}
            {analysisMode === 'multi' && (
              <div 
                role="tabpanel" 
                id="multi-dataset-panel" 
                aria-labelledby="multi-dataset-tab"
                className="animate-in fade-in duration-300"
              >
                <DatasetManager />
              </div>
            )}

            {/* Progress Indicator */}
            {isProcessing && (
              <div 
                className="mt-6 glass-card p-6"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                    <div 
                      className="absolute inset-0 w-12 h-12 rounded-full border-4 border-prism-500 border-t-transparent spin-slow"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{processing.message}</p>
                    <div className="mt-3 progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${processing.progress}%` }}
                        role="progressbar"
                        aria-valuenow={processing.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={processing.accessibleMessage}
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {processing.progress}% complete
                    </p>
                  </div>
                </div>
                <p className="sr-only">{processing.accessibleMessage}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div 
                className="mt-6 alert-error"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">❌</span>
                  <div>
                    <p className="font-semibold">{error.message}</p>
                    {error.recoverable && (
                      <button
                        onClick={clearFile}
                        className="mt-2 text-sm font-medium underline underline-offset-2 hover:no-underline"
                      >
                        Try again with a different file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Features Grid */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🔒', title: 'Private', desc: 'Data never leaves your browser' },
                { icon: '⚡', title: 'Fast', desc: 'Powered by WebAssembly' },
                { icon: '♿', title: 'Accessible', desc: 'WCAG 2.2 AAA compliant' },
              ].map((feature) => (
                <div key={feature.title} className="glass-card p-4 text-center">
                  <span className="text-2xl">{feature.icon}</span>
                  <h4 className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        {hasResults && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Analysis Complete
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {file.metadata?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearFile}
                  className="btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Analysis
                </button>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex items-center p-1 rounded-2xl glass-card" role="tablist" aria-label="Results view mode">
                <button
                  role="tab"
                  aria-selected={resultsView === 'summary'}
                  onClick={() => setResultsView('summary')}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200',
                    resultsView === 'summary' 
                      ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg shadow-prism-500/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  )}
                >
                  <SparklesIcon />
                  <span>Quick Summary</span>
                </button>
                <button
                  role="tab"
                  aria-selected={resultsView === 'workspace'}
                  onClick={() => setResultsView('workspace')}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200',
                    resultsView === 'workspace' 
                      ? 'bg-gradient-to-r from-prism-500 to-purple-600 text-white shadow-lg shadow-prism-500/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  )}
                >
                  <ChartIcon />
                  <span>Analytics Workspace</span>
                </button>
              </div>
            </div>

            {/* Summary View */}
            {resultsView === 'summary' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="stat-card">
                    <span className="stat-value">{results.summary?.rowCount.toLocaleString()}</span>
                    <span className="stat-label">Rows</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{results.summary?.columnCount}</span>
                    <span className="stat-label">Columns</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{results.insights.length}</span>
                    <span className="stat-label">Insights</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{results.summary?.processingTimeMs.toFixed(0)}ms</span>
                    <span className="stat-label">Processing Time</span>
                  </div>
                </div>

                {/* Insights Section */}
                {results.insights.length > 0 && (
                  <section aria-labelledby="insights-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                        <SparklesIcon />
                      </div>
                      <h3 id="insights-heading" className="text-xl font-semibold">
                        AI-Generated Insights
                      </h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {results.insights.map((insight) => (
                        <InsightCard key={insight.id} insight={insight} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Charts Section */}
                {results.chartConfigs.length > 0 && (
                  <section aria-labelledby="charts-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-prism-100 dark:bg-prism-900/50 text-prism-600 dark:text-prism-400">
                        <ChartIcon />
                      </div>
                      <h3 id="charts-heading" className="text-xl font-semibold">
                        Recommended Visualizations
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {results.chartConfigs.map((chartConfig, index) => {
                        const reason = results.recommendations[index]?.reason;
                        return (
                          <SmartChart
                            key={index}
                            config={chartConfig}
                            {...(reason ? { insightText: reason } : {})}
                            enableSonification={accessibility.sonificationEnabled}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Statistics Table */}
                {results.summary?.statistics && results.summary.statistics.length > 0 && (
                  <section aria-labelledby="stats-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
                        <TableIcon />
                      </div>
                      <h3 id="stats-heading" className="text-xl font-semibold">
                        Column Statistics
                      </h3>
                    </div>
                    <div className="glass-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left p-4 font-semibold text-slate-900 dark:text-slate-100">Column</th>
                              <th className="text-left p-4 font-semibold text-slate-900 dark:text-slate-100">Type</th>
                              <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">Count</th>
                              <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">Nulls</th>
                              <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">Unique</th>
                              <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">Mean</th>
                              <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">Std Dev</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.summary.statistics.map((stat) => (
                              <tr 
                                key={stat.columnName}
                                className={clsx(
                                  'border-b border-slate-100 dark:border-slate-800 transition-colors',
                                  'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                )}
                              >
                                <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                  {stat.columnName}
                                </td>
                                <td className="p-4">
                                  <span className="badge-primary">
                                    {stat.dataType}
                                  </span>
                                </td>
                                <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                                  {stat.count.toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                                  {stat.nullCount.toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                                  {stat.uniqueCount.toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                                  {stat.mean !== undefined ? stat.mean.toFixed(2) : '-'}
                                </td>
                                <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                                  {stat.stdDev !== undefined ? stat.stdDev.toFixed(2) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Analytics Workspace View */}
            {resultsView === 'workspace' && (
              <div className="animate-in fade-in duration-300">
                <AnalyticsWorkspace />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="mt-16 border-t border-slate-200 dark:border-slate-800"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <PrismLogo size={32} />
              <span className="font-semibold text-slate-900 dark:text-slate-100">PRISM</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldIcon /> ISO 27001
              </span>
              <span>•</span>
              <span>WCAG 2.2 AAA</span>
              <span>•</span>
              <span>Zero Data Exfiltration</span>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2026 PRISM Project
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
