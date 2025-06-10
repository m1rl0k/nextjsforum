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

      try {
        // Get the report first
        const report = await prisma.report.findUnique({
          where: { id: parseInt(id) },
          include: {
            thread: true,
            post: true,
            reportedUser: true
          }
        });

        if (!report) {
          return res.status(404).json({ message: 'Report not found' });
        }

        if (action === 'approve') {
          // Take action based on report type
          if (report.threadId) {
            // Handle thread report - could delete, lock, or hide the thread
            await prisma.thread.update({
              where: { id: report.threadId },
              data: { 
                deleted: true,
                deletedAt: new Date(),
                deletedBy: user.id
              }
            });
          } else if (report.postId) {
            // Handle post report - could delete or hide the post
            await prisma.post.update({
              where: { id: report.postId },
              data: { 
                deleted: true,
                deletedAt: new Date(),
                deletedBy: user.id
              }
            });
          } else if (report.reportedUserId) {
            // Handle user report - could warn, suspend, or ban the user
            await prisma.user.update({
              where: { id: report.reportedUserId },
              data: { 
                isActive: false,
                suspendedAt: new Date(),
                suspendedBy: user.id
              }
            });
          }

          // Update report status
          await prisma.report.update({
            where: { id: parseInt(id) },
            data: {
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: user.id,
              action: 'content_removed'
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
              status: 'dismissed',
              resolvedAt: new Date(),
              resolvedBy: user.id,
              action: 'no_action'
            }
          });

          res.status(200).json({
            status: 'success',
            message: 'Report dismissed'
          });
        } else {
          res.status(400).json({ message: 'Invalid action' });
        }
      } catch (error) {
        // Reports table might not exist
        res.status(404).json({ message: 'Reports system not available' });
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
