// Mock Prisma BEFORE importing modules that use it
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      findFirst: jest.fn()
    }
  }
}));

const { isIpBanned, getClientIp } = require('../lib/ipBan');
const prisma = require('../lib/prisma').default;

describe('IP Ban System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isIpBanned', () => {
    it('returns not banned for clean IP', async () => {
      prisma.ipBan.findFirst.mockResolvedValue(null);

      const result = await isIpBanned('192.168.1.1');

      expect(result.banned).toBe(false);
      expect(prisma.ipBan.findFirst).toHaveBeenCalled();
    });

    it('detects permanently banned IP', async () => {
      prisma.ipBan.findFirst.mockResolvedValue({
        ipAddress: '192.168.1.100',
        reason: 'Spam',
        isPermanent: true,
        expiresAt: null
      });

      const result = await isIpBanned('192.168.1.100');

      expect(result.banned).toBe(true);
      expect(result.isPermanent).toBe(true);
      expect(result.reason).toBe('Spam');
    });

    it('detects temporarily banned IP', async () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      prisma.ipBan.findFirst.mockResolvedValue({
        ipAddress: '192.168.1.200',
        reason: 'Violation',
        isPermanent: false,
        expiresAt: futureDate
      });

      const result = await isIpBanned('192.168.1.200');

      expect(result.banned).toBe(true);
      expect(result.isPermanent).toBe(false);
      expect(result.expiresAt).toEqual(futureDate);
    });

    it('ignores expired bans', async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      prisma.ipBan.findFirst.mockResolvedValue(null); // Query should filter expired

      const result = await isIpBanned('192.168.1.300');

      expect(result.banned).toBe(false);
    });
  });

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1'
        }
      };

      const ip = getClientIp(req);

      expect(ip).toBe('203.0.113.1');
    });

    it('handles single IP in x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.1'
        }
      };

      const ip = getClientIp(req);

      expect(ip).toBe('203.0.113.1');
    });

    it('falls back to connection remoteAddress', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '198.51.100.1'
        }
      };

      const ip = getClientIp(req);

      expect(ip).toBe('198.51.100.1');
    });

    it('falls back to socket remoteAddress', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '198.51.100.2'
        }
      };

      const ip = getClientIp(req);

      expect(ip).toBe('198.51.100.2');
    });

    it('returns empty string when no IP available', () => {
      const req = {
        headers: {}
      };

      const ip = getClientIp(req);

      expect(ip).toBe('');
    });

    it('trims whitespace from IP', () => {
      const req = {
        headers: {
          'x-forwarded-for': '  203.0.113.1  , 198.51.100.1'
        }
      };

      const ip = getClientIp(req);

      expect(ip).toBe('203.0.113.1');
    });

    it('handles IPv6 addresses', () => {
      const req = {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        }
      };

      const ip = getClientIp(req);

      expect(ip).toContain('2001:0db8');
    });
  });
});

