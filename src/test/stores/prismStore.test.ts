/**
 * Unit tests for the synchronous, worker-free actions of src/stores/prismStore.ts.
 *
 * The async actions (setFile / processData / processLinkedDatasets) spin up the
 * Pyodide Web Worker and are out of scope here; everything below is pure state
 * transition logic that runs in the browser on every user interaction.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { usePrismStore } from '@/stores/prismStore';
import type { Dataset, DatasetLink } from '@/types';

function makeDataset(id: string, overrides: Partial<Dataset> = {}): Dataset {
  return {
    id,
    name: `${id}.csv`,
    metadata: {
      name: `${id}.csv`,
      size: 128,
      type: 'csv',
      lastModified: 0,
      mimeType: 'text/csv',
    },
    content: 'a,b\n1,2\n',
    columns: ['a', 'b'],
    rowCount: 1,
    isActive: false,
    ...overrides,
  };
}

/** Snapshot of the pristine store, captured before any test mutates it. */
const pristine = usePrismStore.getState();

beforeEach(() => {
  usePrismStore.setState({
    datasets: [],
    datasetLinks: [],
    activeDatasetId: null,
    accessibility: pristine.accessibility,
    activeChartIndex: 0,
    error: null,
    customAnalysisResults: null,
  });
});

describe('setAccessibility', () => {
  it('merges a partial update and leaves the other settings alone', () => {
    usePrismStore.getState().setAccessibility({ fontSize: 'x-large' });
    const { accessibility } = usePrismStore.getState();
    expect(accessibility.fontSize).toBe('x-large');
    expect(accessibility.colorScheme).toBe('system');
    expect(accessibility.sonificationEnabled).toBe(true);
  });

  it('applies successive updates cumulatively', () => {
    const { setAccessibility } = usePrismStore.getState();
    setAccessibility({ colorScheme: 'high-contrast' });
    setAccessibility({ screenReaderMode: true });
    const { accessibility } = usePrismStore.getState();
    expect(accessibility.colorScheme).toBe('high-contrast');
    expect(accessibility.screenReaderMode).toBe(true);
  });
});

describe('setActiveChart', () => {
  it('stores the requested index', () => {
    usePrismStore.getState().setActiveChart(3);
    expect(usePrismStore.getState().activeChartIndex).toBe(3);
  });

  it('accepts an out-of-range index without validation', () => {
    // TODO(BUG): prismStore.ts:345-347 stores any number, including a negative
    // one, with no bound against results.chartConfigs.length. Consumers index
    // chartConfigs[activeChartIndex] directly.
    usePrismStore.getState().setActiveChart(-5);
    expect(usePrismStore.getState().activeChartIndex).toBe(-5);
  });
});

