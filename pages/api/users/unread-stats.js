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

    // Get subject names for the breakdown (batch query to avoid N+1)
    const subjectIds = unreadBySubject.map(item => item.subjectId);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: {
        id: true,
        name: true,
        category: { select: { name: true } }
      }
    });

    // Create a map for quick lookup
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // Build the breakdown using the map
    const subjectBreakdown = unreadBySubject
      .map(item => ({
        subject: subjectMap.get(item.subjectId),
        unreadCount: item._count.id
      }))
      .filter(item => item.subject); // Filter out deleted subjects

    res.status(200).json({
      unreadThreads,
      unreadPosts,
      totalThreads,
      totalPosts,
      lastReadTime,
      subjectBreakdown
    });

  } catch (error) {
    console.error('Error getting unread stats:', error);
    res.status(500).json({ message: 'Failed to get unread statistics' });
  }
}
