const handler = require('../pages/api/posts').default;

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    thread: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    subject: { update: jest.fn() },
    post: { create: jest.fn() },
    subjectModerator: { findFirst: jest.fn() },
    userGroupMember: { findMany: jest.fn() },
    moderationSettings: { findFirst: jest.fn().mockResolvedValue(null) }
  }
}));

jest.mock('../lib/auth', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 1 })
}));

jest.mock('../lib/imageUtils', () => ({
  associateImagesWithPost: jest.fn()
}));

jest.mock('../lib/profanityFilter', () => ({
  filterHtmlContent: jest.fn(async (html) => ({ allowed: true, flagged: false, text: html })),
  stripHtml: (html) => (html || '').replace(/<[^>]*>/g, ' ')
}));

jest.mock('../lib/notifications', () => ({
  notifyThreadReply: jest.fn().mockResolvedValue(null),
  notifyMentions: jest.fn().mockResolvedValue(null),
  extractMentions: jest.fn(() => [])
}));

const prisma = require('../lib/prisma').default;

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.jsonData = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.jsonData = data; return res; };
  return res;
};

describe('POST /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true, role: 'USER' });
    prisma.userGroupMember.findMany.mockResolvedValue([]);
    prisma.subjectModerator.findFirst.mockResolvedValue(null);
    prisma.$transaction = jest.fn(async (cb) => cb(prisma));
  });

  it('returns 401 when no token', async () => {
    const req = { method: 'POST', cookies: {}, body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when thread locked', async () => {
    prisma.thread.findUnique.mockResolvedValue({
      id: 1,
      isLocked: true,
      subject: { canReply: true, isActive: true, guestPosting: true }
    });
    const req = { method: 'POST', cookies: { token: 't' }, body: { content: 'hi', threadId: 1 } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('creates post when valid', async () => {
    prisma.thread.findUnique.mockResolvedValue({
      id: 1,
      isLocked: false,
      subject: { canReply: true, isActive: true, guestPosting: true }
    });
    prisma.post.create.mockResolvedValue({ id: 10 });
    const req = { method: 'POST', cookies: { token: 't' }, body: { content: 'hello world', threadId: 1 } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(prisma.post.create).toHaveBeenCalled();
  });
});
