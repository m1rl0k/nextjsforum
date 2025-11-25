import prisma from './prisma';

const roleDefaults = {
  ADMIN: { canPost: true, canReply: true, canModerate: true },
  MODERATOR: { canPost: true, canReply: true, canModerate: true },
  USER: { canPost: true, canReply: true, canModerate: false },
  GUEST: { canPost: false, canReply: false, canModerate: false }
};

/**
 * Resolve a user's permissions for a given subject/thread.
 * Falls back to role defaults, then augments with groups and subject moderator assignment.
 */
export async function getUserPermissions(userId, subjectId = null, role = 'USER') {
  const base = roleDefaults[role] || roleDefaults.USER;
  let canPost = base.canPost;
  let canReply = base.canReply;
  let canModerate = base.canModerate;

  try {
    // Subject moderators get moderation rights for that subject
    if (subjectId) {
      const isSubjectMod = await prisma.subjectModerator.findFirst({
        where: { userId, subjectId }
      });
      if (isSubjectMod) {
        canModerate = true;
        canPost = true;
        canReply = true;
      }
    }

    // Aggregate group permissions
    const memberships = await prisma.userGroupMember.findMany({
      where: { userId },
      include: { group: true }
    });

    for (const membership of memberships) {
      const g = membership.group;
      canPost = canPost || g.canPost;
      canReply = canReply || g.canReply;
      canModerate = canModerate || g.canModerate;
    }
  } catch (err) {
    console.error('Permission resolution failed:', err);
  }

  return { canPost, canReply, canModerate };
}

export default {
  getUserPermissions
};
