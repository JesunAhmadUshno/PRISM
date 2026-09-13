/**
 * Accessibility tests for InsightCard.
 *
 * Runs under `npm run test:a11y` (vitest.a11y.config.ts). Uses the axe-core
 * dependency that was already declared but never executed by anything.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import axe from 'axe-core';
import { InsightCard } from './InsightCard';
import type { AIInsight } from '@/types';

const insight: AIInsight = {
  id: 'i1',
  type: 'trend',
  severity: 'warning',
  title: 'Revenue is trending down',
  description: 'Revenue fell 12% quarter over quarter.',
  affectedColumns: ['revenue', 'quarter'],
  confidence: 0.82,
  accessibleDescription:
    'Warning. Revenue is trending down. Revenue fell 12 percent quarter over quarter. Confidence 82 percent.',
};

afterEach(cleanup);

async function axeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  return results.violations;
}

describe('InsightCard accessibility', () => {
  it('has no axe violations for a standard insight', async () => {
    const { container } = render(<InsightCard insight={insight} />);
    const violations = await axeViolations(container);
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('exposes the insight as a labelled and described region', () => {
    render(<InsightCard insight={insight} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-labelledby', 'insight-i1-title');
    expect(article).toHaveAttribute('aria-describedby', 'insight-i1-desc');
    expect(document.getElementById('insight-i1-title')).toHaveTextContent(insight.title);
    expect(document.getElementById('insight-i1-desc')).toHaveTextContent(insight.description);
  });

  it('carries a screen-reader-only description of the whole insight', () => {
    render(<InsightCard insight={insight} />);
    expect(screen.getByText(insight.accessibleDescription)).toBeInTheDocument();
  });

  it('renders confidence as text, not colour alone', () => {
    render(<InsightCard insight={insight} />);
    expect(screen.getByText('82% confidence')).toBeInTheDocument();
  });

  it('produces duplicate element ids when the same insight is rendered twice', async () => {
    // TODO(BUG): InsightCard.tsx:58-59 and :72/:78 derive element ids from
    // insight.id alone. Rendering the same insight in two places (e.g. a summary
    // strip and the detail list) emits duplicate ids, so aria-labelledby resolves
    // to whichever comes first. axe flags this as duplicate-id-aria.
    const { container } = render(
      <div>
        <InsightCard insight={insight} />
        <InsightCard insight={insight} />
      </div>
    );
    expect(container.querySelectorAll('#insight-i1-title')).toHaveLength(2);
  });
});
