import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const thread = await prisma.thread.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        subject: true,
        posts: {
          include: {
            user: true,
            replyTo: true,
          },
        },
      },
    });

    if (thread) {
      res.status(200).json(thread);
    } else {
      res.status(404).json({ error: 'Thread not found' });
    }
  } else if (req.method === 'POST') {
    const { content, replyToId } = req.body;

    try {
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
        where: { id: parseInt(id) },
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
          threadId: parseInt(id),
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
        where: { id: parseInt(id) },
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

      res.status(201).json(post);
    } catch (error) {
      console.error('Error posting reply:', error);
      res.status(500).json({ error: 'Posting reply failed' });
    }
  } else if (req.method === 'PUT') {
    const { action } = req.body;

    try {
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
          where: { id: parseInt(id) },
          data: { locked: true },
        });
      } else if (action === 'unlock') {
        await prisma.thread.update({
          where: { id: parseInt(id) },
          data: { locked: false },
        });
      } else if (action === 'sticky') {
        await prisma.thread.update({
          where: { id: parseInt(id) },
          data: { sticky: true },
        });
      } else if (action === 'unsticky') {
        await prisma.thread.update({
          where: { id: parseInt(id) },
          data: { sticky: false },
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
