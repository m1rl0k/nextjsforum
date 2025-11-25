const { sanitizeText, sanitizeEmail, sanitizeUrl } = require('../lib/sanitize');

describe('sanitize text/email/url', () => {
  it('strips angle brackets from text', () => {
    expect(sanitizeText('<b>hi</b>')).toBe('bhi/b');
  });

  it('validates and lowercases email', () => {
    expect(sanitizeEmail('USER@Example.COM')).toBe('user@example.com');
    expect(sanitizeEmail('not-an-email')).toBeNull();
  });

  it('allows http/https/mailto URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('mailto:test@example.com')).toContain('mailto:');
  });

  it('rejects unsupported protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('ftp://example.com')).toBeNull();
  });
});
