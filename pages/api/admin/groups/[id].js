import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import { clearPermissionCache } from '../../../../lib/permissions';

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

    switch (req.method) {
      case 'GET':
        return await handleGet(groupId, res);
      case 'PUT':
        return await handleUpdate(groupId, req, res);
      case 'DELETE':
        return await handleDelete(groupId, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Group API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGet(groupId, res) {
  try {
    const group = await prisma.userGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                role: true,
                isActive: true,
                lastLogin: true
              }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        _count: { select: { members: true } }
      }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: { ...group, memberCount: group._count.members }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return res.status(500).json({ message: 'Error fetching group' });
  }
}

async function handleUpdate(groupId, req, res) {
  const { name, description, color, priority, isDefault, ...permissions } = req.body;

  try {
    const existing = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!existing) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check for duplicate name if changing
    if (name && name !== existing.name) {
      const duplicate = await prisma.userGroup.findUnique({
        where: { name: name.trim() }
      });
      if (duplicate) {
        return res.status(400).json({ message: 'A group with this name already exists' });
      }
    }

    // If setting as default, unset others
    if (isDefault && !existing.isDefault) {
      await prisma.userGroup.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (priority !== undefined) updateData.priority = parseInt(priority, 10) || 0;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    
    // Permission fields
    const permFields = ['canPost', 'canReply', 'canEdit', 'canDelete', 'canModerate', 
                        'canAdmin', 'canViewProfiles', 'canSendMessages'];
    for (const field of permFields) {
      if (permissions[field] !== undefined) {
        updateData[field] = Boolean(permissions[field]);
      }
    }

    const group = await prisma.userGroup.update({
      where: { id: groupId },
      data: updateData
    });

    // Clear permission cache for all affected users
    clearPermissionCache();

    return res.status(200).json({
      status: 'success',
      data: group,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return res.status(500).json({ message: 'Error updating group' });
  }
}

async function handleDelete(groupId, res) {
  try {
    const group = await prisma.userGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove all members first
    await prisma.userGroupMember.deleteMany({ where: { groupId } });
    
    // Delete the group
    await prisma.userGroup.delete({ where: { id: groupId } });

    clearPermissionCache();

    return res.status(200).json({
      status: 'success',
      message: `Group "${group.name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return res.status(500).json({ message: 'Error deleting group' });
  }
}

