jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    moderationSettings: {
      findFirst: jest.fn()
    }
  }
}));

const prisma = require('../lib/prisma').default;
const { filterContent, filterHtmlContent, clearModerationCache } = require('../lib/profanityFilter');

describe('profanity filter HTML behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearModerationCache();
  });

  it('blocks banned words when action is BLOCK', async () => {
    prisma.moderationSettings.findFirst.mockResolvedValue({
      profanityFilter: true,
      bannedWords: 'spam',
      filterAction: 'BLOCK'
    });
    const result = await filterContent('this is spam here');
    expect(result.allowed).toBe(false);
    expect(result.flagged).toBe(false);
  });

  it('flags but allows when action is FLAG on HTML', async () => {
    prisma.moderationSettings.findFirst.mockResolvedValue({
      profanityFilter: true,
      bannedWords: 'spam',
      filterAction: 'FLAG'
    });
    const result = await filterHtmlContent('<p>spam content</p>');
    expect(result.allowed).toBe(true);
    expect(result.flagged).toBe(true);
  });
});
