import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(html, options = {}) {
  if (!html) return '';
  
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'img', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    ...options
  };

  // Sanitize the HTML
  let clean = DOMPurify.sanitize(html, defaultConfig);
  
  // Ensure external links have proper security attributes
  clean = clean.replace(
    /<a\s+([^>]*href=["']https?:\/\/[^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes('rel=')) {
        attrs += ' rel="noopener noreferrer"';
      }
      if (!attrs.includes('target=')) {
        attrs += ' target="_blank"';
      }
      return `<a ${attrs}>`;
    }
  );
  
  return clean;
}

/**
 * Sanitize user input text (non-HTML)
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate and sanitize email
 * @param {string} email - The email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (!email) return null;
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitize URL
 * @param {string} url - The URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

