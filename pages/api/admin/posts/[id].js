import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get specific post details
      const post = await prisma.post.findUnique({
        where: { id: Number.parseInt(id, 10) },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              isActive: true
            }
          },
          thread: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.status(200).json({
        status: 'success',
        data: post
      });
    } else if (req.method === 'PUT') {
      // Update post (edit content, soft delete, restore, etc.)
      const { action, content } = req.body;

      if (action === 'delete') {
        // Soft delete the post
        const post = await prisma.post.findUnique({
          where: { id: Number.parseInt(id, 10) },
          include: {
            thread: true
          }
        });

        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }

        // Soft delete the post
        await prisma.post.update({
          where: { id: Number.parseInt(id, 10) },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: user.id
          }
        });

        // Update thread post count and last post info
        const remainingPosts = await prisma.post.findMany({
          where: { threadId: post.threadId },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: true
          }
        });

        const updateData = {};
        if (remainingPosts.length > 0) {
          updateData.lastPostAt = remainingPosts[0].createdAt;
          updateData.lastPostUserId = remainingPosts[0].userId;
        } else {
          // If no posts remain, use thread creation data
          const thread = await prisma.thread.findUnique({
            where: { id: post.threadId }
          });
          updateData.lastPostAt = thread.createdAt;
          updateData.lastPostUserId = thread.userId;
        }

        await prisma.thread.update({
          where: { id: post.threadId },
          data: updateData
        });

        // Update subject post count
        await prisma.subject.update({
          where: { id: post.thread.subjectId },
          data: {
            postCount: {
              decrement: 1
            }
          }
        });

        // Update user post count
        await prisma.user.update({
          where: { id: post.userId },
          data: {
            postCount: {
              decrement: 1
            }
          }
        });

        res.status(200).json({
          status: 'success',
          message: 'Post deleted successfully'
        });
      } else if (action === 'restore') {
        // Restore a soft-deleted post
        const updatedPost = await prisma.post.update({
          where: { id: Number.parseInt(id, 10) },
          data: {
            deleted: false,
            deletedAt: null,
            deletedBy: null
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
          }
        });

        res.status(200).json({
          status: 'success',
          data: updatedPost,
          message: 'Post restored successfully'
        });
      } else if (action === 'edit' && content) {
        // Edit post content
        const updatedPost = await prisma.post.update({
          where: { id: Number.parseInt(id, 10) },
          data: { 
            content,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                isActive: true
              }
            },
            thread: {
              select: {
                id: true,
                title: true,
                subject: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        res.status(200).json({
          status: 'success',
          data: updatedPost,
          message: 'Post updated successfully'
        });
      } else {
        res.status(400).json({ message: 'Invalid action or missing content' });
      }
    } else if (req.method === 'DELETE') {
      // Hard delete (admin only)
      const post = await prisma.post.findUnique({
        where: { id: Number.parseInt(id, 10) },
        include: {
          thread: true
        }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Hard delete the post
      await prisma.post.delete({
        where: { id: Number.parseInt(id, 10) }
      });

      // Update counters (same logic as above)
      const remainingPosts = await prisma.post.findMany({
        where: { threadId: post.threadId },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          user: true
        }
      });

      const updateData = {};
      if (remainingPosts.length > 0) {
        updateData.lastPostAt = remainingPosts[0].createdAt;
        updateData.lastPostUserId = remainingPosts[0].userId;
      } else {
        const thread = await prisma.thread.findUnique({
          where: { id: post.threadId }
        });
        updateData.lastPostAt = thread.createdAt;
        updateData.lastPostUserId = thread.userId;
      }

      await prisma.thread.update({
        where: { id: post.threadId },
        data: updateData
      });

      await prisma.subject.update({
        where: { id: post.thread.subjectId },
        data: {
          postCount: {
            decrement: 1
          }
        }
      });

      await prisma.user.update({
        where: { id: post.userId },
        data: {
          postCount: {
            decrement: 1
          }
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Post deleted successfully'
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin post management:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
