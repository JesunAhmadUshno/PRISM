/**
 * PRISM Zustand Store
 * 
 * Centralized state management for the analytics platform.
 * Handles file upload, processing state, and results.
 * 
 * Security: All sensitive data is held only in memory and never persisted.
 */

import { create } from 'zustand';
import * as XLSX from 'xlsx';
import type {
  PrismState,
  FileMetadata,
  ProcessingProgress,
  ProcessingError,
  DatasetSummary,
  VisualizationRecommendation,
  AIInsight,
  ChartConfig,
  AccessibilitySettings,
  WorkerMessage,
  WorkerResultPayload,
} from '@/types';
import { validateFile } from '@/security/validator';
// Inlined at build time so the worker can be started from a blob: URL (see getWorker)
import prismWorkerSource from '../workers/prism.worker.js?raw';

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialAccessibility: AccessibilitySettings = {
  fontSize: 'normal',
  colorScheme: 'system',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  sonificationEnabled: true,
  screenReaderMode: false,
};

const initialProgress: ProcessingProgress = {
  status: 'idle',
  progress: 0,
  message: '',
  accessibleMessage: '',
};

const initialState = {
  file: {
    metadata: null as FileMetadata | null,
    content: null as string | null,
    validationStatus: 'pending' as const,
    validationError: null as string | null,
  },
  // Multi-dataset state
  datasets: [] as import('@/types').Dataset[],
  datasetLinks: [] as import('@/types').DatasetLink[],
  activeDatasetId: null as string | null,
  
  processing: initialProgress,
  error: null as ProcessingError | null,
  results: {
    summary: null as DatasetSummary | null,
    recommendations: [] as VisualizationRecommendation[],
    insights: [] as AIInsight[],
    chartConfigs: [] as ChartConfig[],
  },
  customAnalysisResults: null as import('@/types').CustomAnalysisResult | null,
  accessibility: initialAccessibility,
  activeChartIndex: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// FILE READING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upper bound on rows pulled out of a workbook. XLSX.read runs on the main
 * thread, so an unbounded sheet - a zip bomb still under the 500MB file limit -
 * would otherwise hang the UI with no recovery path.
 */
const MAX_SHEET_ROWS = 100000;

/**
 * Parser surface is pinned off deliberately: formulas, HTML rendering, number
 * formats, styles and VBA are all attacker-controlled and none of them are used
 * by PRISM - only cell values reach sheet_to_csv.
 */
const XLSX_READ_OPTIONS: XLSX.ParsingOptions = {
  type: 'array',
  sheetRows: MAX_SHEET_ROWS,
  cellFormula: false,
  cellHTML: false,
  cellNF: false,
  cellStyles: false,
  bookVBA: false,
  bookDeps: false,
};

/**
 * Parse a workbook and return its first sheet as CSV.
 *
 * Security: xlsx@0.18.5 is the deprecated npm SheetJS build affected by
 * CVE-2023-30533 - prototype pollution reachable through XLSX.read on a crafted
 * workbook, which is exactly this call, on bytes the user just dragged in and
 * which XLSX validation never inspects. The npm package is frozen at 0.18.5 and
 * will never be patched, so the parse is bracketed here: anything it adds to
 * Object.prototype is stripped again before the result is used, on the error
 * path as well as the success path.
 */
function readWorkbookAsCsv(buffer: ArrayBuffer): string {
  const prototypeKeysBefore = new Set<PropertyKey>(Reflect.ownKeys(Object.prototype));

  try {
    const workbook = XLSX.read(buffer, XLSX_READ_OPTIONS);

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel file has no sheets');
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error('Could not read sheet');
    }

    // Convert to CSV
    return XLSX.utils.sheet_to_csv(sheet);
  } finally {
    for (const key of Reflect.ownKeys(Object.prototype)) {
      if (!prototypeKeysBefore.has(key)) {
        Reflect.deleteProperty(Object.prototype, key);
      }
    }
  }
}

/**
 * Read an uploaded file as text, converting Excel workbooks to CSV.
 *
 * Single entry point on purpose - the hardening above must not end up applied to
 * only one of the two upload paths.
 */
