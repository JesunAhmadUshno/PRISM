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
    icon: 'ℹ️',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
  },
  warning: {
    icon: '⚠️',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  critical: {
    icon: '🚨',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
  },
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, className }) => {
  const config = severityConfig[insight.severity] || severityConfig.info;

  return (
    <article
      className={clsx(
        'p-4 rounded-prism border',
        config.bg,
        config.border,
        className
      )}
      aria-labelledby={`insight-${insight.id}-title`}
      aria-describedby={`insight-${insight.id}-desc`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          {config.icon}
        </span>
        <div className="flex-1">
          <h4
            id={`insight-${insight.id}-title`}
            className={clsx('font-semibold text-lg', config.text)}
          >
            {insight.title}
          </h4>
          <p
            id={`insight-${insight.id}-desc`}
            className="mt-1 text-base text-prism-700 dark:text-prism-300"
          >
            {insight.description}
          </p>
          
          {insight.affectedColumns.length > 0 && (
            <p className="mt-2 text-sm text-prism-500 dark:text-prism-500">
              Columns: {insight.affectedColumns.join(', ')}
            </p>
          )}
          
          <p className="mt-1 text-sm text-prism-400 dark:text-prism-600">
            Confidence: {(insight.confidence * 100).toFixed(0)}%
          </p>
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
