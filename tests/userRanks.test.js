// Mock Prisma BEFORE importing modules that use it
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    userRank: {
      findMany: jest.fn()
    }
  }
}));

const prisma = require('../lib/prisma').default;

// Import after mocking
const userRanksModule = require('../lib/userRanks');

describe('User Ranks System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock to return null so it uses default ranks
    prisma.userRank.findMany.mockRejectedValue(new Error('Table not found'));
  });

  describe('getUserRank', () => {
    it('returns New Member for 0 posts', async () => {
      const rank = await userRanksModule.getUserRank(0);
      expect(rank.name).toBe('New Member');
      expect(rank.minPosts).toBe(0);
    });

    it('returns Member for 10 posts', async () => {
      const rank = await userRanksModule.getUserRank(10);
      expect(rank.name).toBe('Member');
    });

    it('returns Active Member for 50 posts', async () => {
      const rank = await userRanksModule.getUserRank(50);
      expect(rank.name).toBe('Active Member');
    });

    it('returns Senior Member for 100 posts', async () => {
      const rank = await userRanksModule.getUserRank(100);
      expect(rank.name).toBe('Senior Member');
    });

    it('returns Veteran for 500 posts', async () => {
      const rank = await userRanksModule.getUserRank(500);
      expect(rank.name).toBe('Veteran');
    });

    it('returns Legend for 1000+ posts', async () => {
      const rank = await userRanksModule.getUserRank(1000);
      expect(rank.name).toBe('Legend');
    });

    it('returns highest rank for very high post count', async () => {
      const rank = await userRanksModule.getUserRank(10000);
      expect(rank.name).toBe('Legend');
    });

    it('handles edge case at rank boundary', async () => {
      const rank = await userRanksModule.getUserRank(99);
      expect(rank.name).toBe('Active Member');

      const nextRank = await userRanksModule.getUserRank(100);
      expect(nextRank.name).toBe('Senior Member');
    });
  });

  describe('getUserRankWithProgress', () => {
    it('calculates progress for new member', async () => {
      const result = await userRanksModule.getUserRankWithProgress(5);

      expect(result.current.name).toBe('New Member');
      expect(result.next.name).toBe('Member');
      expect(result.postsToNextRank).toBe(5); // 10 - 5
      expect(result.progress).toBeGreaterThan(0);
      expect(result.progress).toBeLessThan(100);
    });

    it('calculates 100% progress at max rank', async () => {
      const result = await userRanksModule.getUserRankWithProgress(1000);

      expect(result.current.name).toBe('Legend');
      expect(result.next).toBeNull();
      expect(result.postsToNextRank).toBe(0);
      expect(result.progress).toBe(100);
    });

    it('calculates progress mid-rank', async () => {
      const result = await userRanksModule.getUserRankWithProgress(75); // Between Active (50) and Senior (100)

      expect(result.current.name).toBe('Active Member');
      expect(result.next.name).toBe('Senior Member');
      expect(result.postsToNextRank).toBe(25); // 100 - 75
      expect(result.progress).toBe(50); // (75-50)/(100-50) * 100
    });

    it('calculates 0% progress at rank start', async () => {
      const result = await userRanksModule.getUserRankWithProgress(50);

      expect(result.current.name).toBe('Active Member');
      expect(result.progress).toBe(0);
    });

    it('handles zero posts', async () => {
      const result = await userRanksModule.getUserRankWithProgress(0);

      expect(result.current.name).toBe('New Member');
      expect(result.next.name).toBe('Member');
      expect(result.postsToNextRank).toBe(10);
      expect(result.progress).toBe(0);
    });
  });

  describe('Rank Consistency', () => {
    it('ensures all ranks have increasing minPosts', async () => {
      const ranks = await Promise.all([
        userRanksModule.getUserRank(0),
        userRanksModule.getUserRank(10),
        userRanksModule.getUserRank(50),
        userRanksModule.getUserRank(100),
        userRanksModule.getUserRank(500),
        userRanksModule.getUserRank(1000)
      ]);

      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i].minPosts).toBeGreaterThan(ranks[i - 1].minPosts);
      }
    });

    it('ensures rank names are unique', async () => {
      const ranks = await Promise.all([
        userRanksModule.getUserRank(0),
        userRanksModule.getUserRank(10),
        userRanksModule.getUserRank(50),
        userRanksModule.getUserRank(100),
        userRanksModule.getUserRank(500),
        userRanksModule.getUserRank(1000)
      ]);

      const names = ranks.map(r => r.name);
      const uniqueNames = [...new Set(names)];

      expect(uniqueNames.length).toBe(names.length);
    });
  });
});

