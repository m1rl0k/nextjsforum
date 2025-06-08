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
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return res.status(403).json({ message: 'Moderator access required' });
    }

    const { action, type, targetId, reason } = req.body;

    // Validate required fields
    if (!action || !type || !targetId) {
      return res.status(400).json({ message: 'Action, type, and target ID are required' });
    }

    // Validate action
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Validate type
    if (!['thread', 'post'].includes(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    let result;
    const targetIdInt = parseInt(targetId);

    if (type === 'thread') {
      if (action === 'approve') {
        // For now, threads are auto-approved, so this is just a log action
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: { updatedAt: new Date() }
        });
      } else if (action === 'reject' || action === 'delete') {
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: { deleted: true }
        });
      }
    } else if (type === 'post') {
      if (action === 'approve') {
        // For now, posts are auto-approved, so this is just a log action
        result = await prisma.post.update({
          where: { id: targetIdInt },
          data: { updatedAt: new Date() }
        });
      } else if (action === 'reject' || action === 'delete') {
        result = await prisma.post.update({
          where: { id: targetIdInt },
          data: { deleted: true }
        });
      }
    }

    if (!result) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Log the moderation action
    await prisma.moderationLog.create({
      data: {
        moderatorId: user.id,
        action: `${action.toUpperCase()}_${type.toUpperCase()}`,
        targetType: type.toUpperCase(),
        targetId: targetIdInt,
        reason: reason || `${action} ${type}`,
        details: JSON.stringify({
          moderatorUsername: user.username,
          timestamp: new Date().toISOString()
        })
      }
    });

    res.status(200).json({ 
      message: `${type} ${action}ed successfully`,
      result
    });

  } catch (error) {
    console.error('Error performing content action:', error);
    res.status(500).json({ message: 'Failed to perform content action' });
  }
}
