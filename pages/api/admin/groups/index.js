import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import { clearPermissionCache } from '../../../../lib/permissions';

export default async function handler(req, res) {
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
        return await handleGet(req, res);
      case 'POST':
        return await handleCreate(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Groups API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  const { includeMembers = 'false', search = '' } = req.query;

  try {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const groups = await prisma.userGroup.findMany({
      where,
      include: {
        members: includeMembers === 'true' ? {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatar: true, role: true }
            }
          }
        } : false,
        _count: {
          select: { members: true }
        }
      },
      orderBy: { priority: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      data: groups.map(g => ({
        ...g,
        memberCount: g._count.members
      }))
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return res.status(500).json({ message: 'Error fetching groups' });
  }
}

async function handleCreate(req, res) {
  const {
    name,
    description,
    color = '#007bff',
    priority = 0,
    isDefault = false,
    canPost = true,
    canReply = true,
    canEdit = false,
    canDelete = false,
    canModerate = false,
    canAdmin = false,
    canViewProfiles = true,
    canSendMessages = true
  } = req.body;

  // Validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Group name must be at least 2 characters' });
  }

  if (name.trim().length > 50) {
    return res.status(400).json({ message: 'Group name must be at most 50 characters' });
  }

  try {
    // Check for duplicate name
    const existing = await prisma.userGroup.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.userGroup.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const group = await prisma.userGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color,
        priority: parseInt(priority, 10) || 0,
        isDefault,
        canPost,
        canReply,
        canEdit,
        canDelete,
        canModerate,
        canAdmin,
        canViewProfiles,
        canSendMessages
      }
    });

    // Clear permission cache since groups affect permissions
    clearPermissionCache();

    return res.status(201).json({
      status: 'success',
      data: group,
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({ message: 'Error creating group' });
  }
}

