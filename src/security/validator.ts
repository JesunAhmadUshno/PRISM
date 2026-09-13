/**
 * PRISM Security Module - Input Validation
 * 
 * Validates all file inputs before processing.
 * First line of defense against malicious uploads.
 * 
 * @security CRITICAL - Changes require security review
 */

import type { FileMetadata, FileValidationResult, SupportedFileType } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maximum file size: 50MB
 * Prevents memory exhaustion attacks
 */
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

/**
 * Minimum file size: 10 bytes
 * Prevents empty/corrupted file processing
 */
export const MIN_FILE_SIZE = 10;

/**
 * Supported MIME types with corresponding file extensions
 */
export const SUPPORTED_TYPES: Record<string, SupportedFileType> = {
  'text/csv': 'csv',
  'application/csv': 'csv',
  'text/plain': 'csv', // Often CSV files are detected as plain text
  'application/vnd.ms-excel': 'xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

/**
 * Extensions this build can actually parse.
 *
 * XML was previously listed here, but no XML parser exists anywhere in the
 * codebase: the worker handed the raw markup to pandas.read_csv, which produced
 * silently wrong results. XML is rejected at validation until a real parser
 * ships. See UNSUPPORTED_XML_ERROR below.
 */
export const SUPPORTED_EXTENSIONS = ['csv', 'xlsx', 'xls'] as const;

/**
 * Rejection message for .xml uploads.
 * Tells the user exactly what to do instead of failing vaguely.
 */
export const UNSUPPORTED_XML_ERROR =
  'XML files are not supported. Please convert the file to CSV or Excel (.xlsx) and upload it again.';

/**
 * Magic bytes (file signatures) for supported formats
 * Used to verify file type regardless of extension
 */
export const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  xlsx: [
    new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // PK.. (ZIP format)
    new Uint8Array([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
    new Uint8Array([0x50, 0x4B, 0x07, 0x08]), // Spanned ZIP
  ],
};

/**
 * Disallowed patterns in file content (security threats)
 */
export const DANGEROUS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /<iframe[\s>]/i,
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /on\w+\s*=/i, // Event handlers
  /expression\s*\(/i, // CSS expression
  /url\s*\(\s*["']?\s*javascript/i,
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Primary file validation function
 * Performs all security checks before processing
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Check 1: File size
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  // Check 2: File extension
  const extensionResult = validateFileExtension(file.name);
  if (!extensionResult.isValid) {
    return extensionResult;
  }

  // Check 3: MIME type (with fallback for unknown types)
  const mimeResult = validateMimeType(file.type, file.name);
  if (!mimeResult.isValid) {
    return mimeResult;
  }

  // Check 4: Magic bytes (for binary formats)
  const magicResult = await validateMagicBytes(file);
  if (!magicResult.isValid) {
    return magicResult;
  }

  // Check 5: Content security scan (for text formats)
  const fileType = getFileType(file.name);
  if (fileType === 'csv') {
    const contentResult = await validateContentSecurity(file);
    if (!contentResult.isValid) {
      return contentResult;
    }
  }

  // All validations passed
  const metadata: FileMetadata = {
    name: sanitizeFileName(file.name),
    size: file.size,
    type: fileType!,
    lastModified: file.lastModified,
    mimeType: file.type || 'application/octet-stream',
  };

  return {
    isValid: true,
    metadata,
  };
}

/**
 * Validates file size is within acceptable limits
 */
export function validateFileSize(size: number): FileValidationResult {
  if (size < MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: `File is too small (${size} bytes). Minimum size is ${MIN_FILE_SIZE} bytes.`,
    };
  }

  if (size > MAX_FILE_SIZE) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File is too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates file extension is supported
 */
export function validateFileExtension(fileName: string): FileValidationResult {
  const extension = getFileExtension(fileName);

  if (extension === 'xml') {
    return {
      isValid: false,
      error: UNSUPPORTED_XML_ERROR,
    };
  }

  if (!SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return {
      isValid: false,
      error: `Unsupported file type ".${extension}". Supported types: CSV, XLSX, XLS.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates MIME type matches expected format
 */
export function validateMimeType(
  mimeType: string,
  fileName: string
): FileValidationResult {
  // If MIME type is provided and recognized, validate it
  if (mimeType && SUPPORTED_TYPES[mimeType]) {
    return { isValid: true };
  }

  // Fall back to extension-based validation
  const extension = getFileExtension(fileName);

  if (extension === 'xml') {
    return {
      isValid: false,
      error: UNSUPPORTED_XML_ERROR,
    };
  }

  if (SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `Invalid file type. Please upload a CSV or Excel file.`,
  };
}

/**
 * Validates magic bytes match expected format
 * Prevents extension spoofing attacks
 */
export async function validateMagicBytes(file: File): Promise<FileValidationResult> {
  const fileType = getFileType(file.name);
  
  // CSV files don't have magic bytes - text-based
  if (fileType === 'csv') {
    return { isValid: true };
  }

  // Read first 16 bytes for magic number check
  const header = await readFileHeader(file, 16);
  if (!header) {
    return {
      isValid: false,
      error: 'Unable to read file header. File may be corrupted.',
    };
  }

  // Check XLSX magic bytes
  if (fileType === 'xlsx') {
    const xlsxMagic = MAGIC_BYTES['xlsx'];
    const isValid = xlsxMagic?.some((magic) => matchesMagicBytes(header, magic));
    
    if (!isValid) {
      return {
        isValid: false,
        error: 'File header does not match Excel format. File may be corrupted or mislabeled.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Scans file content for dangerous patterns
 * Prevents XSS injection via file upload
 */
export async function validateContentSecurity(file: File): Promise<FileValidationResult> {
  // Read file as text for pattern scanning
  const content = await readFileAsText(file);
  if (content === null) {
    return {
      isValid: false,
      error: 'Unable to read file content.',
    };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        error: 'File contains potentially unsafe content and cannot be processed.',
      };
    }
  }

  return { isValid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extracts file extension from filename
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts[parts.length - 1] || '';
}

/**
 * Determines file type from filename
 */
function getFileType(fileName: string): SupportedFileType | null {
  const extension = getFileExtension(fileName);
  
  switch (extension) {
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    default:
      return null;
  }
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\]/g, '_') // Remove path separators
    .replace(/\.\./g, '_')  // Remove directory traversal
    .replace(/[<>:"|?*]/g, '_') // Remove special chars
    .substring(0, 255); // Limit length
}

/**
 * Reads the first N bytes of a file
 */
async function readFileHeader(file: File, bytes: number): Promise<Uint8Array | null> {
  try {
    const slice = file.slice(0, bytes);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/**
 * Checks if file header matches magic bytes
 */
function matchesMagicBytes(header: Uint8Array, magic: Uint8Array): boolean {
  if (header.length < magic.length) {
    return false;
  }
  
  for (let i = 0; i < magic.length; i++) {
    if (header[i] !== magic[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Reads entire file as text
 */
async function readFileAsText(file: File): Promise<string | null> {
  try {
    return await file.text();
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const Validator = {
  validateFile,
  validateFileSize,
  validateFileExtension,
  validateMimeType,
  validateMagicBytes,
  validateContentSecurity,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  SUPPORTED_TYPES,
  SUPPORTED_EXTENSIONS,
  UNSUPPORTED_XML_ERROR,
};

export default Validator;
