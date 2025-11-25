import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';
import { createNotification, sendEmailNotification } from '../../../../../lib/notifications';

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
        where: { id: Number.parseInt(id, 10) },
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
              user: { select: { id: true, username: true } },
              subject: { select: { name: true } }
            } 
          },
          post: { 
            select: { 
              id: true, 
              content: true,
              createdAt: true,
              user: { select: { id: true, username: true } },
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
        where: { id: Number.parseInt(id, 10) },
        data: {
          status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED',
          resolvedAt: new Date(),
          resolution: resolution || null,
          resolvedBy: user.id
        },
        include: {
          reportedBy: { select: { id: true, username: true } },
          thread: { select: { id: true, title: true, userId: true } },
          post: { select: { id: true, content: true, userId: true, threadId: true } },
          user: { select: { id: true, username: true, email: true } }
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

      // Notify reporter and content owner (fail-soft)
      try {
        const actionLabel = action === 'resolve' ? 'resolved' : 'dismissed';
        const actionUrl = updatedReport.threadId
          ? `/threads/${updatedReport.threadId}${updatedReport.postId ? `#post-${updatedReport.postId}` : ''}`
          : null;

        if (updatedReport.reportedById) {
          await createNotification({
            userId: updatedReport.reportedById,
            type: 'MODERATION_ACTION',
            title: `Your report was ${actionLabel}`,
            content: `A moderator ${actionLabel} your report${resolution ? `: ${resolution}` : ''}.`,
            actionUrl,
            relatedType: updatedReport.threadId ? 'thread' : updatedReport.postId ? 'post' : 'user',
            relatedId: updatedReport.threadId || updatedReport.postId || updatedReport.userId,
            triggeredById: user.id
          });
          if (updatedReport.reportedBy?.email) {
            await sendEmailNotification({
              to: updatedReport.reportedBy.email,
              subject: `Your report was ${actionLabel}`,
              text: `Hello ${updatedReport.reportedBy.username},\n\nA moderator ${actionLabel} your report${resolution ? `: ${resolution}` : ''}.\n${actionUrl ? `View: ${actionUrl}` : ''}`
            });
          }
        }

        const contentOwnerId = updatedReport.post?.userId || updatedReport.thread?.userId;
        if (contentOwnerId) {
          await createNotification({
            userId: contentOwnerId,
            type: 'MODERATION_ACTION',
            title: `Your content was ${actionLabel}`,
            content: `A moderator ${actionLabel} a report about your content${resolution ? `: ${resolution}` : ''}.`,
            actionUrl,
            relatedType: updatedReport.threadId ? 'thread' : 'post',
            relatedId: updatedReport.threadId || updatedReport.postId,
            triggeredById: user.id
          });
          const ownerEmail = updatedReport.user?.email || updatedReport.post?.user?.email || updatedReport.thread?.user?.email;
          const ownerName = updatedReport.user?.username || updatedReport.post?.user?.username || updatedReport.thread?.user?.username;
          if (ownerEmail) {
            await sendEmailNotification({
              to: ownerEmail,
              subject: `Your content was ${actionLabel}`,
              text: `Hello ${ownerName || 'user'},\n\nA moderator ${actionLabel} a report about your content${resolution ? `: ${resolution}` : ''}.\n${actionUrl ? `View: ${actionUrl}` : ''}`
            });
          }
        }
      } catch (notifyError) {
        console.error('Error sending moderation notifications:', notifyError);
      }

      res.status(200).json({ 
        message: `Report ${action}ed successfully`,
        report: updatedReport
      });

    } else if (req.method === 'DELETE') {
      // Delete report (admin only)
      await prisma.report.delete({
        where: { id: Number.parseInt(id, 10) }
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
