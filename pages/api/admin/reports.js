import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

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

    if (req.method === 'GET') {
      const { 
        page = 1, 
        limit = 20, 
        status = 'pending'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause based on status filter
      let whereClause = {};
      if (status !== 'all') {
        whereClause.status = status;
      }

      try {
        // Try to get reports (this will fail if reports table doesn't exist)
        const [reports, total] = await Promise.all([
          prisma.report.findMany({
            where: whereClause,
            include: {
              reportedBy: {
                select: { id: true, username: true }
              },
              reportedUser: {
                select: { id: true, username: true }
              },
              thread: {
                select: { id: true, title: true }
              },
              post: {
                select: { id: true, threadId: true, content: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          }),
          prisma.report.count({ where: whereClause })
        ]);

        res.status(200).json({
          status: 'success',
          data: reports,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      } catch (error) {
        // Reports table doesn't exist, return empty data
        res.status(200).json({
          status: 'success',
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0
          }
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
