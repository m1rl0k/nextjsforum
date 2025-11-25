const prisma = require('../lib/prisma').default;
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    subject: { findUnique: jest.fn() },
    thread: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    post: { create: jest.fn() },
    user: { update: jest.fn() }
  }
}));

const { generateUniqueThreadSlug } = require('../lib/slugUtils');

describe('Thread slug generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('appends counter when slug exists', async () => {
    prisma.thread.findFirst
      .mockResolvedValueOnce({ id: 1 }) // base slug exists
      .mockResolvedValueOnce(null); // second slug available

    const slug = await generateUniqueThreadSlug('Hello World');
    expect(slug).toBe('hello-world-1');
  });

  it('uses fallback when title empty', async () => {
    prisma.thread.findFirst.mockResolvedValue(null);
    const slug = await generateUniqueThreadSlug('');
    expect(slug).toMatch(/^thread/);
  });
});
