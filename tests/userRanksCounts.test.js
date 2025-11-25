// Additional tests for rank user counts and formatting
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    userRank: {
      findMany: jest.fn().mockResolvedValue(null)
    },
    user: {
      count: jest.fn().mockResolvedValue(5)
    }
  }
}));

const prisma = require('../lib/prisma').default;
const { getRanksWithUserCounts, formatRank, clearRanksCache } = require('../lib/userRanks');

describe('User rank counts and formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRanksCache();
  });

  it('returns counts even when DB ranks missing', async () => {
    prisma.user.count.mockResolvedValue(2);
    const ranks = await getRanksWithUserCounts();
    expect(ranks.length).toBeGreaterThan(0);
    expect(ranks[0].userCount).toBeDefined();
  });

  it('formats rank for display', () => {
    const formatted = formatRank({ name: 'Test', color: '#000', icon: '⭐', minPosts: 10 });
    expect(formatted.badge).toBe('⭐ Test');
    expect(formatted.color).toBe('#000');
  });

  it('returns null when formatting empty rank', () => {
    expect(formatRank(null)).toBeNull();
  });
});
