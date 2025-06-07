import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

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

    // Get query parameters
    const { limit = 10, page = 1, search = '', sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    let orderBy = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name_asc':
        orderBy = { username: 'asc' };
        break;
      case 'name_desc':
        orderBy = { username: 'desc' };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              threads: true,
              posts: true
            }
          }
        },
        orderBy,
        take: parseInt(limit),
        skip
      }),
      prisma.user.count({ where })
    ]);

    // Format response
    const formattedUsers = users.map(user => ({
      ...user,
      threadCount: user._count.threads,
      postCount: user._count.posts,
      _count: undefined // Remove the _count field
    }));

    res.status(200).json({
      status: 'success',
      data: formattedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};


