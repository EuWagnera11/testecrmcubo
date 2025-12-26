/**
 * Security sanitization utilities
 * Prevents XSS attacks and cleans user input
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string by trimming and escaping HTML
 */
export function sanitizeString(input: unknown): string {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);
  return escapeHtml(input.trim());
}

/**
 * Sanitize a string for database storage (trim, limit length)
 * Does NOT escape HTML - use for storage, not display
 */
export function sanitizeForStorage(input: unknown, maxLength: number = 10000): string {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input).slice(0, maxLength);
  return input.trim().slice(0, maxLength);
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(email: unknown): string {
  if (!email || typeof email !== 'string') return '';
  // Remove any characters that shouldn't be in an email
  return email.trim().toLowerCase().replace(/[<>'"]/g, '');
}

/**
 * Sanitize a phone number
 */
export function sanitizePhone(phone: unknown): string {
  if (!phone || typeof phone !== 'string') return '';
  // Keep only digits, spaces, hyphens, plus, and parentheses
  return phone.trim().replace(/[^\d\s\-\+\(\)]/g, '');
}

/**
 * Sanitize a URL
 */
export function sanitizeUrl(url: unknown): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  
  // Check for potentially dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize an object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  
  for (const key in result) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeForStorage(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  
  return result;
}

/**
 * Validate and sanitize a numeric value
 */
export function sanitizeNumber(value: unknown, min?: number, max?: number): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(num)) return 0;
  
  let result = num;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  
  return result;
}

/**
 * Remove potential SQL injection patterns (extra layer of defense)
 * Note: Always use parameterized queries - this is just an extra precaution
 */
export function sanitizeSqlInput(input: unknown): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}
