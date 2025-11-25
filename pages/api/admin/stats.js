import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

const percentChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get counts for all stats in parallel
    const [
      usersCount,
      threadsCount,
      postsCount,
      categoriesCount,
      subjectsCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.thread.count(),
      prisma.post.count(),
      prisma.category.count(),
      prisma.subject.count()
    ]);

    // Get today's date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's stats and previous day for deltas
    const [
      newUsersToday,
      newThreadsToday,
      newPostsToday,
      newUsersYesterday,
      newThreadsYesterday,
      newPostsYesterday
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      prisma.thread.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      prisma.thread.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      })
    ]);

    const stats = {
      users: usersCount,
      threads: threadsCount,
      posts: postsCount,
      categories: categoriesCount,
      subjects: subjectsCount,
      newUsersToday,
      newThreadsToday,
      newPostsToday,
      usersChange: percentChange(newUsersToday, newUsersYesterday),
      threadsChange: percentChange(newThreadsToday, newThreadsYesterday),
      postsChange: percentChange(newPostsToday, newPostsYesterday)
    };

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
