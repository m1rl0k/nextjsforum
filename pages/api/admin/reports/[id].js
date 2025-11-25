import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'PUT') {
      const { action } = req.body;

      if (!action) {
        return res.status(400).json({ message: 'Action is required' });
      }

      // Get the report first
      const report = await prisma.report.findUnique({
        where: { id: parseInt(id) },
        include: {
          thread: true,
          post: true,
          user: true
        }
      });

      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }

      if (action === 'approve') {
        // Take action based on report type
        if (report.threadId) {
          // Handle thread report - delete the thread
          await prisma.thread.update({
            where: { id: report.threadId },
            data: {
              deleted: true,
              deletedAt: new Date(),
              deletedBy: user.id
            }
          });
        } else if (report.postId) {
          // Handle post report - delete the post
          await prisma.post.update({
            where: { id: report.postId },
            data: {
              deleted: true,
              deletedAt: new Date(),
              deletedBy: user.id
            }
          });
        } else if (report.userId) {
          // Handle user report - suspend the user
          await prisma.user.update({
            where: { id: report.userId },
            data: {
              isActive: false,
              isBanned: true,
              banReason: `Suspended due to report: ${report.reason}`
            }
          });
        }

        // Update report status
        await prisma.report.update({
          where: { id: parseInt(id) },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: user.id,
            resolution: 'content_removed'
          }
        });

        res.status(200).json({
          status: 'success',
          message: 'Report approved and action taken'
        });
      } else if (action === 'dismiss') {
        // Dismiss the report without taking action
        await prisma.report.update({
          where: { id: parseInt(id) },
          data: {
            status: 'DISMISSED',
            resolvedAt: new Date(),
            resolvedBy: user.id,
            resolution: 'no_action'
          }
        });

        res.status(200).json({
          status: 'success',
          message: 'Report dismissed'
        });
      } else {
        res.status(400).json({ message: 'Invalid action' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin report action:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
