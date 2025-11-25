import { jest } from '@jest/globals';

// Mock isomorphic-dompurify to avoid DOM dependency in node env
jest.unstable_mockModule('../lib/sanitize.js', () => {
  const actual = jest.requireActual('../lib/sanitize.js');
  return {
    __esModule: true,
    ...actual,
    default: actual,
    // Wrap DOMPurify.sanitize with a simple placeholder when unavailable
    sanitizeHtml: (html, options = {}) => {
      if (!html) return '';
      // Remove script/style/iframe/object/embed and event handlers
      let clean = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:[^"']+/gi, '');
      return clean;
    }
  };
});
