import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/prisma', () => ({
  default: {
    subjectModerator: { findFirst: jest.fn() },
    userGroupMember: { findMany: jest.fn() }
  },
  __esModule: true
}));

const prisma = (await import('../lib/prisma')).default;
const { getUserPermissions } = await import('../lib/permissions.js');

describe('getUserPermissions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns role defaults for regular user', async () => {
    prisma.subjectModerator.findFirst.mockResolvedValue(null);
    prisma.userGroupMember.findMany.mockResolvedValue([]);

    const perms = await getUserPermissions(1, null, 'USER');
    expect(perms).toEqual({ canPost: true, canReply: true, canModerate: false });
  });

  it('grants moderation when user is subject moderator', async () => {
    prisma.subjectModerator.findFirst.mockResolvedValue({ id: 1 });
    prisma.userGroupMember.findMany.mockResolvedValue([]);

    const perms = await getUserPermissions(1, 10, 'USER');
    expect(perms.canModerate).toBe(true);
    expect(perms.canPost).toBe(true);
    expect(perms.canReply).toBe(true);
  });

  it('combines group capabilities with role defaults', async () => {
    prisma.subjectModerator.findFirst.mockResolvedValue(null);
    prisma.userGroupMember.findMany.mockResolvedValue([
      { group: { canPost: false, canReply: true, canModerate: true } }
    ]);

    const perms = await getUserPermissions(2, 5, 'USER');
    expect(perms.canModerate).toBe(true);
    expect(perms.canReply).toBe(true);
    expect(perms.canPost).toBe(true); // base role allows posting
  });
});
