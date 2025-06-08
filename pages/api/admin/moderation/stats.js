import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return res.status(403).json({ message: 'Moderator access required' });
    }

    // Get current date for today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch moderation statistics
    const [
      pendingReports,
      pendingContent,
      bannedUsers,
      resolvedToday,
      totalReports,
      reportsByType,
      recentActivity
    ] = await Promise.all([
      // Pending reports count
      prisma.report.count({
        where: { status: 'PENDING' }
      }),

      // Pending content count (if you have approval system)
      // For now, we'll count recently created content that might need review
      (async () => {
        const threadCount = await prisma.thread.count({
          where: {
            createdAt: { gte: today },
            deleted: false
          }
        });
        const postCount = await prisma.post.count({
          where: {
            createdAt: { gte: today },
            deleted: false
          }
        });
        return threadCount + postCount;
      })(),

      // Banned users count
      prisma.user.count({
        where: { isBanned: true }
      }),

      // Reports resolved today
      prisma.report.count({
        where: {
          status: { in: ['RESOLVED', 'DISMISSED'] },
          resolvedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),

      // Total reports
      prisma.report.count(),

      // Reports by type
      prisma.report.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),

      // Recent moderation activity
      prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { username: true } },
          thread: { select: { title: true } },
          post: { select: { content: true } },
          user: { select: { username: true } }
        }
      })
    ]);

    // Calculate additional stats
    const reportStats = reportsByType.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id;
      return acc;
    }, { pending: 0, resolved: 0, dismissed: 0 });

    // Get weekly trend
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyReports = await prisma.report.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    });

    const weeklyBans = await prisma.user.count({
      where: {
        isBanned: true,
        updatedAt: { gte: weekAgo }
      }
    });

    res.status(200).json({
      pendingReports,
      pendingContent,
      bannedUsers,
      resolvedToday,
      totalReports,
      reportStats,
      weeklyStats: {
        reports: weeklyReports,
        bans: weeklyBans
      },
      recentActivity: recentActivity.slice(0, 5) // Limit to 5 most recent
    });

  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ message: 'Failed to fetch moderation statistics' });
  }
}
