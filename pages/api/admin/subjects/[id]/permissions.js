import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';
import { clearPermissionCache } from '../../../../../lib/permissions';

export default async function handler(req, res) {
  const { id } = req.query;
  const subjectId = Number.parseInt(id, 10);

  if (Number.isNaN(subjectId)) {
    return res.status(400).json({ message: 'Invalid subject ID' });
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

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(subjectId, res);
      case 'PUT':
        return await handleUpdate(subjectId, req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Subject permissions API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGet(subjectId, res) {
  try {
    // Get all groups with their permissions for this subject
    const groups = await prisma.userGroup.findMany({
      orderBy: { priority: 'desc' },
      include: {
        subjectPermissions: {
          where: { subjectId }
        },
        _count: { select: { members: true } }
      }
    });

    // Format response with permission status for each group
    const groupPermissions = groups.map(group => {
      const perm = group.subjectPermissions[0];
      return {
        groupId: group.id,
        groupName: group.name,
        groupColor: group.color,
        priority: group.priority,
        memberCount: group._count.members,
        hasCustomPermissions: !!perm,
        canView: perm?.canView ?? true,
        canPost: perm?.canPost ?? group.canPost,
        canReply: perm?.canReply ?? group.canReply
      };
    });

    return res.status(200).json({
      status: 'success',
      data: groupPermissions
    });
  } catch (error) {
    console.error('Error fetching subject permissions:', error);
    return res.status(500).json({ message: 'Error fetching permissions' });
  }
}

async function handleUpdate(subjectId, req, res) {
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'permissions array is required' });
  }

  try {
    // Process each group's permissions
    for (const perm of permissions) {
      const { canView, canPost, canReply, remove } = perm;

      // Validate and sanitize groupId
      const groupId = Number.parseInt(perm.groupId, 10);
      if (Number.isNaN(groupId) || groupId <= 0) {
        continue; // Skip invalid group IDs
      }

      // Verify group exists
      const groupExists = await prisma.userGroup.findUnique({
        where: { id: groupId },
        select: { id: true }
      });

      if (!groupExists) {
        continue; // Skip non-existent groups
      }

      if (remove) {
        // Remove custom permission (revert to defaults)
        await prisma.subjectGroupPermission.deleteMany({
          where: { subjectId, groupId }
        });
      } else {
        // Upsert the permission
        await prisma.subjectGroupPermission.upsert({
          where: {
            subjectId_groupId: { subjectId, groupId }
          },
          create: {
            subjectId,
            groupId,
            canView: canView ?? true,
            canPost: canPost ?? true,
            canReply: canReply ?? true
          },
          update: {
            canView: canView ?? true,
            canPost: canPost ?? true,
            canReply: canReply ?? true
          }
        });
      }
    }

    // Clear permission cache
    clearPermissionCache();

    return res.status(200).json({
      status: 'success',
      message: 'Forum permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating subject permissions:', error);
    return res.status(500).json({ message: 'Error updating permissions' });
  }
}

