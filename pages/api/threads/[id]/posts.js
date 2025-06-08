import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { page = 1, limit = 10 } = req.query;

  try {
    const threadId = parseInt(id);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

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
      skip: limitNum === 1000 ? 0 : skip, // For print view, don't skip
      take: limitNum === 1000 ? undefined : limitNum // For print view, take all
    });

    // Get total count for pagination
    const totalPosts = await prisma.post.count({
      where: {
        threadId: threadId,
        deleted: false
      }
    });

    const totalPages = Math.ceil(totalPosts / limitNum);

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
        currentPage: pageNum,
        totalPages,
        totalPosts,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
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
