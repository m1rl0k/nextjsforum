import { getSession } from 'next-auth/react';
import prisma from '../../../lib/db';
import { withAuth } from '../../../middleware/auth';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getSession({ req });
    
    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get counts for all stats in parallel
    const [
      usersCount,
      threadsCount,
      postsCount,
      categoriesCount,
      forumsCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.thread.count(),
      prisma.post.count(),
      prisma.category.count(),
      prisma.forum.count()
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
      forums: forumsCount,
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
};

export default withAuth(handler);
