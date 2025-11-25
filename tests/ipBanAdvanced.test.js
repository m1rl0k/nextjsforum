jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      findFirst: jest.fn()
    }
  }
}));

const prisma = require('../lib/prisma').default;
const { isIpBanned, clearIpBanCache } = require('../lib/ipBan');

describe('IP ban logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearIpBanCache();
  });

  it('returns false when no ban found', async () => {
    prisma.ipBan.findFirst.mockResolvedValue(null);
    const result = await isIpBanned('1.1.1.1');
    expect(result.banned).toBe(false);
  });

  it('returns true when ban active', async () => {
    prisma.ipBan.findFirst.mockResolvedValue({
      ipAddress: '1.1.1.1',
      expiresAt: null,
      isActive: true,
      isPermanent: true
    });
    const result = await isIpBanned('1.1.1.1');
    expect(result.banned).toBe(true);
  });

  it('ignores expired ban', async () => {
    prisma.ipBan.findFirst.mockResolvedValue(null);
    const result = await isIpBanned('1.1.1.1');
    expect(result.banned).toBe(false);
  });
});
