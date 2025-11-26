import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';
import { clearPermissionCache } from '../../../../../lib/permissions';

export default async function handler(req, res) {
  const { id } = req.query;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID' });
  }

  try {
    // Verify admin authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Verify group exists
    const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGetMembers(groupId, req, res);
      case 'POST':
        return await handleAddMembers(groupId, req, res);
      case 'DELETE':
        return await handleRemoveMembers(groupId, req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Group members API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGetMembers(groupId, req, res) {
  const { page = '1', limit = '20', search = '' } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    const where = {
      groupId,
      ...(search ? {
        user: {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      } : {})
    };

    const [members, total] = await Promise.all([
      prisma.userGroupMember.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
              isActive: true,
              postCount: true,
              createdAt: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.userGroupMember.count({ where })
    ]);

    return res.status(200).json({
      status: 'success',
      data: members,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ message: 'Error fetching members' });
  }
}

async function handleAddMembers(groupId, req, res) {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'userIds array is required' });
  }

  try {
    // Filter out users already in the group
    const existing = await prisma.userGroupMember.findMany({
      where: { groupId, userId: { in: userIds } },
      select: { userId: true }
    });
    const existingIds = new Set(existing.map(e => e.userId));
    const newUserIds = userIds.filter(id => !existingIds.has(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({ message: 'All users are already members of this group' });
    }

    // Add new members
    await prisma.userGroupMember.createMany({
      data: newUserIds.map(userId => ({ groupId, userId }))
    });

    // Clear permission cache for affected users
    newUserIds.forEach(userId => clearPermissionCache(userId));

    return res.status(201).json({
      status: 'success',
      message: `Added ${newUserIds.length} member(s) to group`,
      addedCount: newUserIds.length,
      skippedCount: userIds.length - newUserIds.length
    });
  } catch (error) {
    console.error('Error adding members:', error);
    return res.status(500).json({ message: 'Error adding members' });
  }
}

async function handleRemoveMembers(groupId, req, res) {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'userIds array is required' });
  }

  try {
    const result = await prisma.userGroupMember.deleteMany({
      where: { groupId, userId: { in: userIds } }
    });

    // Clear permission cache for affected users
    userIds.forEach(userId => clearPermissionCache(userId));

    return res.status(200).json({
      status: 'success',
      message: `Removed ${result.count} member(s) from group`,
      removedCount: result.count
    });
  } catch (error) {
    console.error('Error removing members:', error);
    return res.status(500).json({ message: 'Error removing members' });
  }
}