describe('addDatasetLink / removeDatasetLink', () => {
  const link: Omit<DatasetLink, 'id'> = {
    leftDatasetId: 'left',
    rightDatasetId: 'right',
    leftColumn: 'id',
    rightColumn: 'customer_id',
    joinType: 'inner',
  };

  it('assigns a generated id and keeps the supplied fields', () => {
    usePrismStore.getState().addDatasetLink(link);
    const [created] = usePrismStore.getState().datasetLinks;
    expect(created).toMatchObject(link);
    expect(created?.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('gives each link a distinct id and appends in order', () => {
    const { addDatasetLink } = usePrismStore.getState();
    addDatasetLink(link);
    addDatasetLink({ ...link, joinType: 'left' });
    const links = usePrismStore.getState().datasetLinks;
    expect(links).toHaveLength(2);
    expect(links[0]?.id).not.toBe(links[1]?.id);
    expect(links[1]?.joinType).toBe('left');
  });

  it('removes only the link with the matching id', () => {
    const { addDatasetLink } = usePrismStore.getState();
    addDatasetLink(link);
    addDatasetLink({ ...link, leftColumn: 'sku' });
    const doomed = usePrismStore.getState().datasetLinks[0]!.id;
    usePrismStore.getState().removeDatasetLink(doomed);
    const links = usePrismStore.getState().datasetLinks;
    expect(links).toHaveLength(1);
    expect(links[0]?.leftColumn).toBe('sku');
  });

  it('is a no-op for an unknown link id', () => {
    usePrismStore.getState().addDatasetLink(link);
    usePrismStore.getState().removeDatasetLink('does-not-exist');
    expect(usePrismStore.getState().datasetLinks).toHaveLength(1);
  });
});

describe('setActiveDataset', () => {
  beforeEach(() => {
    usePrismStore.setState({
      datasets: [makeDataset('a', { isActive: true }), makeDataset('b')],
      activeDatasetId: 'a',
    });
  });

  it('moves the isActive flag to the selected dataset', () => {
    usePrismStore.getState().setActiveDataset('b');
    const { datasets, activeDatasetId } = usePrismStore.getState();
    expect(activeDatasetId).toBe('b');
    expect(datasets.map((d) => d.isActive)).toEqual([false, true]);
  });

  it('clears every isActive flag when the id does not exist', () => {
    // TODO(BUG): prismStore.ts:446-455 sets activeDatasetId unconditionally and
    // maps isActive = (d.id === id). An unknown id leaves the store pointing at a
    // dataset that is not there while no dataset is flagged active.
    usePrismStore.getState().setActiveDataset('ghost');
    const { datasets, activeDatasetId } = usePrismStore.getState();
    expect(activeDatasetId).toBe('ghost');
    expect(datasets.some((d) => d.isActive)).toBe(false);
  });
});

describe('removeDataset', () => {
  beforeEach(() => {
    usePrismStore.setState({
      datasets: [makeDataset('a', { isActive: true }), makeDataset('b'), makeDataset('c')],
      activeDatasetId: 'a',
      datasetLinks: [
        { id: 'l1', leftDatasetId: 'a', rightDatasetId: 'b', leftColumn: 'x', rightColumn: 'x', joinType: 'inner' },
        { id: 'l2', leftDatasetId: 'b', rightDatasetId: 'c', leftColumn: 'y', rightColumn: 'y', joinType: 'left' },
      ],
    });
  });

  it('removes the dataset and every link that referenced it', () => {
    usePrismStore.getState().removeDataset('a');
    const { datasets, datasetLinks } = usePrismStore.getState();
    expect(datasets.map((d) => d.id)).toEqual(['b', 'c']);
    expect(datasetLinks.map((l) => l.id)).toEqual(['l2']);
  });

  it('drops links where the removed dataset is on the right-hand side too', () => {
    usePrismStore.getState().removeDataset('c');
    expect(usePrismStore.getState().datasetLinks.map((l) => l.id)).toEqual(['l1']);
  });

  it('falls back to the first remaining dataset as the active one', () => {
    usePrismStore.getState().removeDataset('a');
    expect(usePrismStore.getState().activeDatasetId).toBe('b');
  });

  it('leaves the new active dataset with isActive still false', () => {
    // TODO(BUG): prismStore.ts:430-444 repoints activeDatasetId at the first
    // surviving dataset but never rewrites the isActive flags, so the store's two
    // representations of "which dataset is active" disagree: activeDatasetId is
    // 'b' while datasets.find(d => d.isActive) is undefined. Any UI reading the
    // flag renders no selection.
    usePrismStore.getState().removeDataset('a');
    const { datasets, activeDatasetId } = usePrismStore.getState();
    expect(activeDatasetId).toBe('b');
    expect(datasets.find((d) => d.id === 'b')?.isActive).toBe(false);
    expect(datasets.some((d) => d.isActive)).toBe(false);
  });

  it('clears the active id when the last dataset is removed', () => {
    const { removeDataset } = usePrismStore.getState();
    removeDataset('a');
    removeDataset('b');
    removeDataset('c');
    const { datasets, activeDatasetId, datasetLinks } = usePrismStore.getState();
    expect(datasets).toHaveLength(0);
    expect(datasetLinks).toHaveLength(0);
    expect(activeDatasetId).toBeNull();
  });

  it('is a no-op for an unknown id', () => {
    usePrismStore.getState().removeDataset('ghost');
    expect(usePrismStore.getState().datasets).toHaveLength(3);
  });
});

describe('reset', () => {
  it('clears datasets, links and results but preserves accessibility settings', () => {
    usePrismStore.getState().setAccessibility({ fontSize: 'large', screenReaderMode: true });
    usePrismStore.setState({
      datasets: [makeDataset('a')],
      activeDatasetId: 'a',
      activeChartIndex: 4,
      error: { code: 'NO_DATA', message: 'boom', recoverable: true },
    });

    usePrismStore.getState().reset();

    const state = usePrismStore.getState();
    expect(state.datasets).toHaveLength(0);
    expect(state.activeDatasetId).toBeNull();
    expect(state.activeChartIndex).toBe(0);
    expect(state.error).toBeNull();
    expect(state.file.metadata).toBeNull();
    expect(state.file.validationStatus).toBe('pending');
    expect(state.results.summary).toBeNull();
    expect(state.processing.status).toBe('idle');
    // Accessibility survives a reset by design (prismStore.ts:352-359).
    expect(state.accessibility.fontSize).toBe('large');
    expect(state.accessibility.screenReaderMode).toBe(true);
  });
});

describe('clearFile', () => {
  it('wipes file state while keeping accessibility settings', () => {
    usePrismStore.getState().setAccessibility({ colorScheme: 'dark' });
    usePrismStore.setState({
      file: {
        metadata: {
          name: 'x.csv',
          size: 10,
          type: 'csv',
          lastModified: 0,
          mimeType: 'text/csv',
        },
        content: 'a,b\n1,2\n',
        validationStatus: 'valid',
        validationError: null,
        notices: [],
      },
    });

    usePrismStore.getState().clearFile();

    const state = usePrismStore.getState();
    expect(state.file.content).toBeNull();
    expect(state.file.metadata).toBeNull();
    expect(state.accessibility.colorScheme).toBe('dark');
  });

  it('also discards loaded datasets, not just the legacy single file', () => {
    // Documents that clearFile() spreads the whole initialState
    // (prismStore.ts:217-227), so it is indistinguishable from reset().
    usePrismStore.setState({ datasets: [makeDataset('a')], activeDatasetId: 'a' });
    usePrismStore.getState().clearFile();
    expect(usePrismStore.getState().datasets).toHaveLength(0);
  });
});
