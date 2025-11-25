import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
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

    if (req.method === 'GET') {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        sort = 'newest',
        type = 'threads'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      let orderBy = {};
      switch (sort) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'most_replies':
          orderBy = type === 'threads' ? { posts: { _count: 'desc' } } : { createdAt: 'desc' };
          break;
        case 'most_views':
          orderBy = type === 'threads' ? { viewCount: 'desc' } : { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      if (type === 'threads') {
        // Get threads
        const whereClause = search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } }
          ]
        } : {};

        const [threads, total] = await Promise.all([
          prisma.thread.findMany({
            where: whereClause,
            include: {
              user: {
                select: { id: true, username: true }
              },
              subject: {
                select: { id: true, name: true }
              },
              posts: {
                select: { id: true }
              }
            },
            orderBy,
            skip: offset,
            take: limitNum
          }),
          prisma.thread.count({ where: whereClause })
        ]);

        res.status(200).json({
          status: 'success',
          data: threads,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      } else if (type === 'posts') {
        // Get posts
        const whereClause = search ? {
          OR: [
            { content: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { thread: { title: { contains: search, mode: 'insensitive' } } }
          ]
        } : {};

        const [posts, total] = await Promise.all([
          prisma.post.findMany({
            where: whereClause,
            include: {
              user: {
                select: { id: true, username: true }
              },
              thread: {
                select: { id: true, title: true }
              }
            },
            orderBy,
            skip: offset,
            take: limitNum
          }),
          prisma.post.count({ where: whereClause })
        ]);

        res.status(200).json({
          status: 'success',
          data: posts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      } else if (type === 'reported') {
        // Get reported content from the Report table
        const whereClause = {
          status: { in: ['PENDING', 'REVIEWED'] }
        };

        if (search) {
          whereClause.OR = [
            { reason: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { reportedBy: { username: { contains: search, mode: 'insensitive' } } }
          ];
        }

        const [reports, total] = await Promise.all([
          prisma.report.findMany({
            where: whereClause,
            include: {
              reportedBy: {
                select: { id: true, username: true }
              },
              thread: {
                select: {
                  id: true,
                  title: true,
                  user: { select: { id: true, username: true } }
                }
              },
              post: {
                select: {
                  id: true,
                  content: true,
                  user: { select: { id: true, username: true } },
                  thread: { select: { id: true, title: true } }
                }
              },
              user: {
                select: { id: true, username: true }
              },
              resolvedByUser: {
                select: { id: true, username: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          }),
          prisma.report.count({ where: whereClause })
        ]);

        res.status(200).json({
          status: 'success',
          data: reports,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      } else {
        res.status(400).json({ message: 'Invalid content type' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
