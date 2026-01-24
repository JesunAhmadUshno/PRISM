/**
 * PRISM FileUploader Component
 * 
 * Accessible drag-and-drop file upload zone with:
 * - Full keyboard navigation
 * - Screen reader announcements
 * - Visual feedback
 * - File type validation
 * 
 * Compliance: WCAG 2.2 Level AAA
 */

import React, { useCallback, useId, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { clsx } from 'clsx';
import { MAX_FILE_SIZE, SUPPORTED_TYPES } from '@/security/validator';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isProcessing = false,
  className,
}) => {
  const id = useId();
  const [announcement, setAnnouncement] = useState<string>('');

  // Handle successful file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setAnnouncement(`File ${file.name} selected. Size: ${(file.size / 1024).toFixed(1)} kilobytes.`);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  // Handle rejected files
  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (rejection) {
      const error = rejection.errors[0];
      const message = error?.code === 'file-too-large'
        ? `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
        : error?.code === 'file-invalid-type'
        ? 'Invalid file type. Please upload a CSV, Excel, or XML file.'
        : 'File could not be uploaded. Please try again.';
      
      setAnnouncement(`Error: ${message}`);
    }
  }, []);

  // Configure dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isProcessing,
    noClick: false,
    noKeyboard: false,
  });

  // Determine visual state
  const getStateStyles = () => {
    if (isProcessing) {
      return 'border-prism-400 bg-prism-50 dark:bg-prism-900 cursor-wait opacity-60';
    }
    if (isDragReject) {
      return 'border-red-500 bg-red-50 dark:bg-red-950 border-dashed';
    }
    if (isDragAccept) {
      return 'border-green-500 bg-green-50 dark:bg-green-950 border-dashed';
    }
    if (isDragActive) {
      return 'border-prism-500 bg-prism-50 dark:bg-prism-900 border-dashed';
    }
    return 'border-prism-300 dark:border-prism-700 hover:border-prism-500 hover:bg-prism-50 dark:hover:bg-prism-900';
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        id={`${id}-dropzone`}
        className={clsx(
          'relative flex flex-col items-center justify-center',
          'w-full min-h-[200px] p-8',
          'border-2 rounded-prism transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-prism-500',
          'cursor-pointer',
          getStateStyles()
        )}
        role="button"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description ${id}-formats`}
        tabIndex={0}
      >
        <input {...getInputProps()} id={`${id}-input`} aria-hidden="true" />

        {/* Upload Icon */}
        <div 
          className={clsx(
            'text-6xl mb-4 transition-transform duration-200',
            isDragActive && 'scale-110'
          )}
          aria-hidden="true"
        >
          {isDragReject ? '❌' : isDragAccept ? '✅' : isProcessing ? '⏳' : '📊'}
        </div>

        {/* Primary Label */}
        <p
          id={`${id}-label`}
          className="text-xl font-semibold text-prism-900 dark:text-prism-100 text-center mb-2"
        >
          {isProcessing
            ? 'Processing your data...'
            : isDragActive
            ? isDragReject
              ? 'This file type is not supported'
              : 'Drop your file here'
            : 'Drag & drop your data file here'}
        </p>

        {/* Secondary Description */}
        <p
          id={`${id}-description`}
          className="text-base text-prism-600 dark:text-prism-400 text-center mb-4"
        >
          {isProcessing
            ? 'Please wait while we analyze your data'
            : 'or click to browse files'}
        </p>

        {/* Supported Formats */}
        <p
          id={`${id}-formats`}
          className="text-sm text-prism-500 dark:text-prism-500 text-center"
        >
          Supported formats: CSV, Excel (.xlsx), XML • Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB
        </p>

        {/* Keyboard Instructions (visible on focus) */}
        <p className="sr-only">
          Press Enter or Space to open file browser. 
          You can also drag and drop a file onto this area.
        </p>
      </div>

      {/* Alternative Browse Button */}
      <button
        type="button"
        onClick={open}
        disabled={isProcessing}
        className={clsx(
          'w-full mt-4 py-3 px-6',
          'bg-prism-600 hover:bg-prism-700 text-white',
          'dark:bg-prism-500 dark:hover:bg-prism-600',
          'rounded-prism font-medium text-base',
          'focus-visible-ring transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-target'
        )}
        aria-describedby={`${id}-formats`}
      >
        {isProcessing ? 'Processing...' : 'Browse Files'}
      </button>

      {/* Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Security Notice */}
      <p className="mt-4 text-sm text-center text-prism-500 dark:text-prism-500">
        🔒 <strong>Your data stays private.</strong> All processing happens locally in your browser.
        No data is uploaded to any server.
      </p>
    </div>
  );
};

export default FileUploader;
