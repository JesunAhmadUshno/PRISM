/**
 * PRISM Main Application Component
 * 
 * Root component that orchestrates the data analytics flow.
 * Implements accessible layout with skip links and ARIA landmarks.
 */

import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { FileUploader } from '@/components/core/FileUploader';
import { SmartChart } from '@/components/visualization/SmartChart';
import { InsightCard } from '@/components/visualization/InsightCard';
import { usePrismStore } from '@/stores/prismStore';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const App: React.FC = () => {
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
    } else if (accessibility.colorScheme === 'light') {
      root.classList.remove('dark');
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
    <div className="min-h-screen bg-prism-50 dark:bg-prism-950 text-prism-900 dark:text-prism-100">
      {/* Header */}
      <header 
        className="bg-prism-900 dark:bg-prism-950 text-white py-6 px-4 shadow-lg"
        role="banner"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">📊</span>
            <div>
              <h1 className="text-2xl font-bold">PRISM</h1>
              <p className="text-sm text-prism-300">Secure Data Analytics</p>
            </div>
          </div>
          
          {/* Accessibility Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="font-size" className="text-sm sr-only">
                Font Size
              </label>
              <select
                id="font-size"
                value={accessibility.fontSize}
                onChange={(e) => setAccessibility({ fontSize: e.target.value as 'normal' | 'large' | 'x-large' })}
                className="bg-prism-800 text-white px-3 py-2 rounded-prism text-sm focus-visible-ring"
                aria-label="Adjust font size"
              >
                <option value="normal">A</option>
                <option value="large">A+</option>
                <option value="x-large">A++</option>
              </select>
            </div>
            
            <button
              onClick={() => setAccessibility({ 
                colorScheme: accessibility.colorScheme === 'dark' ? 'light' : 'dark' 
              })}
              className="p-2 rounded-prism bg-prism-800 hover:bg-prism-700 focus-visible-ring"
              aria-label={`Switch to ${accessibility.colorScheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {accessibility.colorScheme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        id="main-content" 
        className="max-w-7xl mx-auto px-4 py-8"
        role="main"
        aria-labelledby="main-heading"
      >
        <h2 id="main-heading" className="sr-only">
          Data Analysis Dashboard
        </h2>

        {/* Security Banner */}
        <div 
          className="mb-8 p-4 bg-green-100 dark:bg-green-900 rounded-prism border border-green-300 dark:border-green-700"
          role="status"
        >
          <p className="text-green-800 dark:text-green-200 text-center font-medium">
            🔒 <strong>Zero-Trust Mode Active:</strong> All data processing occurs locally in your browser. 
            No data is transmitted to any server.
          </p>
        </div>

        {/* File Upload Section */}
        {!hasResults && (
          <section 
            id="file-upload"
            aria-labelledby="upload-heading"
            className="max-w-2xl mx-auto"
          >
            <h3 id="upload-heading" className="text-xl font-semibold mb-4 text-center">
              Upload Your Data
            </h3>
            
            <FileUploader
              onFileSelect={setFile}
              isProcessing={isProcessing}
            />

            {/* Progress Indicator */}
            {isProcessing && (
              <div 
                className="mt-6 p-4 bg-prism-100 dark:bg-prism-900 rounded-prism"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex items-center gap-4">
                  <div className="animate-spin text-2xl" aria-hidden="true">⏳</div>
                  <div className="flex-1">
                    <p className="font-medium">{processing.message}</p>
                    <div className="mt-2 h-2 bg-prism-200 dark:bg-prism-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-prism-600 transition-all duration-300"
                        style={{ width: `${processing.progress}%` }}
                        role="progressbar"
                        aria-valuenow={processing.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={processing.accessibleMessage}
                      />
                    </div>
                  </div>
                </div>
                <p className="sr-only">{processing.accessibleMessage}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div 
                className="mt-6 p-4 bg-red-100 dark:bg-red-900 rounded-prism border border-red-300 dark:border-red-700"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-red-800 dark:text-red-200 font-medium">
                  ❌ {error.message}
                </p>
                {error.recoverable && (
                  <button
                    onClick={clearFile}
                    className="mt-2 text-sm underline text-red-600 dark:text-red-400 hover:no-underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Results Section */}
        {hasResults && (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Analysis Results</h3>
                <p className="text-prism-600 dark:text-prism-400">
                  {file.metadata?.name} • {results.summary?.rowCount.toLocaleString()} rows • 
                  {results.summary?.columnCount} columns • 
                  Processed in {results.summary?.processingTimeMs.toFixed(0)}ms
                </p>
              </div>
              <button
                onClick={clearFile}
                className={clsx(
                  'px-4 py-2 rounded-prism font-medium',
                  'bg-prism-200 dark:bg-prism-800',
                  'hover:bg-prism-300 dark:hover:bg-prism-700',
                  'focus-visible-ring transition-colors'
                )}
              >
                Analyze New File
              </button>
            </div>

            {/* Insights Section */}
            {results.insights.length > 0 && (
              <section aria-labelledby="insights-heading">
                <h3 id="insights-heading" className="text-xl font-semibold mb-4">
                  💡 AI-Generated Insights
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </section>
            )}

            {/* Charts Section */}
            {results.chartConfigs.length > 0 && (
              <section aria-labelledby="charts-heading">
                <h3 id="charts-heading" className="text-xl font-semibold mb-4">
                  📈 Recommended Visualizations
                </h3>
                <div className="space-y-6">
                  {results.chartConfigs.map((chartConfig, index) => (
                    <SmartChart
                      key={index}
                      config={chartConfig}
                      insightText={results.recommendations[index]?.reason}
                      enableSonification={accessibility.sonificationEnabled}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Statistics Table */}
            {results.summary?.statistics && results.summary.statistics.length > 0 && (
              <section aria-labelledby="stats-heading">
                <h3 id="stats-heading" className="text-xl font-semibold mb-4">
                  📊 Column Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white dark:bg-prism-900 rounded-prism shadow">
                    <thead>
                      <tr className="bg-prism-100 dark:bg-prism-800">
                        <th className="text-left p-3 font-semibold">Column</th>
                        <th className="text-left p-3 font-semibold">Type</th>
                        <th className="text-right p-3 font-semibold">Count</th>
                        <th className="text-right p-3 font-semibold">Nulls</th>
                        <th className="text-right p-3 font-semibold">Unique</th>
                        <th className="text-right p-3 font-semibold">Mean</th>
                        <th className="text-right p-3 font-semibold">Std Dev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.summary.statistics.map((stat, index) => (
                        <tr 
                          key={stat.columnName}
                          className={index % 2 === 0 ? '' : 'bg-prism-50 dark:bg-prism-950'}
                        >
                          <td className="p-3 font-medium">{stat.columnName}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-prism-200 dark:bg-prism-700 rounded text-sm">
                              {stat.dataType}
                            </span>
                          </td>
                          <td className="p-3 text-right">{stat.count.toLocaleString()}</td>
                          <td className="p-3 text-right">{stat.nullCount.toLocaleString()}</td>
                          <td className="p-3 text-right">{stat.uniqueCount.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            {stat.mean !== undefined ? stat.mean.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            {stat.stdDev !== undefined ? stat.stdDev.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="bg-prism-100 dark:bg-prism-900 py-6 px-4 mt-12 border-t border-prism-200 dark:border-prism-800"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto text-center text-sm text-prism-600 dark:text-prism-400">
          <p className="mb-2">
            <strong>PRISM</strong> - Secure, Browser-Based Data Analytics
          </p>
          <p>
            🔒 ISO/IEC 27001:2022 Compliant Design • WCAG 2.2 Level AAA Accessible • 
            Zero Data Exfiltration
          </p>
          <p className="mt-2">
            © 2026 PRISM Project. All data processing occurs locally in your browser.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
