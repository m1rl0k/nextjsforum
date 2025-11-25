const { filterContent, stripHtml } = require('../lib/profanityFilter.js');

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    moderationSettings: {
      findFirst: jest.fn().mockResolvedValue({
        profanityFilter: true,
        bannedWords: 'spam',
        filterAction: 'FLAG'
      })
    }
  }
}));

describe('profanity filter', () => {
  it('flags banned words', async () => {
    const result = await filterContent('This is spam content');
    expect(result.allowed).toBe(true);
    expect(result.flagged).toBe(true);
  });

  it('passes clean text through', async () => {
    const result = await filterContent('Friendly hello world');
    expect(result.allowed).toBe(true);
    expect(result.flagged).toBe(false);
    expect(result.text).toBe('Friendly hello world');
  });

  it('strips html safely', () => {
    const plain = stripHtml('<p>Hello <strong>World</strong></p>');
    expect(plain).toBe('Hello World');
  });
});
