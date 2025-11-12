import prisma from '../../../../lib/prisma';
import { paginationSchema, validateQuery } from '../../../../lib/validation';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Validate thread ID
    const threadId = Number.parseInt(id, 10);
    if (Number.isNaN(threadId) || threadId <= 0) {
      return res.status(400).json({ error: 'Invalid thread ID' });
    }

    // Validate pagination parameters
    const validation = validateQuery(paginationSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: validation.errors
      });
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Verify thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, title: true }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Get posts for the thread
    const posts = await prisma.post.findMany({
      where: {
        threadId: threadId,
        deleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            signature: true,
            postCount: true,
            createdAt: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip: limit === 1000 ? 0 : skip, // For print view, don't skip
      take: limit === 1000 ? undefined : limit // For print view, take all
    });

    // Get total count for pagination
    const totalPosts = await prisma.post.count({
      where: {
        threadId: threadId,
        deleted: false
      }
    });

    const totalPages = Math.ceil(totalPosts / limit);

    // Update view count for the thread
    await prisma.thread.update({
      where: { id: threadId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    res.status(200).json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      thread: {
        id: thread.id,
        title: thread.title
      }
    });

  } catch (error) {
    console.error('Error fetching thread posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
