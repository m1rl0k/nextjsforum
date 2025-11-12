import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user is admin or moderator
    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'MODERATOR') {
      return res.status(403).json({ message: 'Admin or moderator access required' });
    }

    const { id } = req.query;
    const threadId = Number.parseInt(id, 10);

    if (req.method === 'PUT') {
      // Update thread (sticky, lock, delete, etc.)
      const { action } = req.body;

      const updateData = {};

      if (action === 'sticky') {
        updateData.isSticky = true;
      } else if (action === 'unsticky') {
        updateData.isSticky = false;
      } else if (action === 'lock') {
        updateData.isLocked = true;
      } else if (action === 'unlock') {
        updateData.isLocked = false;
      } else if (action === 'delete') {
        updateData.deleted = true;
      } else if (action === 'restore') {
        updateData.deleted = false;
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const updatedThread = await prisma.thread.update({
        where: { id: threadId },
        data: updateData,
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
              id: true,
              name: true
            }
          }
        }
      });

      res.status(200).json({
        status: 'success',
        data: updatedThread,
        message: `Thread ${action}d successfully`
      });
    } else if (req.method === 'DELETE') {
      // Hard delete thread (admin only)
      if (adminUser.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required for permanent deletion' });
      }

      // Delete all posts in the thread first
      await prisma.post.deleteMany({
        where: { threadId }
      });

      // Delete the thread
      await prisma.thread.delete({
        where: { id: threadId }
      });

      res.status(200).json({
        status: 'success',
        message: 'Thread permanently deleted'
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin thread handler:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

