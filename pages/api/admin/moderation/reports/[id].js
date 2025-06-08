import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

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

    if (req.method === 'GET') {
      // Get specific report details
      const report = await prisma.report.findUnique({
        where: { id: parseInt(id) },
        include: {
          reportedBy: { 
            select: { 
              id: true, 
              username: true, 
              avatar: true,
              email: true,
              createdAt: true
            } 
          },
          thread: { 
            select: { 
              id: true, 
              title: true,
              content: true,
              createdAt: true,
              user: { select: { username: true } },
              subject: { select: { name: true } }
            } 
          },
          post: { 
            select: { 
              id: true, 
              content: true,
              createdAt: true,
              user: { select: { username: true } },
              thread: { select: { id: true, title: true } }
            } 
          },
          user: { 
            select: { 
              id: true, 
              username: true, 
              avatar: true,
              email: true,
              role: true,
              createdAt: true,
              isBanned: true,
              banReason: true
            } 
          }
        }
      });

      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }

      res.status(200).json({ report });

    } else if (req.method === 'PUT') {
      // Update report status
      const { action, resolution } = req.body;

      if (!['resolve', 'dismiss'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const updatedReport = await prisma.report.update({
        where: { id: parseInt(id) },
        data: {
          status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED',
          resolvedAt: new Date(),
          resolution: resolution || null,
          resolvedById: user.id
        },
        include: {
          reportedBy: { select: { username: true } },
          thread: { select: { title: true } },
          post: { select: { content: true } },
          user: { select: { username: true } }
        }
      });

      // Log the moderation action
      await prisma.moderationLog.create({
        data: {
          moderatorId: user.id,
          action: `REPORT_${action.toUpperCase()}`,
          targetType: updatedReport.threadId ? 'THREAD' : 
                     updatedReport.postId ? 'POST' : 'USER',
          targetId: updatedReport.threadId || updatedReport.postId || updatedReport.userId,
          reason: resolution || `Report ${action}ed`,
          details: JSON.stringify({
            reportId: updatedReport.id,
            originalReason: updatedReport.reason
          })
        }
      });

      res.status(200).json({ 
        message: `Report ${action}ed successfully`,
        report: updatedReport
      });

    } else if (req.method === 'DELETE') {
      // Delete report (admin only)
      await prisma.report.delete({
        where: { id: parseInt(id) }
      });

      res.status(200).json({ message: 'Report deleted successfully' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling report:', error);
    res.status(500).json({ message: 'Failed to handle report' });
  }
}
