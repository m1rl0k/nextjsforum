const handler = require('../pages/api/admin/moderation/content-action').default;

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    thread: { findUnique: jest.fn(), update: jest.fn() },
    post: { findUnique: jest.fn(), update: jest.fn() },
    moderationLog: { create: jest.fn() }
  }
}));

jest.mock('../lib/auth', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 1 })
}));

jest.mock('../lib/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  sendEmailNotification: jest.fn().mockResolvedValue(null)
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

describe('/api/admin/moderation/content-action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN' });
  });

  it('rejects non-POST', async () => {
    const req = { method: 'GET', cookies: { token: 't' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects unauthenticated', async () => {
    const req = { method: 'POST', cookies: {}, body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 on missing fields', async () => {
    const req = { method: 'POST', cookies: { token: 't' }, body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('approves a post', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 10, userId: 2 });
    prisma.post.update.mockResolvedValue({ id: 10 });
    const req = { method: 'POST', cookies: { token: 't' }, body: { action: 'approve', type: 'post', targetId: 10 } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(prisma.moderationLog.create).toHaveBeenCalled();
  });
});
