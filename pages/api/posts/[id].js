import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { associateImagesWithPost } from '../../../lib/imageUtils';

export default async function handler(req, res) {
  const { id } = req.query;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  // GET - Fetch single post
  if (req.method === 'GET') {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          },
          thread: {
            select: {
              id: true,
              title: true,
              isLocked: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.status(200).json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  // PUT - Edit post
  if (req.method === 'PUT') {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get the post with thread info
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          thread: {
            select: {
              id: true,
              isLocked: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if thread is locked (admins/mods can still edit)
      if (post.thread.isLocked && user.role === 'USER') {
        return res.status(403).json({ error: 'Cannot edit posts in a locked thread' });
      }

      // Check permissions - user can edit their own posts, admins/mods can edit any
      const canEdit = post.userId === user.id || user.role === 'ADMIN' || user.role === 'MODERATOR';

      if (!canEdit) {
        return res.status(403).json({ error: 'You do not have permission to edit this post' });
      }

      const { content, editReason } = req.body;

      if (!content || content.trim().length < 1) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || '';

      // Update the post
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: content.trim(),
          editedAt: new Date(),
          editedBy: user.id,
          editReason: editReason || null,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          }
        }
      });

      // Audit log
      try {
        await prisma.moderationLog.create({
          data: {
            moderatorId: user.id,
            action: 'EDIT_POST',
            targetType: 'POST',
            targetId: postId,
            reason: editReason || 'Post edited',
            details: JSON.stringify({
              previousContent: post.content?.substring(0, 500),
              newContent: content.substring(0, 500),
              ip
            })
          }
        });
      } catch (logErr) {
        console.error('Audit log failed for post edit:', logErr);
      }

      // Associate any new images in the content
      await associateImagesWithPost(postId, content);

      return res.status(200).json({
        message: 'Post updated successfully',
        post: updatedPost
      });
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  // DELETE - Delete post
  if (req.method === 'DELETE') {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          thread: true
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Only admins and moderators can delete posts
      if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
        return res.status(403).json({ error: 'You do not have permission to delete this post' });
      }

      const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || '';

      // Soft delete the post
      await prisma.post.update({
        where: { id: postId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: user.id
        }
      });

      // Update thread post count
      await prisma.thread.update({
        where: { id: post.threadId },
        data: {
          postCount: { decrement: 1 },
          replyCount: { decrement: 1 }
        }
      });

      // Audit log
      try {
        await prisma.moderationLog.create({
          data: {
            moderatorId: user.id,
            action: 'DELETE_POST',
            targetType: 'POST',
            targetId: postId,
            reason: 'Post deleted',
            details: JSON.stringify({
              previousContent: post.content?.substring(0, 500),
              ip
            })
          }
        });
      } catch (logErr) {
        console.error('Audit log failed for post delete:', logErr);
      }

      return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
