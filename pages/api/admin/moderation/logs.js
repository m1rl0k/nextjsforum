import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { 
      action = 'all', 
      days = '7', 
      moderator = 'all', 
      limit = 100 
    } = req.query;

    let whereClause = {};

    // Filter by action type
    if (action !== 'all') {
      whereClause.action = {
        contains: action
      };
    }

    // Filter by moderator
    if (moderator !== 'all') {
      whereClause.moderatorId = parseInt(moderator);
    }

    // Filter by date range
    if (days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      whereClause.createdAt = {
        gte: daysAgo
      };
    }

    const logs = await prisma.moderationLog.findMany({
      where: whereClause,
      include: {
        moderator: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.status(200).json({
      logs
    });

  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    res.status(500).json({ message: 'Failed to fetch moderation logs' });
  }
}
