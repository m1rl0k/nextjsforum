jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      findFirst: jest.fn()
    }
  }
}));

const prisma = require('../lib/prisma').default;
const { isIpBanned } = require('../lib/ipBan');

describe('IP ban logic', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns false when no ban found', async () => {
    prisma.ipBan.findFirst.mockResolvedValue(null);
    const banned = await isIpBanned('1.1.1.1');
    expect(banned).toBe(false);
  });

  it('returns true when ban active', async () => {
    prisma.ipBan.findFirst.mockResolvedValue({ ip: '1.1.1.1', expiresAt: null, isActive: true });
    const banned = await isIpBanned('1.1.1.1');
    expect(banned).toBe(true);
  });

  it('ignores expired ban', async () => {
    const past = new Date(Date.now() - 1000);
    prisma.ipBan.findFirst.mockResolvedValue({ ip: '1.1.1.1', expiresAt: past, isActive: true });
    const banned = await isIpBanned('1.1.1.1');
    expect(banned).toBe(false);
  });
});
