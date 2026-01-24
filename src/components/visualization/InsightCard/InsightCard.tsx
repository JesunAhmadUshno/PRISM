/**
 * PRISM InsightCard Component
 * 
 * Displays AI-generated insights with accessibility support.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { AIInsight } from '@/types';

interface InsightCardProps {
  insight: AIInsight;
  className?: string;
}

const severityConfig = {
  info: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  warning: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500',
  },
  critical: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    border: 'border-l-red-500',
  },
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, className }) => {
  const config = severityConfig[insight.severity] || severityConfig.info;

  return (
    <article
      className={clsx(
        'glass-card p-5 border-l-4 transition-all duration-200 hover:shadow-lg',
        config.border,
        className
      )}
      aria-labelledby={`insight-${insight.id}-title`}
      aria-describedby={`insight-${insight.id}-desc`}
    >
      <div className="flex items-start gap-4">
        <div className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          config.iconBg,
          config.iconColor
        )}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            id={`insight-${insight.id}-title`}
            className="font-semibold text-lg text-slate-900 dark:text-slate-100"
          >
            {insight.title}
          </h4>
          <p
            id={`insight-${insight.id}-desc`}
            className="mt-1.5 text-base text-slate-600 dark:text-slate-400"
          >
            {insight.description}
          </p>
          
          {insight.affectedColumns.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.affectedColumns.map((col) => (
                <span 
                  key={col}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {col}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-prism-500 to-purple-500 rounded-full"
                  style={{ width: `${insight.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {(insight.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Screen reader optimized description */}
      <p className="sr-only">
        {insight.accessibleDescription}
      </p>
    </article>
  );
};

export default InsightCard;
