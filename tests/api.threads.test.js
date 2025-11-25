const handler = require('../pages/api/threads').default;

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    thread: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    post: { create: jest.fn() },
    subject: { findUnique: jest.fn(), update: jest.fn() },
    subjectModerator: { findFirst: jest.fn() },
    userGroupMember: { findMany: jest.fn() },
    moderationSettings: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(async (cb) => cb(require('../lib/prisma').default))
  }
}));

jest.mock('../lib/auth', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 1 })
}));

jest.mock('../lib/imageUtils', () => ({
  associateImagesWithThread: jest.fn(),
  associateImagesWithPost: jest.fn()
}));

jest.mock('../lib/profanityFilter', () => ({
  filterContent: jest.fn(async (t) => ({ allowed: true, text: t, flagged: false })),
  filterHtmlContent: jest.fn(async (t) => ({ allowed: true, text: t, flagged: false })),
  stripHtml: (html) => (html || '').replace(/<[^>]*>/g, ' ')
}));

const prisma = require('../lib/prisma').default;

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.jsonData = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.jsonData = data; return res; };
  end: () => res;
  return res;
};

describe('POST /api/threads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true, role: 'USER' });
    prisma.userGroupMember.findMany.mockResolvedValue([]);
    prisma.subjectModerator.findFirst.mockResolvedValue(null);
    prisma.$transaction = jest.fn(async (cb) => cb(prisma));
  });

  it('returns 401 without token', async () => {
    const req = { method: 'POST', cookies: {}, body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when subject not found', async () => {
    prisma.subject.findUnique.mockResolvedValue(null);
    const req = { method: 'POST', cookies: { token: 't' }, body: { title: 'Valid title', content: 'Valid content body', subjectId: 99 } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('creates thread and post when valid', async () => {
    prisma.subject.findUnique.mockResolvedValue({ id: 1, isActive: true, canPost: true, guestPosting: true });
    prisma.thread.findFirst.mockResolvedValue(null);
    prisma.thread.create.mockResolvedValue({ id: 1, title: 't', subjectId: 1 });
    prisma.post.create.mockResolvedValue({ id: 2 });

    const req = { method: 'POST', cookies: { token: 't' }, body: { title: 'Test Thread', content: 'Content here', subjectId: 1 } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(prisma.thread.create).toHaveBeenCalled();
  });
});