async function readFileContent(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  const isExcel = ext === 'xlsx' || ext === 'xls';

  if (isExcel) {
    // Read Excel and convert to CSV using SheetJS
    const buffer = await file.arrayBuffer();
    return readWorkbookAsCsv(buffer);
  }

  // XML is advertised in the uploader, the validator and the README, but no XML
  // parser exists anywhere in this codebase: the worker has zero XML handling,
  // so the raw "<?xml ...>" text was previously handed to pandas.read_csv. That
  // produced garbage columns presented as a successful analysis rather than an
  // error, which is the worst possible outcome for a product whose buyers are
  // auditors. Fail loudly until a real parser is implemented.
  if (ext === 'xml') {
    throw new Error(
      'XML is not supported yet. The format is listed in the interface by mistake: ' +
        'no XML parser is implemented, and parsing it as CSV would produce incorrect ' +
        'results rather than an error. Convert the file to CSV or Excel first.'
    );
  }

  // Read as text for CSV
  return file.text();
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let worker: Worker | null = null;
let workerBlobUrl: string | null = null;
let workerWarmUpRequested = false;

function getWorker(): Worker {
  if (!worker) {
    // Security: the worker is the only thread that ever holds the plaintext
    // user data, so it must run under the document's Content-Security-Policy.
    // A worker loaded from an https: URL does NOT inherit the document policy -
    // its policy is built from the worker script's own response headers, and the
    // GitHub Pages deploy target cannot send any, so the worker would execute
    // unpoliced with fetch/XHR/WebSocket/importScripts open to every origin.
    // blob: is a local scheme, so a worker created from one inherits the
    // creating document's policy container (the CSP in index.html), which
    // denies every origin except the Pyodide CDN.
    if (!workerBlobUrl) {
      workerBlobUrl = URL.createObjectURL(
        new Blob([prismWorkerSource], { type: 'text/javascript' })
      );
    }
    // Use classic worker (not module) for importScripts compatibility
    worker = new Worker(workerBlobUrl, { type: 'classic' });
  }
  return worker;
}

/**
 * Create the worker and ask it to start loading Pyodide + pandas/numpy (~25 MB)
 * before any file is picked, so the download overlaps the user reading the
 * landing page instead of being serialised behind file validation and reading.
 *
 * Safe to call repeatedly: the worker's initializePyodide() is idempotent, and
 * no message handler is attached here so in-flight progress belongs to whichever
 * action runs next.
 */
export function warmUpWorker(): void {
  if (typeof Worker === 'undefined' || workerWarmUpRequested) {
    return;
  }
  workerWarmUpRequested = true;

  try {
    getWorker().postMessage({
      type: 'INIT',
      payload: {},
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  } catch (error) {
    // Warm-up is best effort - never block app start. getWorker() will create
    // the worker again on demand, which self-initialises on load.
    workerWarmUpRequested = false;
    console.error('Pyodide warm-up failed:', error);
  }
}

function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    workerWarmUpRequested = false;
  }
  if (workerBlobUrl) {
    URL.revokeObjectURL(workerBlobUrl);
    workerBlobUrl = null;
  }
}

// Start the Pyodide/pandas download as soon as the store module is imported.
warmUpWorker();

// ═══════════════════════════════════════════════════════════════════════════
// STORE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const usePrismStore = create<PrismState>((set, get) => ({
  ...initialState,

  /**
   * Handle file selection and validation
   */
  setFile: async (file: File) => {
    // Reset previous state
    set({
      file: {
        metadata: null,
        content: null,
        validationStatus: 'pending',
        validationError: null,
      },
      processing: {
        status: 'validating',
        progress: 10,
        message: 'Validating file...',
        accessibleMessage: 'Validating your file. Please wait.',
      },
      error: null,
      results: {
        summary: null,
        recommendations: [],
        insights: [],
        chartConfigs: [],
      },
    });

    try {
      // Validate file
      const validationResult = await validateFile(file);

      if (!validationResult.isValid) {
        set({
          file: {
            metadata: null,
            content: null,
            validationStatus: 'invalid',
            validationError: validationResult.error || 'Invalid file',
          },
          processing: initialProgress,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error || 'File validation failed',
            recoverable: true,
          },
        });
        return;
      }

      // Read file content - convert Excel to CSV if needed
      const content = await readFileContent(file);

      set({
        file: {
          metadata: validationResult.metadata!,
          content,
          validationStatus: 'valid',
          validationError: null,
        },
        processing: {
          status: 'parsing',
          progress: 30,
          message: 'File validated successfully',
          accessibleMessage: `File ${validationResult.metadata!.name} validated. Ready for analysis.`,
        },
      });

      // Auto-start processing
      await get().processData();

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({
        file: {
          ...get().file,
          validationStatus: 'invalid',
          validationError: message,
        },
        processing: initialProgress,
        error: {
          code: 'FILE_ERROR',
          message,
          recoverable: true,
        },
      });
    }
  },

  /**
   * Clear current file and results
   */
  clearFile: () => {
    terminateWorker();
    set({
      ...initialState,
      accessibility: get().accessibility, // Preserve accessibility settings
    });
  },

  /**
   * Process loaded file data through Pyodide
   */
  processData: async () => {
    const { file } = get();

    if (!file.content || !file.metadata) {
      set({
        error: {
          code: 'NO_DATA',
          message: 'No file loaded',
          recoverable: true,
        },
      });
      return;
    }

    set({
      processing: {
        status: 'analyzing',
        progress: 40,
        message: 'Starting analysis...',
        accessibleMessage: 'Starting data analysis. This may take a moment.',
      },
    });

    return new Promise<void>((resolve, reject) => {
      const prismWorker = getWorker();

      // Handle worker messages
      prismWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PROGRESS':
            set({ processing: payload as ProcessingProgress });
            break;

          case 'RESULT': {
            const results = payload as WorkerResultPayload;
            set({
              results: {
                summary: results.summary,
                recommendations: results.recommendations,
                insights: results.insights,
                chartConfigs: results.chartData,
              },
              processing: {
                status: 'complete',
                progress: 100,
                message: 'Analysis complete!',
                accessibleMessage: `Analysis complete. Found ${results.insights.length} insights and ${results.recommendations.length} chart recommendations.`,
              },
            });
            resolve();
            break;
          }

          case 'ERROR':
            set({
              error: payload as ProcessingError,
              processing: {
                status: 'error',
                progress: 0,
                message: (payload as ProcessingError).message,
                accessibleMessage: `Error: ${(payload as ProcessingError).message}`,
              },
            });
            reject(new Error((payload as ProcessingError).message));
            break;
        }
      };

      // Handle worker errors
      prismWorker.onerror = (error) => {
        set({
          error: {
            code: 'WORKER_ERROR',
            message: error.message || 'Worker error',
            recoverable: true,
          },
          processing: {
            status: 'error',
            progress: 0,
            message: 'Analysis failed',
            accessibleMessage: 'Analysis failed. Please try again.',
          },
        });
        reject(error);
      };

      // Send data to worker
      prismWorker.postMessage({
        type: 'PROCESS_FILE',
        payload: {
          fileContent: file.content,
          fileType: file.metadata!.type,
          fileName: file.metadata!.name,
        },
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      });
    });
  },

  /**
   * Update accessibility settings
   */
  setAccessibility: (settings: Partial<AccessibilitySettings>) => {
    set({
      accessibility: {
        ...get().accessibility,
        ...settings,
      },
    });
  },

  /**
   * Set active chart index
   */
  setActiveChart: (index: number) => {
    set({ activeChartIndex: index });
  },

  /**
   * Full reset to initial state
   */
  reset: () => {
    terminateWorker();
    set({
      ...initialState,
      accessibility: get().accessibility,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-DATASET ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a new dataset
   */
  addDataset: async (file: File) => {
    const validationResult = await validateFile(file);
    
    if (!validationResult.isValid) {
      set({
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error || 'File validation failed',
          recoverable: true,
        },
      });
      return;
    }

    // Read file content
    const content = await readFileContent(file);

    // Extract columns from first row
    const firstLine = content.split('\n')[0];
    if (!firstLine) {
      throw new Error('File is empty');
    }
    const columns = firstLine.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    const rowCount = content.split('\n').filter(line => line.trim()).length - 1;

    const newDataset: import('@/types').Dataset = {
      id: crypto.randomUUID(),
      name: file.name,
      metadata: validationResult.metadata!,
      content,
      columns,
      rowCount,
      isActive: get().datasets.length === 0, // First dataset is active
    };

    const currentDatasets = get().datasets;
    set({
      datasets: [...currentDatasets, newDataset],
      activeDatasetId: get().activeDatasetId || newDataset.id,
    });
  },

  /**
   * Remove a dataset
   */
  removeDataset: (id: string) => {
    const filteredDatasets = get().datasets.filter(d => d.id !== id);
    const filteredLinks = get().datasetLinks.filter(
      l => l.leftDatasetId !== id && l.rightDatasetId !== id
    );
    
    set({
      datasets: filteredDatasets,
      datasetLinks: filteredLinks,
      activeDatasetId: filteredDatasets.length > 0 ? filteredDatasets[0]?.id ?? null : null,
    });
  },

  /**
   * Set active dataset
   */
  setActiveDataset: (id: string) => {
    set({
      datasets: get().datasets.map(d => ({
        ...d,
        isActive: d.id === id,
      })),
      activeDatasetId: id,
    });
  },

  /**
   * Add a link between two datasets
   */
  addDatasetLink: (link: Omit<import('@/types').DatasetLink, 'id'>) => {
    const newLink: import('@/types').DatasetLink = {
      ...link,
      id: crypto.randomUUID(),
    };
    set({
      datasetLinks: [...get().datasetLinks, newLink],
    });
  },

  /**
   * Remove a dataset link
   */
  removeDatasetLink: (id: string) => {
    set({
      datasetLinks: get().datasetLinks.filter(l => l.id !== id),
    });
  },

  /**
   * Process linked datasets (merge/join and analyze)
   */
  processLinkedDatasets: async () => {
    const { datasets, datasetLinks } = get();

    if (datasets.length === 0) {
      set({
        error: {
          code: 'NO_DATA',
          message: 'No datasets loaded',
          recoverable: true,
        },
      });
      return;
    }

    set({
      processing: {
        status: 'analyzing',
        progress: 20,
        message: 'Preparing datasets...',
        accessibleMessage: 'Preparing linked datasets for analysis.',
      },
    });

    return new Promise<void>((resolve, reject) => {
      const prismWorker = getWorker();

      prismWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PROGRESS':
            set({ processing: payload as ProcessingProgress });
            break;

          case 'RESULT': {
            const results = payload as WorkerResultPayload;
            set({
              results: {
                summary: results.summary,
                recommendations: results.recommendations,
                insights: results.insights,
                chartConfigs: results.chartData,
              },
              processing: {
                status: 'complete',
                progress: 100,
                message: 'Analysis complete!',
                accessibleMessage: `Analysis complete. Found ${results.insights.length} insights.`,
              },
            });
            resolve();
            break;
          }

          case 'ERROR':
            set({
              error: payload as ProcessingError,
              processing: {
                status: 'error',
                progress: 0,
                message: (payload as ProcessingError).message,
                accessibleMessage: `Error: ${(payload as ProcessingError).message}`,
              },
            });
            reject(new Error((payload as ProcessingError).message));
            break;
        }
      };

      prismWorker.onerror = (error) => {
        set({
          error: {
            code: 'WORKER_ERROR',
            message: error.message || 'Worker error',
            recoverable: true,
          },
        });
        reject(error);
      };

      // Send datasets and links to worker
      prismWorker.postMessage({
        type: 'PROCESS_LINKED_DATASETS',
        payload: {
          datasets: datasets.map(d => ({
            id: d.id,
            name: d.name,
            content: d.content,
            columns: d.columns,
          })),
          links: datasetLinks,
        },
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      });
    });
  },

  /**
   * Run custom analysis (statistical tests, visualizations, preprocessing)
   */
  runCustomAnalysis: async (config: import('@/types').CustomAnalysisConfig): Promise<import('@/types').CustomAnalysisResult> => {
    const { file, datasets, activeDatasetId } = get();
    
    // Get current data content
    let dataContent = file.content;
    if (!dataContent && datasets.length > 0) {
      const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];
      dataContent = activeDataset?.content || null;
    }
    
    if (!dataContent) {
      const result: import('@/types').CustomAnalysisResult = {
        type: config.type,
        success: false,
        error: 'No data available for analysis',
      };
      set({ customAnalysisResults: result });
      return result;
    }

    set({
      processing: {
        status: 'analyzing',
        progress: 30,
        message: `Running ${config.type}...`,
        accessibleMessage: `Running custom ${config.type} analysis.`,
      },
    });

    return new Promise((resolve, reject) => {
      const prismWorker = getWorker();

      prismWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PROGRESS':
            set({ processing: payload as ProcessingProgress });
            break;

          case 'CUSTOM_ANALYSIS_RESULT': {
            const result = payload as import('@/types').CustomAnalysisResult;
            set({
              customAnalysisResults: result,
              processing: {
                status: 'complete',
                progress: 100,
                message: 'Analysis complete!',
                accessibleMessage: 'Custom analysis completed successfully.',
              },
            });
            resolve(result);
            break;
          }

          case 'ERROR':
            const errorResult: import('@/types').CustomAnalysisResult = {
              type: config.type,
              success: false,
              error: (payload as ProcessingError).message,
            };
            set({
              customAnalysisResults: errorResult,
              processing: {
                status: 'error',
                progress: 0,
                message: (payload as ProcessingError).message,
                accessibleMessage: `Error: ${(payload as ProcessingError).message}`,
              },
            });
            resolve(errorResult);
            break;
        }
      };

      prismWorker.onerror = (error) => {
        const errorResult: import('@/types').CustomAnalysisResult = {
          type: config.type,
          success: false,
          error: error.message || 'Worker error',
        };
        set({ customAnalysisResults: errorResult });
        reject(error);
      };

      // Send analysis request to worker
      prismWorker.postMessage({
        type: 'CUSTOM_ANALYSIS',
        payload: {
          config,
          dataContent,
        },
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      });
    });
  },
}));

export default usePrismStore;
