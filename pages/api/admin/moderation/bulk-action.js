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

    const { action, items } = req.body;

    if (!action || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Action and items array are required' });
    }

    if (!['delete', 'approve', 'lock', 'unlock', 'restore'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const [type, id] = item.split('-');
        const targetId = parseInt(id);

        if (!type || !targetId) {
          errors.push(`Invalid item format: ${item}`);
          continue;
        }

        let result;
        
        if (type === 'thread') {
          if (action === 'delete') {
            result = await prisma.thread.update({
              where: { id: targetId },
              data: { 
                deleted: true,
                deletedAt: new Date(),
                deletedBy: user.id
              }
            });
          } else if (action === 'restore') {
            result = await prisma.thread.update({
              where: { id: targetId },
              data: { 
                deleted: false,
                deletedAt: null,
                deletedBy: null
              }
            });
          } else if (action === 'lock') {
            result = await prisma.thread.update({
              where: { id: targetId },
              data: { isLocked: true }
            });
          } else if (action === 'unlock') {
            result = await prisma.thread.update({
              where: { id: targetId },
              data: { isLocked: false }
            });
          } else if (action === 'approve') {
            result = await prisma.thread.update({
              where: { id: targetId },
              data: { approved: true }
            });
          }
        } else if (type === 'post') {
          if (action === 'delete') {
            result = await prisma.post.update({
              where: { id: targetId },
              data: { 
                deleted: true,
                deletedAt: new Date(),
                deletedBy: user.id
              }
            });
          } else if (action === 'restore') {
            result = await prisma.post.update({
              where: { id: targetId },
              data: { 
                deleted: false,
                deletedAt: null,
                deletedBy: null
              }
            });
          } else if (action === 'approve') {
            result = await prisma.post.update({
              where: { id: targetId },
              data: { approved: true }
            });
          }
        }

        if (result) {
          // Log the moderation action
          await prisma.moderationLog.create({
            data: {
              moderatorId: user.id,
              action: `BULK_${action.toUpperCase()}_${type.toUpperCase()}`,
              targetType: type.toUpperCase(),
              targetId: targetId,
              reason: `Bulk ${action} by moderator`,
              details: JSON.stringify({
                moderatorUsername: user.username,
                timestamp: new Date().toISOString(),
                bulkAction: true
              })
            }
          });

          results.push({ item, success: true });
        } else {
          errors.push(`Failed to ${action} ${item}`);
        }

      } catch (err) {
        console.error(`Error processing ${item}:`, err);
        errors.push(`Error processing ${item}: ${err.message}`);
      }
    }

    res.status(200).json({
      message: `Bulk ${action} completed`,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ message: 'Failed to perform bulk action' });
  }
}
