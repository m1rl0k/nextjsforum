import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

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

    // Get today's stats
    const [
      newUsersToday,
      newThreadsToday,
      newPostsToday
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
      })
    ]);

    // Calculate percentage changes (mock data for now)
    const stats = {
      users: usersCount,
      threads: threadsCount,
      posts: postsCount,
      categories: categoriesCount,
      subjects: subjectsCount,
      newUsersToday,
      newThreadsToday,
      newPostsToday,
      usersChange: 12, // Mock percentage
      threadsChange: 8, // Mock percentage
      postsChange: 15  // Mock percentage
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
