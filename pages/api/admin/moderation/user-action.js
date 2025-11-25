import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify moderator authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const moderator = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!moderator || (moderator.role !== 'ADMIN' && moderator.role !== 'MODERATOR')) {
      return res.status(403).json({ message: 'Moderator access required' });
    }

    const { userId, action, reason = '', durationHours = null, points = 1, note = '' } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ message: 'User ID and action are required' });
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent non-admins from acting on admins
    if (moderator.role !== 'ADMIN' && targetUser.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot perform actions on administrators' });
    }

    // Prevent users from acting on themselves
    if (moderator.id === targetUser.id) {
      return res.status(400).json({ message: 'Cannot perform actions on yourself' });
    }

    let updateData = {};
    let logAction = '';

    switch (action) {
      case 'ban':
        updateData.isActive = false;
        logAction = 'USER_BANNED';
        break;
      case 'tempban':
        updateData.isActive = false;
        updateData.banReason = reason || 'Temporary ban';
        if (durationHours) {
          const expires = new Date();
          expires.setHours(expires.getHours() + Number(durationHours));
          updateData.banExpiresAt = expires;
        }
        logAction = 'USER_TEMP_BANNED';
        break;
      case 'unban':
        updateData.isActive = true;
        logAction = 'USER_UNBANNED';
        break;
      case 'promote':
        // Only admins can promote users
        if (moderator.role !== 'ADMIN') {
          return res.status(403).json({ message: 'Only administrators can promote users' });
        }
        updateData.role = 'MODERATOR';
        logAction = 'USER_PROMOTED';
        break;
      case 'demote':
        // Only admins can demote users
        if (moderator.role !== 'ADMIN') {
          return res.status(403).json({ message: 'Only administrators can demote users' });
        }
        updateData.role = 'USER';
        logAction = 'USER_DEMOTED';
        break;
      case 'warn':
        updateData.warningPoints = (targetUser.warningPoints || 0) + Number(points || 1);
        logAction = 'USER_WARNED';
        break;
      case 'note':
        // No status change, just log
        updateData = null;
        logAction = 'USER_NOTED';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    let updatedUser = targetUser;
    if (updateData) {
      updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          warningPoints: true,
          banExpiresAt: true,
          banReason: true
        }
      });
    }

    // Log the moderation action
    try {
      await prisma.moderationLog.create({
        data: {
          action: logAction,
          moderatorId: moderator.id,
          targetType: 'USER',
          targetId: targetUser.id,
          reason: reason || `${action} by ${moderator.username}`,
          details: JSON.stringify({
            targetUsername: targetUser.username,
            previousRole: targetUser.role,
            previousStatus: targetUser.isActive,
            newRole: updateData?.role || targetUser.role,
            newStatus: updateData?.isActive !== undefined ? updateData.isActive : targetUser.isActive,
            warningPoints: updateData?.warningPoints ?? targetUser.warningPoints,
            banExpiresAt: updateData?.banExpiresAt || targetUser.banExpiresAt,
            note
          })
        }
      });
    } catch (logError) {
      console.error('Error logging moderation action:', logError);
      // Don't fail the request if logging fails
    }

    res.status(200).json({
      status: 'success',
      message: `User ${action}ed successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error performing user action:', error);
    res.status(500).json({ message: 'Failed to perform user action' });
  }
}
