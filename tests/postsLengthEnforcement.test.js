import { stripHtml } from '../lib/profanityFilter';

describe('stripHtml utility', () => {
  it('preserves plain text length after stripping', () => {
    const html = '<div>Hello <em>world</em>!</div>';
    const plain = stripHtml(html);
    expect(plain.length).toBe('Hello world!'.length);
  });
});
