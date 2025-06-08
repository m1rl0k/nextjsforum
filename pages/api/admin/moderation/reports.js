import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
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
      const { status = 'PENDING', limit = 50, page = 1 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Fetch reports with filters
      const reports = await prisma.report.findMany({
        where: {
          ...(status !== 'ALL' && { status })
        },
        include: {
          reportedBy: { 
            select: { 
              id: true, 
              username: true, 
              avatar: true 
            } 
          },
          thread: { 
            select: { 
              id: true, 
              title: true,
              user: { select: { username: true } }
            } 
          },
          post: { 
            select: { 
              id: true, 
              content: true,
              user: { select: { username: true } },
              thread: { select: { id: true, title: true } }
            } 
          },
          user: { 
            select: { 
              id: true, 
              username: true, 
              avatar: true,
              role: true
            } 
          }
        },
        orderBy: [
          { status: 'asc' }, // Pending first
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      });

      // Get total count for pagination
      const totalReports = await prisma.report.count({
        where: {
          ...(status !== 'ALL' && { status })
        }
      });

      res.status(200).json({
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReports / parseInt(limit)),
          totalReports,
          limit: parseInt(limit)
        }
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling reports:', error);
    res.status(500).json({ message: 'Failed to handle reports' });
  }
}
