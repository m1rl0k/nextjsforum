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

    const { limit = 10 } = req.query;

    // For now, we'll return recently created content that might need review
    // In a real forum, you might have an approval system where content is marked as "pending"
    
    // Get recent threads (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentThreads = await prisma.thread.findMany({
      where: {
        createdAt: { gte: yesterday },
        deleted: false
      },
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
      take: Math.floor(parseInt(limit) / 2)
    });

    // Get recent posts (last 24 hours)
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: { gte: yesterday },
        deleted: false
      },
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
      take: Math.floor(parseInt(limit) / 2)
    });

    // Combine and format the content
    const content = [
      ...recentThreads.map(thread => ({
        type: 'thread',
        id: thread.id,
        title: thread.title,
        content: thread.content?.substring(0, 100) + '...' || 'No content',
        user: thread.user,
        createdAt: thread.createdAt,
        subject: thread.subject?.name
      })),
      ...recentPosts.map(post => ({
        type: 'post',
        id: post.id,
        title: `Post in: ${post.thread?.title}`,
        content: post.content?.substring(0, 100) + '...' || 'No content',
        user: post.user,
        createdAt: post.createdAt,
        threadId: post.thread?.id
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      content: content.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching pending content:', error);
    res.status(500).json({ message: 'Failed to fetch pending content' });
  }
}
