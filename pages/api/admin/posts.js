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

    // Get query parameters
    const { limit = 10, page = 1, search = '', sort = 'newest', userId, threadId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    if (userId) {
      where.authorId = parseInt(userId);
    }

    if (threadId) {
      where.threadId = parseInt(threadId);
    }

    // Build orderBy
    let orderBy = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'updated':
        orderBy = { updatedAt: 'desc' };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    // Get posts with pagination and related data
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          thread: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        },
        orderBy,
        take: parseInt(limit),
        skip
      }),
      prisma.post.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export default withAuth(handler);
