import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { associateImagesWithPost } from '../../../lib/imageUtils';
import { findThreadBySlugOrId } from '../../../lib/slugUtils';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Thread ID is required' });
      }

      const threadId = parseInt(id);
      if (isNaN(threadId)) {
        return res.status(400).json({ error: 'Invalid thread ID' });
      }

      // Try to find thread by slug or ID
      let thread = await findThreadBySlugOrId(id);

      if (thread) {
        // Get posts separately to maintain the same structure
        const posts = await prisma.post.findMany({
          where: { threadId: thread.id },
          include: {
            user: true,
            replyTo: true,
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        thread.posts = posts;
      }

    if (thread) {
      res.status(200).json(thread);
    } else {
      res.status(404).json({ error: 'Thread not found' });
    }
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
} else if (req.method === 'POST') {
    const { content, replyToId } = req.body;

    try {
      if (!id) {
        return res.status(400).json({ error: 'Thread ID is required' });
      }

      const threadId = parseInt(id);
      if (isNaN(threadId)) {
        return res.status(400).json({ error: 'Invalid thread ID' });
      }
      // Get token from cookies
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if thread exists and is not locked
      const thread = await prisma.thread.findUnique({
        where: { id: threadId },
      });

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      if (thread.locked && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
        return res.status(403).json({ error: 'Thread is locked' });
      }

      const post = await prisma.post.create({
        data: {
          content,
          threadId: threadId,
          userId: user.id,
          replyToId: replyToId ? parseInt(replyToId) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              avatar: true,
              signature: true,
              postCount: true,
              joinDate: true
            }
          }
        }
      });

      // Update thread's last post info
      await prisma.thread.update({
        where: { id: threadId },
        data: {
          lastPostAt: new Date(),
          lastPostUserId: user.id
        }
      });

      // Update subject post count
      await prisma.subject.update({
        where: { id: thread.subjectId },
        data: {
          postCount: {
            increment: 1
          }
        }
      });

      // Update user post count
      await prisma.user.update({
        where: { id: user.id },
        data: {
          postCount: {
            increment: 1
          }
        }
      });

      // Associate any images in the content with this post
      await associateImagesWithPost(post.id, content);

      res.status(201).json(post);
    } catch (error) {
      console.error('Error posting reply:', error);
      res.status(500).json({ error: 'Posting reply failed' });
    }
  } else if (req.method === 'PUT') {
    const { action } = req.body;

    try {
      if (!id) {
        return res.status(400).json({ error: 'Thread ID is required' });
      }

      const threadId = parseInt(id);
      if (isNaN(threadId)) {
        return res.status(400).json({ error: 'Invalid thread ID' });
      }
      // Get token from cookies
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'User not authorized' });
      }

      if (action === 'lock') {
        await prisma.thread.update({
          where: { id: threadId },
          data: { isLocked: true },
        });
      } else if (action === 'unlock') {
        await prisma.thread.update({
          where: { id: threadId },
          data: { isLocked: false },
        });
      } else if (action === 'sticky') {
        await prisma.thread.update({
          where: { id: threadId },
          data: { isSticky: true, threadType: 'STICKY' },
        });
      } else if (action === 'unsticky') {
        await prisma.thread.update({
          where: { id: threadId },
          data: { isSticky: false, threadType: 'NORMAL' },
        });
      } else if (action === 'pin') {
        await prisma.thread.update({
          where: { id: threadId },
          data: { threadType: 'ANNOUNCEMENT' },
        });
      } else if (action === 'unpin') {
        await prisma.thread.update({
          where: { id: threadId },
          data: { threadType: 'NORMAL' },
        });
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }

      res.status(200).json({ message: 'Thread updated successfully' });
    } catch (error) {
      console.error('Error updating thread:', error);
      res.status(500).json({ error: 'Failed to update thread' });
    }
  } else {
    res.status(405).end();
  }
}
