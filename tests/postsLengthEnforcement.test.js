const { stripHtml } = require('../lib/profanityFilter');

describe('stripHtml utility', () => {
  it('preserves plain text length after stripping', () => {
    const html = '<div>Hello <em>world</em>!</div>';
    const plain = stripHtml(html);
    // stripHtml replaces tags with spaces, so "Hello world!" becomes "Hello  world !"
    // After trim and space normalization, it should be "Hello world !"
    expect(plain.trim()).toBe('Hello world !');
  });
});
