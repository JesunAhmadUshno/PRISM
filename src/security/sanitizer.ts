/**
 * PRISM Security Module - Input Sanitization
 * 
 * Implements defense-in-depth sanitization for all data entering the UI.
 * Compliant with OWASP Top 10 XSS prevention guidelines.
 * 
 * @security CRITICAL - Changes require security review
 */

import DOMPurify from 'dompurify';

// ═══════════════════════════════════════════════════════════════════════════
// DOMPURIFY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strict DOMPurify configuration
 * - No dangerous tags allowed
 * - No event handlers
 * - No external resources
 */
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'span', 'strong', 'em', 'b', 'i', 'u', 's',
    // Structure
    'div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Tables (for accessible data display)
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Misc safe
    'br', 'hr', 'abbr', 'code', 'pre', 'blockquote', 'cite', 'time',
  ],
  ALLOWED_ATTR: [
    // Accessibility attributes - CRITICAL for screen readers
    'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 
    'aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant',
    'aria-expanded', 'aria-controls', 'aria-haspopup', 'aria-selected',
    'aria-checked', 'aria-disabled', 'aria-invalid', 'aria-required',
    'aria-sort', 'aria-colcount', 'aria-colindex', 'aria-rowcount', 
    'aria-rowindex', 'aria-colspan', 'aria-rowspan',
    // Table attributes
    'scope', 'headers', 'colspan', 'rowspan',
    // Generic safe attributes
    'id', 'class', 'title', 'lang', 'dir', 'tabindex',
    'data-testid', 'data-chart-index', 'data-column-name',
  ],
  // Security: Block all URI attributes
  ALLOW_DATA_ATTR: true,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOW_SELF_CLOSE_IN_ATTR: false,
  // Remove dangerous content
  FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'base'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup', 'onkeypress', 'style', 'href', 'src', 'action', 'formaction', 'xlink:href'],
  // Additional security
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  FORCE_BODY: false,
  IN_PLACE: false,
};

/**
 * Plain text configuration - strips ALL HTML
 */
const PLAIN_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// SANITIZATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitizes HTML string for safe DOM insertion
 * Use for any user-generated or file-parsed content
 * 
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string safe for innerHTML
 * 
 * @example
 * const safe = sanitizeHTML('<script>alert("xss")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeHTML(dirty: string): string {
  if (typeof dirty !== 'string') {
    console.warn('[Sanitizer] Non-string input received, converting');
    dirty = String(dirty);
  }
  return DOMPurify.sanitize(dirty, STRICT_CONFIG);
}

/**
 * Converts HTML to plain text, stripping all tags
 * Use for screen reader content or plain text displays
 * 
 * @param dirty - HTML string to strip
 * @returns Plain text string
 */
export function sanitizeToPlainText(dirty: string): string {
  if (typeof dirty !== 'string') {
    dirty = String(dirty);
  }
  // First sanitize, then strip tags
  const sanitized = DOMPurify.sanitize(dirty, PLAIN_TEXT_CONFIG);
  // Additional cleanup for any remaining entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = sanitized;
  return textarea.value.trim();
}

/**
 * Escapes HTML special characters for safe text display
 * Use when you need to display code or raw data
 * 
 * @param unsafe - String with potential HTML characters
 * @returns Escaped string
 */
export function escapeHTML(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    unsafe = String(unsafe);
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes a value for safe display in UI
 * Handles various data types appropriately
 * 
 * @param value - Any value from parsed data
 * @returns Safely displayable string
 */
export function sanitizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 'N/A';
    }
    return value.toLocaleString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  if (typeof value === 'string') {
    // Truncate extremely long strings
    const maxLength = 10000;
    const truncated = value.length > maxLength 
      ? value.substring(0, maxLength) + '...' 
      : value;
    return escapeHTML(truncated);
  }
  
  // For objects/arrays, stringify safely
  try {
    return escapeHTML(JSON.stringify(value));
  } catch {
    return '[Complex Value]';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA SANITIZATION FOR CHARTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitizes chart data point for safe rendering
 * Ensures all values are safe primitives
 */
export function sanitizeChartData<T extends Record<string, unknown>>(
  data: readonly T[]
): T[] {
  return data.map((point) => {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(point)) {
      // Sanitize key (column name)
      const safeKey = sanitizeToPlainText(key).substring(0, 100);
      
      // Sanitize value based on type
      if (typeof value === 'number') {
        sanitized[safeKey] = Number.isFinite(value) ? value : null;
      } else if (typeof value === 'string') {
        sanitized[safeKey] = sanitizeToPlainText(value).substring(0, 1000);
      } else if (value === null || value === undefined) {
        sanitized[safeKey] = null;
      } else {
        sanitized[safeKey] = sanitizeToPlainText(String(value));
      }
    }
    
    return sanitized as T;
  });
}

/**
 * Sanitizes column names for safe display
 */
export function sanitizeColumnName(name: string): string {
  return sanitizeToPlainText(name)
    .substring(0, 100)
    .replace(/[^\w\s\-_.]/g, '');
}

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitizes AI-generated insights for safe display
 */
export function sanitizeInsight(insight: {
  title: string;
  description: string;
  accessibleDescription: string;
}): {
  title: string;
  description: string;
  accessibleDescription: string;
} {
  return {
    title: sanitizeToPlainText(insight.title).substring(0, 200),
    description: sanitizeHTML(insight.description),
    accessibleDescription: sanitizeToPlainText(insight.accessibleDescription).substring(0, 500),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Logs sanitization events for security monitoring
 * In production, this could send to a local audit log
 */
export function logSanitizationEvent(
  type: 'html' | 'text' | 'value' | 'chart' | 'insight',
  inputLength: number,
  outputLength: number
): void {
  const removed = inputLength - outputLength;
  if (removed > 0 && removed > inputLength * 0.1) {
    console.warn(
      `[Security] Sanitizer removed ${removed} characters (${((removed / inputLength) * 100).toFixed(1)}%) from ${type} input`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT SANITIZER
// ═══════════════════════════════════════════════════════════════════════════

export const Sanitizer = {
  html: sanitizeHTML,
  text: sanitizeToPlainText,
  escape: escapeHTML,
  value: sanitizeValue,
  chartData: sanitizeChartData,
  columnName: sanitizeColumnName,
  insight: sanitizeInsight,
};

export default Sanitizer;
