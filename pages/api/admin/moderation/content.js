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

    const { filter = 'all', search = '', limit = 50 } = req.query;

    let whereClause = {};
    
    // Apply search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply content filter
    if (filter === 'flagged') {
      whereClause.deleted = false;
      // Add logic for flagged content when we implement it
    } else if (filter === 'deleted') {
      whereClause.deleted = true;
    } else if (filter !== 'all') {
      whereClause.deleted = false;
    }

    let content = [];

    // Fetch threads if not filtering for posts only
    if (filter !== 'posts') {
      const threads = await prisma.thread.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          subject: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filter === 'threads' ? parseInt(limit) : Math.floor(parseInt(limit) / 2)
      });

      content.push(...threads.map(thread => ({
        type: 'thread',
        id: thread.id,
        title: thread.title,
        content: thread.content,
        user: thread.user,
        subject: thread.subject?.name,
        createdAt: thread.createdAt,
        deleted: thread.deleted,
        locked: thread.isLocked,
        sticky: thread.isSticky
      })));
    }

    // Fetch posts if not filtering for threads only
    if (filter !== 'threads') {
      const posts = await prisma.post.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          thread: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filter === 'posts' ? parseInt(limit) : Math.floor(parseInt(limit) / 2)
      });

      content.push(...posts.map(post => ({
        type: 'post',
        id: post.id,
        title: `Post in: ${post.thread?.title}`,
        content: post.content,
        user: post.user,
        threadId: post.thread?.id,
        threadTitle: post.thread?.title,
        createdAt: post.createdAt,
        deleted: post.deleted
      })));
    }

    // Sort by creation date
    content.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit results
    content = content.slice(0, parseInt(limit));

    res.status(200).json({
      content
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Failed to fetch content' });
  }
}
