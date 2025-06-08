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
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build orderBy
    let orderBy = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'replies':
        orderBy = { posts: { _count: 'desc' } };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    // Get threads with pagination
    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              isActive: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          posts: {
            select: {
              id: true
            }
          }
        },
        orderBy,
        take: parseInt(limit),
        skip
      }),
      prisma.thread.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: threads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
