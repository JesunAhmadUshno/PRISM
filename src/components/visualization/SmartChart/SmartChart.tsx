/**
 * PRISM SmartChart Component
 * 
 * An accessible chart component that provides:
 * 1. Visual graph rendering (Recharts)
 * 2. Hidden data table for screen readers
 * 3. Sonification controls (audio graphs)
 * 4. AI-generated text summary
 * 
 * Compliance: WCAG 2.2 Level AAA, EN 301 549
 * 
 * @accessibility CRITICAL - This component must maintain full accessibility
 */

import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { clsx } from 'clsx';
import type { ChartConfig, ChartDataPoint, ChartType } from '@/types';
import { sanitizeValue } from '@/security/sanitizer';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SmartChartProps {
  /** Chart configuration with data and display options */
  config: ChartConfig;
  /** AI-generated insight text about this chart */
  insightText?: string;
  /** Enable sonification controls */
  enableSonification?: boolean;
  /** Custom class name */
  className?: string;
  /** Chart height in pixels */
  height?: number;
}

interface SonificationState {
  isPlaying: boolean;
  currentIndex: number;
  audioContext: AudioContext | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Accessible color palette - selected for colorblind users
 * Passes WCAG 2.1 contrast requirements
 */
const ACCESSIBLE_COLORS = [
  '#0077BB', // Blue
  '#EE7733', // Orange
  '#009988', // Teal
  '#EE3377', // Magenta
  '#33BBEE', // Cyan
  '#CC3311', // Red
  '#BBBBBB', // Grey
  '#332288', // Indigo
];

/**
 * Sonification frequency mapping
 * Low values = low pitch, high values = high pitch
 */
const SONIFICATION_CONFIG = {
  minFrequency: 200,  // Hz
  maxFrequency: 800,  // Hz
  noteDuration: 200,  // ms
  noteGap: 50,        // ms between notes
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate accessible text summary for chart data
 */
function generateAccessibleSummary(config: ChartConfig): string {
  const { type, data, title, xAxisLabel, yAxisLabel } = config;
  
  if (!data || data.length === 0) {
    return `${title}: No data available.`;
  }

  const dataPoints = data.length;
  
  // Get the first numeric column for statistics
  const numericKey = Object.keys(data[0] || {}).find(
    key => typeof data[0]?.[key] === 'number'
  );
  
  if (!numericKey) {
    return `${title}: ${type} chart with ${dataPoints} data points. X-axis: ${xAxisLabel}. Y-axis: ${yAxisLabel}.`;
  }

  const values = data
    .map(d => d[numericKey])
    .filter((v): v is number => typeof v === 'number');
  
  if (values.length === 0) {
    return `${title}: ${type} chart with ${dataPoints} data points.`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Detect trend
  let trend = 'stable';
  if (values.length > 1) {
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePct = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (changePct > 10) trend = `increasing by approximately ${Math.round(changePct)}%`;
    else if (changePct < -10) trend = `decreasing by approximately ${Math.round(Math.abs(changePct))}%`;
  }

  return `${title}: ${type} chart showing ${yAxisLabel} over ${xAxisLabel}. ` +
    `Data points: ${dataPoints}. ` +
    `Range: ${min.toLocaleString()} to ${max.toLocaleString()}. ` +
    `Average: ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}. ` +
    `Trend is ${trend}.`;
}

/**
 * Map a numeric value to an audio frequency
 */
function valueToFrequency(value: number, min: number, max: number): number {
  const { minFrequency, maxFrequency } = SONIFICATION_CONFIG;
  if (max === min) return (minFrequency + maxFrequency) / 2;
  const normalized = (value - min) / (max - min);
  return minFrequency + normalized * (maxFrequency - minFrequency);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hidden data table for screen readers
 * Provides tabular access to chart data
 */
const AccessibleDataTable: React.FC<{
  data: readonly ChartDataPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
  chartId: string;
}> = ({ data, xAxisLabel, yAxisLabel, chartId }) => {
  const columns = useMemo(() => {
    if (!data[0]) return [];
    return Object.keys(data[0]);
  }, [data]);

  if (data.length === 0 || columns.length === 0) {
    return null;
  }

  return (
    <table
      className="sr-only"
      role="table"
      aria-labelledby={`${chartId}-title`}
      aria-describedby={`${chartId}-summary`}
    >
      <caption id={`${chartId}-table-caption`}>
        Data table for chart. {data.length} rows, {columns.length} columns.
      </caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} scope="col">
              {col === columns[0] ? xAxisLabel || col : col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 100).map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col) => (
              <td key={col}>{sanitizeValue(row[col])}</td>
            ))}
          </tr>
        ))}
      </tbody>
      {data.length > 100 && (
        <tfoot>
          <tr>
            <td colSpan={columns.length}>
              Showing first 100 of {data.length} rows.
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};

/**
 * Sonification controls for audio representation
 */
const SonificationControls: React.FC<{
  data: readonly ChartDataPoint[];
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  currentIndex: number;
  chartId: string;
}> = ({ data, isPlaying, onPlay, onStop, currentIndex, chartId }) => {
  return (
    <div 
      className="flex items-center gap-4 mt-4 p-3 bg-prism-100 dark:bg-prism-900 rounded-prism"
      role="group"
      aria-labelledby={`${chartId}-sonification-label`}
    >
      <span 
        id={`${chartId}-sonification-label`}
        className="text-sm font-medium text-prism-900 dark:text-prism-100"
      >
        Audio Graph:
      </span>
      
      <button
        onClick={isPlaying ? onStop : onPlay}
        className={clsx(
          'touch-target px-4 py-2 rounded-prism font-medium',
          'focus-visible-ring transition-colors',
          'bg-prism-600 text-white hover:bg-prism-700',
          'dark:bg-prism-500 dark:hover:bg-prism-600'
        )}
        aria-pressed={isPlaying}
        aria-describedby={`${chartId}-sonification-desc`}
      >
        {isPlaying ? '⏹ Stop' : '▶ Play'}
      </button>
      
      <span 
        id={`${chartId}-sonification-desc`}
        className="text-sm text-prism-700 dark:text-prism-300"
      >
        {isPlaying 
          ? `Playing data point ${currentIndex + 1} of ${data.length}`
          : 'Press play to hear data as audio tones'
        }
      </span>
      
      {/* Live region for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isPlaying && `Playing point ${currentIndex + 1}: value is ${
          data[currentIndex] ? Object.values(data[currentIndex]).find(v => typeof v === 'number') : 'unknown'
        }`}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SmartChart: React.FC<SmartChartProps> = ({
  config,
  insightText,
  enableSonification = true,
  className,
  height = 400,
}) => {
  const chartId = useId();
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackRef = useRef<number | null>(null);
  
  const [sonification, setSonification] = useState<SonificationState>({
    isPlaying: false,
    currentIndex: 0,
    audioContext: null,
  });

  // Generate accessible summary
  const accessibleSummary = useMemo(
    () => generateAccessibleSummary(config),
    [config]
  );

  // Get data keys for chart rendering
  const dataKeys = useMemo(() => {
    if (!config.data[0]) return { x: '', y: '' };
    const keys = Object.keys(config.data[0]);
    return {
      x: keys[0] || '',
      y: keys[1] || keys[0] || '',
    };
  }, [config.data]);

  // Get min/max for sonification
  const valueRange = useMemo(() => {
    const values = config.data
      .map(d => d[dataKeys.y])
      .filter((v): v is number => typeof v === 'number');
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [config.data, dataKeys.y]);

  // Sonification playback
  const playNote = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const playSonification = useCallback(() => {
    setSonification(prev => ({ ...prev, isPlaying: true, currentIndex: 0 }));
    
    let index = 0;
    const { noteDuration, noteGap } = SONIFICATION_CONFIG;
    
    const playNext = () => {
      if (index >= config.data.length) {
        setSonification(prev => ({ ...prev, isPlaying: false, currentIndex: 0 }));
        return;
      }
      
      const value = config.data[index]?.[dataKeys.y];
      if (typeof value === 'number') {
        const freq = valueToFrequency(value, valueRange.min, valueRange.max);
        playNote(freq, noteDuration);
      }
      
      setSonification(prev => ({ ...prev, currentIndex: index }));
      index++;
      
      playbackRef.current = window.setTimeout(playNext, noteDuration + noteGap);
    };
    
    playNext();
  }, [config.data, dataKeys.y, valueRange, playNote]);

  const stopSonification = useCallback(() => {
    if (playbackRef.current) {
      clearTimeout(playbackRef.current);
    }
    setSonification(prev => ({ ...prev, isPlaying: false, currentIndex: 0 }));
  }, []);

  // Render the appropriate chart type
  const renderChart = () => {
    const commonProps = {
      data: config.data as ChartDataPoint[],
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={dataKeys.x} 
              label={{ value: config.xAxisLabel, position: 'bottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: config.yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKeys.y}
              stroke={ACCESSIBLE_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeys.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKeys.y} fill={ACCESSIBLE_COLORS[0]}>
              {config.data.map((_, index) => (
                <Cell key={index} fill={ACCESSIBLE_COLORS[index % ACCESSIBLE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeys.x} type="number" name={config.xAxisLabel} />
            <YAxis dataKey={dataKeys.y} type="number" name={config.yAxisLabel} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter
              name={config.title}
              data={config.data as ChartDataPoint[]}
              fill={ACCESSIBLE_COLORS[0]}
            />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={config.data as ChartDataPoint[]}
              dataKey={dataKeys.y}
              nameKey={dataKeys.x}
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              label={(entry) => `${entry[dataKeys.x]}: ${entry[dataKeys.y]}`}
            >
              {config.data.map((_, index) => (
                <Cell key={index} fill={ACCESSIBLE_COLORS[index % ACCESSIBLE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeys.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={dataKeys.y}
              stroke={ACCESSIBLE_COLORS[0]}
              fill={ACCESSIBLE_COLORS[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'histogram':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill={ACCESSIBLE_COLORS[0]} />
          </BarChart>
        );

      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeys.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKeys.y} fill={ACCESSIBLE_COLORS[0]} />
          </BarChart>
        );
    }
  };

  return (
    <section
      className={clsx(
        'bg-white dark:bg-prism-950 rounded-prism shadow-lg p-6',
        'border border-prism-200 dark:border-prism-800',
        className
      )}
      aria-labelledby={`${chartId}-title`}
      aria-describedby={`${chartId}-summary`}
    >
      {/* Chart Title */}
      <h3
        id={`${chartId}-title`}
        className="text-xl font-semibold text-prism-900 dark:text-prism-100 mb-2"
      >
        {config.title}
      </h3>

      {/* Accessible Summary (visible to all, optimized for screen readers) */}
      <p
        id={`${chartId}-summary`}
        className="text-base text-prism-700 dark:text-prism-300 mb-4"
      >
        {insightText || accessibleSummary}
      </p>

      {/* Visual Chart */}
      <div
        role="img"
        aria-label={accessibleSummary}
        className="w-full"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Hidden Data Table for Screen Readers */}
      <AccessibleDataTable
        data={config.data}
        xAxisLabel={config.xAxisLabel}
        yAxisLabel={config.yAxisLabel}
        chartId={chartId}
      />

      {/* Sonification Controls */}
      {enableSonification && config.data.length > 0 && (
        <SonificationControls
          data={config.data}
          isPlaying={sonification.isPlaying}
          onPlay={playSonification}
          onStop={stopSonification}
          currentIndex={sonification.currentIndex}
          chartId={chartId}
        />
      )}

      {/* Chart Legend for Screen Readers */}
      <div className="sr-only">
        <p>
          Chart type: {config.type}. 
          X-axis shows {config.xAxisLabel}. 
          Y-axis shows {config.yAxisLabel}.
          Total data points: {config.data.length}.
        </p>
      </div>
    </section>
  );
};

export default SmartChart;
