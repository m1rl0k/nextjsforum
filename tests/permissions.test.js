// Mock Prisma before importing
const mockPrisma = {
  subjectModerator: { findFirst: jest.fn() },
  userGroupMember: { findMany: jest.fn() }
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}));

const { getUserPermissions } = require('../lib/permissions.js');

describe('getUserPermissions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns role defaults for regular user', async () => {
    mockPrisma.subjectModerator.findFirst.mockResolvedValue(null);
    mockPrisma.userGroupMember.findMany.mockResolvedValue([]);

    const perms = await getUserPermissions(1, null, 'USER');
    expect(perms).toEqual({ canPost: true, canReply: true, canModerate: false });
  });

  it('grants moderation when user is subject moderator', async () => {
    mockPrisma.subjectModerator.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.userGroupMember.findMany.mockResolvedValue([]);

    const perms = await getUserPermissions(1, 10, 'USER');
    expect(perms.canModerate).toBe(true);
    expect(perms.canPost).toBe(true);
    expect(perms.canReply).toBe(true);
  });

  it('ADMIN role defaults to moderation even without groups', async () => {
    mockPrisma.subjectModerator.findFirst.mockResolvedValue(null);
    mockPrisma.userGroupMember.findMany.mockResolvedValue([]);

    const perms = await getUserPermissions(5, null, 'ADMIN');
    expect(perms.canModerate).toBe(true);
    expect(perms.canPost).toBe(true);
    expect(perms.canReply).toBe(true);
  });

  it('combines group capabilities with role defaults', async () => {
    mockPrisma.subjectModerator.findFirst.mockResolvedValue(null);
    mockPrisma.userGroupMember.findMany.mockResolvedValue([
      { group: { canPost: false, canReply: true, canModerate: true } }
    ]);

    const perms = await getUserPermissions(2, 5, 'USER');
    expect(perms.canModerate).toBe(true);
    expect(perms.canReply).toBe(true);
    expect(perms.canPost).toBe(true); // base role allows posting
  });
});
