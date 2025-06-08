import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (req.method === 'GET') {
      const {
        limit = 20,
        offset = 0,
        unreadOnly = 'false',
        type
      } = req.query;

      let whereClause = { userId: user.id };

      if (unreadOnly === 'true') {
        whereClause.read = false;
      }

      if (type) {
        whereClause.type = type;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        include: {
          triggeredBy: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: user.id,
          read: false
        }
      });

      res.status(200).json({
        notifications,
        unreadCount,
        hasMore: notifications.length === parseInt(limit)
      });

    } else if (req.method === 'PUT') {
      // Mark notifications as read
      const { notificationIds, markAllRead } = req.body;

      if (markAllRead) {
        await prisma.notification.updateMany({
          where: {
            userId: user.id,
            read: false
          },
          data: {
            read: true,
            readAt: new Date()
          }
        });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id
          },
          data: {
            read: true,
            readAt: new Date()
          }
        });
      }

      res.status(200).json({ success: true });

    } else if (req.method === 'DELETE') {
      // Delete notifications
      const { notificationIds, deleteAll } = req.body;

      if (deleteAll) {
        await prisma.notification.deleteMany({
          where: { userId: user.id }
        });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: user.id
          }
        });
      }

      res.status(200).json({ success: true });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling notifications:', error);
    res.status(500).json({ error: 'Failed to handle notifications' });
  }
}