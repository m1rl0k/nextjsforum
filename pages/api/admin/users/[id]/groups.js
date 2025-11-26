import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';
import { clearPermissionCache } from '../../../../../lib/permissions';

export default async function handler(req, res) {
  const { id } = req.query;
  const userId = parseInt(id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    // Verify admin authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(userId, res);
      case 'PUT':
        return await handleUpdate(userId, req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User groups API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGet(userId, res) {
  try {
    // Get user's current groups
    const memberships = await prisma.userGroupMember.findMany({
      where: { userId },
      include: {
        group: true
      },
      orderBy: { group: { priority: 'desc' } }
    });

    // Get all available groups for assignment
    const allGroups = await prisma.userGroup.findMany({
      orderBy: { priority: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        priority: true,
        isDefault: true
      }
    });

    const userGroupIds = new Set(memberships.map(m => m.groupId));

    return res.status(200).json({
      status: 'success',
      data: {
        userGroups: memberships.map(m => ({
          ...m.group,
          joinedAt: m.joinedAt
        })),
        availableGroups: allGroups.map(g => ({
          ...g,
          isMember: userGroupIds.has(g.id)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return res.status(500).json({ message: 'Error fetching user groups' });
  }
}

async function handleUpdate(userId, req, res) {
  const { groupIds } = req.body;

  if (!Array.isArray(groupIds)) {
    return res.status(400).json({ message: 'groupIds array is required' });
  }

  try {
    // Get current memberships
    const currentMemberships = await prisma.userGroupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const currentGroupIds = new Set(currentMemberships.map(m => m.groupId));
    const newGroupIds = new Set(groupIds);

    // Groups to add
    const toAdd = groupIds.filter(id => !currentGroupIds.has(id));
    
    // Groups to remove
    const toRemove = [...currentGroupIds].filter(id => !newGroupIds.has(id));

    // Perform updates in a transaction
    await prisma.$transaction([
      // Remove old memberships
      prisma.userGroupMember.deleteMany({
        where: { userId, groupId: { in: toRemove } }
      }),
      // Add new memberships
      prisma.userGroupMember.createMany({
        data: toAdd.map(groupId => ({ userId, groupId })),
        skipDuplicates: true
      })
    ]);

    // Clear permission cache for this user
    clearPermissionCache(userId);

    // Return updated memberships
    const updatedMemberships = await prisma.userGroupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { group: { priority: 'desc' } }
    });

    return res.status(200).json({
      status: 'success',
      data: updatedMemberships.map(m => ({
        ...m.group,
        joinedAt: m.joinedAt
      })),
      message: `Updated user groups. Added: ${toAdd.length}, Removed: ${toRemove.length}`
    });
  } catch (error) {
    console.error('Error updating user groups:', error);
    return res.status(500).json({ message: 'Error updating user groups' });
  }
}

