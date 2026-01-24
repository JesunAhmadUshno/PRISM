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
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const UploadCloudIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileSpreadsheetIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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
      return 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 cursor-wait opacity-60';
    }
    if (isDragReject) {
      return 'border-red-400 bg-red-50 dark:bg-red-950/50 border-dashed scale-[1.02]';
    }
    if (isDragAccept) {
      return 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-dashed scale-[1.02]';
    }
    if (isDragActive) {
      return 'border-prism-400 bg-prism-50 dark:bg-prism-950/50 border-dashed scale-[1.02]';
    }
    return 'border-slate-200 dark:border-slate-700 hover:border-prism-400 hover:bg-slate-50 dark:hover:bg-slate-800/50';
  };

  const getIconColor = () => {
    if (isDragReject) return 'text-red-400';
    if (isDragAccept) return 'text-emerald-400';
    if (isDragActive) return 'text-prism-400';
    return 'text-slate-400 dark:text-slate-500';
  };

  const renderIcon = () => {
    if (isDragReject) return <XCircleIcon />;
    if (isDragAccept) return <CheckCircleIcon />;
    if (isProcessing) return <FileSpreadsheetIcon />;
    return <UploadCloudIcon />;
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        id={`${id}-dropzone`}
        className={clsx(
          'relative flex flex-col items-center justify-center',
          'w-full min-h-[280px] p-8',
          'border-2 rounded-2xl transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-prism-500 focus-visible:ring-offset-2',
          'cursor-pointer group',
          'bg-white dark:bg-slate-900/50',
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
            'mb-6 transition-all duration-300',
            getIconColor(),
            isDragActive ? 'scale-110' : 'group-hover:scale-105 group-hover:text-prism-500'
          )}
          aria-hidden="true"
        >
          {renderIcon()}
        </div>

        {/* Primary Label */}
        <p
          id={`${id}-label`}
          className="text-xl font-semibold text-slate-900 dark:text-slate-100 text-center mb-2"
        >
          {isProcessing
            ? 'Processing your data...'
            : isDragActive
            ? isDragReject
              ? 'This file type is not supported'
              : 'Drop your file here'
            : 'Drag & drop your data file'}
        </p>

        {/* Secondary Description */}
        <p
          id={`${id}-description`}
          className="text-base text-slate-500 dark:text-slate-400 text-center mb-6"
        >
          {isProcessing
            ? 'Please wait while we analyze your data'
            : 'or click anywhere to browse'}
        </p>

        {/* Supported Formats - Badges */}
        <div id={`${id}-formats`} className="flex flex-wrap items-center justify-center gap-2">
          {['CSV', 'Excel (.xlsx)', 'XML'].map((format) => (
            <span 
              key={format}
              className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {format}
            </span>
          ))}
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Max {MAX_FILE_SIZE / (1024 * 1024)}MB
          </span>
        </div>

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
        className="btn-primary w-full mt-4"
        aria-describedby={`${id}-formats`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {isProcessing ? 'Processing...' : 'Select File'}
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
    </div>
  );
};

export default FileUploader;
