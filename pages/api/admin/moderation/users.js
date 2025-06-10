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

    const { page = 1, limit = 20, filter = 'all', search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on filter
    let where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    switch (filter) {
      case 'active':
        where.isActive = true;
        break;
      case 'banned':
        where.isActive = false;
        break;
      case 'moderators':
        where.role = { in: ['ADMIN', 'MODERATOR'] };
        break;
      case 'recent':
        // Users created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        where.createdAt = { gte: thirtyDaysAgo };
        break;
      // 'all' case - no additional filters
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          postCount: true,
          _count: {
            select: {
              posts: true,
              threads: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Calculate post counts for users who don't have it stored
    const usersWithCounts = users.map(user => ({
      ...user,
      postCount: user.postCount || user._count.posts,
      threadCount: user._count.threads
    }));

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      users: usersWithCounts,
      total,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Error fetching users for moderation:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}
