/**
 * PRISM Zustand Store
 * 
 * Centralized state management for the analytics platform.
 * Handles file upload, processing state, and results.
 * 
 * Security: All sensitive data is held only in memory and never persisted.
 */

import { create } from 'zustand';
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
  processing: initialProgress,
  error: null as ProcessingError | null,
  results: {
    summary: null as DatasetSummary | null,
    recommendations: [] as VisualizationRecommendation[],
    insights: [] as AIInsight[],
    chartConfigs: [] as ChartConfig[],
  },
  accessibility: initialAccessibility,
  activeChartIndex: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/prism.worker.ts', import.meta.url),
      { type: 'module' }
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

      // Read file content
      const content = await file.text();

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
          fileType: file.metadata.type,
          fileName: file.metadata.name,
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
}));

export default usePrismStore;
