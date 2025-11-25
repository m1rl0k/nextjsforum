const handler = require('../pages/api/messages/conversations').default;

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    message: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn()
    },
    user: { findUnique: jest.fn() },
    thread: { findMany: jest.fn() },
    post: { findMany: jest.fn() }
  }
}));

jest.mock('../lib/auth', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 1 })
}));

jest.mock('../lib/notifications', () => ({
  notifyPrivateMessage: jest.fn().mockResolvedValue(null)
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

describe('/api/messages/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 1, username: 'alice' }) // requester
      .mockResolvedValue({ id: 2, username: 'bob' }); // recipient default
    prisma.message.findFirst.mockResolvedValue(null);
  });

  it('rejects unauthenticated', async () => {
    const req = { method: 'GET', cookies: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('creates a new conversation/message', async () => {
    prisma.message.create.mockResolvedValue({ id: 5, conversationId: 'conv_1_2' });
    prisma.message.findFirst.mockResolvedValue(null);
    const req = {
      method: 'POST',
      cookies: { token: 't' },
      body: { recipientUsername: 'bob', subject: 'Hello', content: 'Hi Bob!' }
    };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(400);
    expect(prisma.message.create).toHaveBeenCalled();
  });
});
