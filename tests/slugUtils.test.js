// Mock Prisma BEFORE importing modules that use it
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    thread: {
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    subject: {
      findUnique: jest.fn(),
      findFirst: jest.fn()
    }
  }
}));

const { generateSlug, findThreadBySlugOrId, findSubjectBySlugOrId } = require('../lib/slugUtils');
const prisma = require('../lib/prisma').default;

describe('Slug Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('converts text to lowercase slug', () => {
      const slug = generateSlug('Hello World');
      expect(slug).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      const slug = generateSlug('This is a test');
      expect(slug).toBe('this-is-a-test');
    });

    it('removes special characters', () => {
      const slug = generateSlug('Hello! World? Test@123');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('handles multiple consecutive spaces', () => {
      const slug = generateSlug('Hello    World');
      expect(slug).not.toContain('--');
    });

    it('trims leading and trailing hyphens', () => {
      const slug = generateSlug('  Hello World  ');
      expect(slug).not.toMatch(/^-/);
      expect(slug).not.toMatch(/-$/);
    });

    it('handles unicode characters', () => {
      const slug = generateSlug('Café Münchën');
      expect(slug).toBeDefined();
      expect(slug.length).toBeGreaterThan(0);
    });

    it('handles empty string', () => {
      const slug = generateSlug('');
      expect(slug).toBe('');
    });

    it('handles numbers', () => {
      const slug = generateSlug('Test 123 456');
      expect(slug).toBe('test-123-456');
    });

    it('removes consecutive hyphens', () => {
      const slug = generateSlug('Hello---World');
      expect(slug).not.toContain('---');
    });

    it('handles very long titles', () => {
      const longTitle = 'a'.repeat(200);
      const slug = generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(200);
    });
  });

  describe('findThreadBySlugOrId', () => {
    it('finds thread by numeric ID', async () => {
      const mockThread = { id: 123, title: 'Test Thread', slug: 'test-thread' };
      prisma.thread.findUnique.mockResolvedValue(mockThread);

      const result = await findThreadBySlugOrId('123');

      expect(result).toEqual(mockThread);
      expect(prisma.thread.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
        include: expect.any(Object)
      });
    });

    it('finds thread by slug', async () => {
      const mockThread = { id: 123, title: 'Test Thread', slug: 'test-thread' };
      prisma.thread.findUnique.mockResolvedValue(null);
      prisma.thread.findFirst.mockResolvedValue(mockThread);

      const result = await findThreadBySlugOrId('test-thread');

      expect(result).toEqual(mockThread);
      expect(prisma.thread.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-thread' },
        include: expect.any(Object)
      });
    });

    it('returns null for non-existent thread', async () => {
      prisma.thread.findUnique.mockResolvedValue(null);
      prisma.thread.findFirst.mockResolvedValue(null);

      const result = await findThreadBySlugOrId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findSubjectBySlugOrId', () => {
    it('finds subject by numeric ID', async () => {
      const mockSubject = { id: 456, name: 'Test Forum', slug: 'test-forum' };
      prisma.subject.findUnique.mockResolvedValue(mockSubject);

      const result = await findSubjectBySlugOrId('456');

      expect(result).toEqual(mockSubject);
      expect(prisma.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 456 },
        include: expect.any(Object)
      });
    });

    it('finds subject by slug', async () => {
      const mockSubject = { id: 456, name: 'Test Forum', slug: 'test-forum' };
      prisma.subject.findUnique.mockResolvedValue(null);
      prisma.subject.findFirst.mockResolvedValue(mockSubject);

      const result = await findSubjectBySlugOrId('test-forum');

      expect(result).toEqual(mockSubject);
      expect(prisma.subject.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-forum' },
        include: expect.any(Object)
      });
    });

    it('returns null for non-existent subject', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);
      prisma.subject.findFirst.mockResolvedValue(null);

      const result = await findSubjectBySlugOrId('non-existent');

      expect(result).toBeNull();
    });
  });
});
