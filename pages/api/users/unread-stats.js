import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get user's last activity time (when they last marked things as read)
    const lastReadTime = user.lastActivity || user.createdAt;

    // Count unread threads (threads created after user's last activity)
    const unreadThreads = await prisma.thread.count({
      where: {
        createdAt: { gt: lastReadTime },
        deleted: false
      }
    });

    // Count unread posts (posts created after user's last activity)
    const unreadPosts = await prisma.post.count({
      where: {
        createdAt: { gt: lastReadTime },
        deleted: false
      }
    });

    // Count total threads for reference
    const totalThreads = await prisma.thread.count({
      where: { deleted: false }
    });

    // Count total posts for reference
    const totalPosts = await prisma.post.count({
      where: { deleted: false }
    });

    // Get unread threads by subject for more detailed breakdown
    const unreadBySubject = await prisma.thread.groupBy({
      by: ['subjectId'],
      where: {
        createdAt: { gt: lastReadTime },
        deleted: false
      },
      _count: {
        id: true
      }
    });

    // Get subject names for the breakdown
    const subjectBreakdown = await Promise.all(
      unreadBySubject.map(async (item) => {
        const subject = await prisma.subject.findUnique({
          where: { id: item.subjectId },
          select: { 
            id: true, 
            name: true,
            category: { select: { name: true } }
          }
        });
        return {
          subject,
          unreadCount: item._count.id
        };
      })
    );

    res.status(200).json({
      unreadThreads,
      unreadPosts,
      totalThreads,
      totalPosts,
      lastReadTime,
      subjectBreakdown: subjectBreakdown.filter(item => item.subject) // Filter out deleted subjects
    });

  } catch (error) {
    console.error('Error getting unread stats:', error);
    res.status(500).json({ message: 'Failed to get unread statistics' });
  }
}
