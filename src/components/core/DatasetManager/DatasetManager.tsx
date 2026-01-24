/**
 * PRISM DatasetManager Component
 * 
 * Manages multiple datasets with linking/joining capabilities.
 * Allows users to upload multiple files and define relationships.
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { clsx } from 'clsx';
import type { Dataset, DatasetLink, JoinType } from '@/types';
import { MAX_FILE_SIZE } from '@/security/validator';
import { usePrismStore } from '@/stores/prismStore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

// No external props needed - component connects to store directly

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const TableIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// DATASET CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface DatasetCardProps {
  dataset: Dataset;
  onRemove: () => void;
  isLinked: boolean;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, onRemove, isLinked }) => (
  <div className={clsx(
    'glass-card p-4 relative group transition-all duration-200',
    isLinked && 'ring-2 ring-prism-500'
  )}>
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-prism-100 dark:bg-prism-900/50 text-prism-600 dark:text-prism-400">
        <TableIcon />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
          {dataset.name}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {dataset.rowCount.toLocaleString()} rows • {dataset.columns.length} columns
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {dataset.columns.slice(0, 4).map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {col}
            </span>
          ))}
          {dataset.columns.length > 4 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
              +{dataset.columns.length - 4} more
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
        aria-label={`Remove ${dataset.name}`}
      >
        <TrashIcon />
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// LINK BUILDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LinkBuilderProps {
  datasets: Dataset[];
  onAddLink: (link: Omit<DatasetLink, 'id'>) => void;
  onClose: () => void;
}

const LinkBuilder: React.FC<LinkBuilderProps> = ({ datasets, onAddLink, onClose }) => {
  const [leftDatasetId, setLeftDatasetId] = useState<string>(datasets[0]?.id || '');
  const [rightDatasetId, setRightDatasetId] = useState<string>(datasets[1]?.id || '');
  const [leftColumn, setLeftColumn] = useState<string>('');
  const [rightColumn, setRightColumn] = useState<string>('');
  const [joinType, setJoinType] = useState<JoinType>('inner');

  const leftDataset = datasets.find(d => d.id === leftDatasetId);
  const rightDataset = datasets.find(d => d.id === rightDatasetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leftDatasetId && rightDatasetId && leftColumn && rightColumn) {
      onAddLink({
        leftDatasetId,
        rightDatasetId,
        leftColumn,
        rightColumn,
        joinType,
      });
      onClose();
    }
  };

  return (
    <div className="glass-card p-6">
      <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        <LinkIcon />
        Link Datasets
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Dataset */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              First Dataset
            </label>
            <select
              value={leftDatasetId}
              onChange={(e) => {
                setLeftDatasetId(e.target.value);
                setLeftColumn('');
              }}
              className="input"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Right Dataset */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Second Dataset
            </label>
            <select
              value={rightDatasetId}
              onChange={(e) => {
                setRightDatasetId(e.target.value);
                setRightColumn('');
              }}
              className="input"
            >
              {datasets.filter(d => d.id !== leftDatasetId).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Left Column */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link Column (First)
            </label>
            <select
              value={leftColumn}
              onChange={(e) => setLeftColumn(e.target.value)}
              className="input"
              disabled={!leftDataset}
            >
              <option value="">Select column...</option>
              {leftDataset?.columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Right Column */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link Column (Second)
            </label>
            <select
              value={rightColumn}
              onChange={(e) => setRightColumn(e.target.value)}
              className="input"
              disabled={!rightDataset}
            >
              <option value="">Select column...</option>
              {rightDataset?.columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Join Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Join Type
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'inner', label: 'Inner', desc: 'Only matching rows' },
              { value: 'left', label: 'Left', desc: 'All from first + matches' },
              { value: 'right', label: 'Right', desc: 'All from second + matches' },
              { value: 'outer', label: 'Full', desc: 'All rows from both' },
            ].map((jt) => (
              <button
                key={jt.value}
                type="button"
                onClick={() => setJoinType(jt.value as JoinType)}
                className={clsx(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  joinType === jt.value
                    ? 'bg-prism-500 text-white shadow-lg shadow-prism-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {jt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {joinType === 'inner' && 'Returns only rows that have matching values in both datasets.'}
            {joinType === 'left' && 'Returns all rows from the first dataset, plus matched rows from the second.'}
            {joinType === 'right' && 'Returns all rows from the second dataset, plus matched rows from the first.'}
            {joinType === 'outer' && 'Returns all rows from both datasets, filling in nulls where there is no match.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!leftColumn || !rightColumn}
            className="btn-primary"
          >
            Create Link
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LINK DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LinkDisplayProps {
  link: DatasetLink;
  datasets: Dataset[];
  onRemove: () => void;
}

const LinkDisplay: React.FC<LinkDisplayProps> = ({ link, datasets, onRemove }) => {
  const leftDataset = datasets.find(d => d.id === link.leftDatasetId);
  const rightDataset = datasets.find(d => d.id === link.rightDatasetId);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group">
      <div className="flex-1 flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {leftDataset?.name}
        </span>
        <span className="px-2 py-0.5 rounded bg-prism-100 dark:bg-prism-900 text-prism-600 dark:text-prism-400 text-xs">
          {link.leftColumn}
        </span>
        <span className="text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs uppercase">
          {link.joinType}
        </span>
        <span className="text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
        <span className="px-2 py-0.5 rounded bg-prism-100 dark:bg-prism-900 text-prism-600 dark:text-prism-400 text-xs">
          {link.rightColumn}
        </span>
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {rightDataset?.name}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Remove link"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const DatasetManager: React.FC = () => {
  // Connect to store
  const datasets = usePrismStore(state => state.datasets);
  const links = usePrismStore(state => state.datasetLinks);
  const processing = usePrismStore(state => state.processing);
  const addDataset = usePrismStore(state => state.addDataset);
  const removeDataset = usePrismStore(state => state.removeDataset);
  const addDatasetLink = usePrismStore(state => state.addDatasetLink);
  const removeDatasetLink = usePrismStore(state => state.removeDatasetLink);
  const processLinkedDatasets = usePrismStore(state => state.processLinkedDatasets);

  const isProcessing = processing.status !== 'idle' && processing.status !== 'complete' && processing.status !== 'error';

  const [showLinkBuilder, setShowLinkBuilder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    for (const file of acceptedFiles) {
      await addDataset(file);
    }
    setIsUploading(false);
  }, [addDataset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: MAX_FILE_SIZE,
    disabled: isProcessing || isUploading,
  });

  const linkedDatasetIds = new Set(
    links.flatMap(l => [l.leftDatasetId, l.rightDatasetId])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Dataset Manager
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload multiple datasets and link them together for combined analysis
          </p>
        </div>
        {datasets.length >= 2 && (
          <button
            onClick={() => setShowLinkBuilder(true)}
            disabled={isProcessing}
            className="btn-secondary"
          >
            <LinkIcon />
            Link Datasets
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-prism-400 bg-prism-50 dark:bg-prism-950/50'
            : 'border-slate-200 dark:border-slate-700 hover:border-prism-400 hover:bg-slate-50 dark:hover:bg-slate-800/50',
          (isProcessing || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-xl bg-prism-100 dark:bg-prism-900/50 text-prism-600 dark:text-prism-400">
            <PlusIcon />
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {isDragActive ? 'Drop files here' : 'Add datasets'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Drag & drop or click to upload CSV/Excel files
            </p>
          </div>
        </div>
      </div>

      {/* Datasets Grid */}
      {datasets.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TableIcon />
            Loaded Datasets ({datasets.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {datasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onRemove={() => removeDataset(dataset.id)}
                isLinked={linkedDatasetIds.has(dataset.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Link Builder Modal */}
      {showLinkBuilder && datasets.length >= 2 && (
        <LinkBuilder
          datasets={datasets}
          onAddLink={addDatasetLink}
          onClose={() => setShowLinkBuilder(false)}
        />
      )}

      {/* Active Links */}
      {links.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LinkIcon />
            Dataset Links ({links.length})
          </h4>
          <div className="space-y-2">
            {links.map((link) => (
              <LinkDisplay
                key={link.id}
                link={link}
                datasets={datasets}
                onRemove={() => removeDatasetLink(link.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {datasets.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={processLinkedDatasets}
            disabled={isProcessing}
            className="btn-primary text-lg px-8"
          >
            <PlayIcon />
            {isProcessing ? 'Analyzing...' : `Analyze ${datasets.length === 1 ? 'Dataset' : `${datasets.length} Datasets`}`}
          </button>
        </div>
      )}

      {/* Help Text */}
      {datasets.length === 1 && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          💡 Tip: Add another dataset to enable linking and combined analysis
        </p>
      )}
    </div>
  );
};

export default DatasetManager;
