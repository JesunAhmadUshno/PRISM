/**
 * Accessibility contract for the Analytics Workspace.
 *
 * Locks in the WCAG-critical semantics of the app's primary surface:
 * - the six-section navigation is a real ARIA tablist with roving focus
 * - asynchronous results are announced through a polite live region
 * - data tables carry a caption and header scopes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import axe from 'axe-core';

const runCustomAnalysis = vi.fn();

const storeState = {
  results: {
    summary: {
      rowCount: 2,
      columnCount: 2,
      statistics: [
        { columnName: 'revenue', dataType: 'numeric', uniqueCount: 2, nullCount: 0, mean: 10, stdDev: 1 },
        { columnName: 'region', dataType: 'categorical', uniqueCount: 2, nullCount: 1 },
      ],
    },
  },
  runCustomAnalysis,
};

vi.mock('@/stores/prismStore', () => ({
  usePrismStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

import { AnalyticsWorkspace } from './AnalyticsWorkspace';

const TAB_LABELS = ['Data Overview', 'Visualize', 'Preprocess', 'Statistics', 'Analytics', 'ML Models'];

describe('AnalyticsWorkspace accessibility', () => {
  beforeEach(() => {
    runCustomAnalysis.mockReset();
  });

  it('exposes the six sections as a tablist with exactly one selected tab', () => {
    render(<AnalyticsWorkspace />);

    const tablist = screen.getByRole('tablist', { name: 'Analytics sections' });
    const tabs = within(tablist).getAllByRole('tab');

    expect(tabs.map(tab => tab.getAttribute('aria-label'))).toEqual(TAB_LABELS);
    expect(tabs.filter(tab => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1);
  });

  it('points every tab at a panel that labels itself back from that tab', () => {
    render(<AnalyticsWorkspace />);

    const selectedTab = screen.getByRole('tab', { selected: true });
    const panel = screen.getByRole('tabpanel');

    expect(selectedTab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(selectedTab.id);
  });

  it('uses roving tabIndex so the tablist is a single tab stop', () => {
    render(<AnalyticsWorkspace />);

    const reachable = screen.getAllByRole('tab').filter(tab => tab.getAttribute('tabindex') === '0');

    expect(reachable).toHaveLength(1);
    expect(reachable[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('moves selection and focus with the arrow keys', () => {
    render(<AnalyticsWorkspace />);

    const tablist = screen.getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    const visualize = screen.getByRole('tab', { name: 'Visualize' });
    expect(visualize).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(visualize);

    // Wraps backwards past the first tab onto the last one.
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'ML Models' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Data Overview' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tablist, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'ML Models' })).toHaveAttribute('aria-selected', 'true');
  });

  it('announces statistical test results through a polite live region', async () => {
    runCustomAnalysis.mockResolvedValue({
      success: true,
      testResult: { statistic: 2.5, pValue: 0.012, significant: true },
    });

    render(<AnalyticsWorkspace />);

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));
    fireEvent.click(screen.getByRole('button', { name: /revenue/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Run Test' })[0]!);

    const heading = await screen.findByText('Test Results');
    const liveRegion = heading.closest('[role="status"]');

    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('gives the column details table a caption and header scopes', () => {
    render(<AnalyticsWorkspace />);

    const table = screen.getByRole('table', { name: /Column details/i });

    const columnHeaders = within(table).getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(6);
    columnHeaders.forEach(header => expect(header).toHaveAttribute('scope', 'col'));

    const rowHeaders = within(table).getAllByRole('rowheader');
    expect(rowHeaders.map(header => header.textContent)).toEqual(['revenue', 'region']);
    rowHeaders.forEach(header => expect(header).toHaveAttribute('scope', 'row'));
  });

  it('passes the axe ARIA-structure and table-header rule sets', async () => {
    const { container } = render(<AnalyticsWorkspace />);

    const report = await axe.run(container, {
      runOnly: [
        'aria-allowed-attr',
        'aria-allowed-role',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'scope-attr-valid',
        'td-headers-attr',
        'th-has-data-cells',
      ],
    });

    expect(report.violations.map(violation => violation.id)).toEqual([]);
  });
});
