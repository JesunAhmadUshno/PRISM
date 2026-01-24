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
// WORKER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    // Use classic worker (not module) for importScripts compatibility
    worker = new Worker(
      new URL('../workers/prism.worker.js', import.meta.url),
      { type: 'classic' }
    );
  }
  return worker;
}

function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

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
      const ext = file.name.toLowerCase().split('.').pop();
      const isExcel = ext === 'xlsx' || ext === 'xls';
      
      let content: string;
      if (isExcel) {
        // Read Excel and convert to CSV using SheetJS
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
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
        content = XLSX.utils.sheet_to_csv(sheet);
      } else {
        // Read as text for CSV/XML
        content = await file.text();
      }

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
    const ext = file.name.toLowerCase().split('.').pop();
    const isExcel = ext === 'xlsx' || ext === 'xls';
    
    let content: string;
    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Excel file has no sheets');
      }
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        throw new Error('Could not read sheet');
      }
      content = XLSX.utils.sheet_to_csv(sheet);
    } else {
      content = await file.text();
    }

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
