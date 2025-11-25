import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import { createNotification, sendEmailNotification } from '../../../../lib/notifications';

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
    if (!['approve', 'reject', 'delete', 'restore', 'lock', 'unlock'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Validate type
    if (!['thread', 'post'].includes(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    let result;
    const targetIdInt = parseInt(targetId);
    let targetOwnerId = null;
    let targetOwnerEmail = null;
    let targetOwnerName = null;
    let actionUrl = null;

    // Fetch target for ownership info
    if (type === 'thread') {
      const thread = await prisma.thread.findUnique({
        where: { id: targetIdInt },
        select: { id: true, userId: true, user: { select: { email: true, username: true } } }
      });
      if (thread) {
        targetOwnerId = thread.userId;
        actionUrl = `/threads/${thread.id}`;
        targetOwnerEmail = thread.user?.email;
        targetOwnerName = thread.user?.username;
      }
    } else if (type === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: targetIdInt },
        select: { id: true, userId: true, threadId: true, user: { select: { email: true, username: true } } }
      });
      if (post) {
        targetOwnerId = post.userId;
        actionUrl = `/threads/${post.threadId}#post-${post.id}`;
        targetOwnerEmail = post.user?.email;
        targetOwnerName = post.user?.username;
      }
    }

    if (type === 'thread') {
      if (action === 'approve') {
        // For now, threads are auto-approved, so this is just a log action
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: {
            approved: true,
            updatedAt: new Date()
          }
        });
      } else if (action === 'reject' || action === 'delete') {
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: user.id
          }
        });
      } else if (action === 'restore') {
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: {
            deleted: false,
            deletedAt: null,
            deletedBy: null
          }
        });
      } else if (action === 'lock') {
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: { isLocked: true }
        });
      } else if (action === 'unlock') {
        result = await prisma.thread.update({
          where: { id: targetIdInt },
          data: { isLocked: false }
        });
      }
    } else if (type === 'post') {
      if (action === 'approve') {
        // For now, posts are auto-approved, so this is just a log action
        result = await prisma.post.update({
          where: { id: targetIdInt },
          data: {
            approved: true,
            updatedAt: new Date()
          }
        });
      } else if (action === 'reject' || action === 'delete') {
        result = await prisma.post.update({
          where: { id: targetIdInt },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: user.id
          }
        });
      } else if (action === 'restore') {
        result = await prisma.post.update({
          where: { id: targetIdInt },
          data: {
            deleted: false,
            deletedAt: null,
            deletedBy: null
          }
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

    // Notify content owner (best-effort)
    try {
      if (targetOwnerId) {
        await createNotification({
          userId: targetOwnerId,
          type: 'MODERATION_ACTION',
          title: `Your ${type} was ${action}d`,
          content: `A moderator ${action}d your ${type}.${reason ? ` Reason: ${reason}` : ''}`,
          actionUrl,
          relatedType: type,
          relatedId: targetIdInt,
          triggeredById: user.id
        });
        if (targetOwnerEmail) {
          await sendEmailNotification({
            to: targetOwnerEmail,
            subject: `Your ${type} was ${action}d`,
            text: `Hello ${targetOwnerName || 'user'},\n\nA moderator ${action}d your ${type}.${reason ? ` Reason: ${reason}` : ''}\n${actionUrl ? `View: ${actionUrl}` : ''}`
          });
        }
      }
    } catch (notifyError) {
      console.error('Error notifying content owner:', notifyError);
    }

  } catch (error) {
    console.error('Error performing content action:', error);
    res.status(500).json({ message: 'Failed to perform content action' });
  }
}
