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

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      try {
        // Get all posts with related data
        const posts = await prisma.post.findMany({
          include: {
            user: {
              select: { id: true, username: true }
            },
            thread: {
              select: { 
                id: true, 
                title: true,
                subject: {
                  select: { 
                    name: true,
                    category: { select: { name: true } }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Convert to CSV format
        const csvHeaders = [
          'ID',
          'Content Preview',
          'Author',
          'Thread Title',
          'Forum',
          'Category',
          'Deleted',
          'Created At',
          'Updated At'
        ];

        const csvRows = posts.map(post => [
          post.id,
          `"${(post.content || '').substring(0, 200).replace(/"/g, '""')}"`,
          `"${post.user?.username || 'Unknown'}"`,
          `"${post.thread?.title || ''}"`,
          `"${post.thread?.subject?.name || ''}"`,
          `"${post.thread?.subject?.category?.name || ''}"`,
          post.deleted ? 'Yes' : 'No',
          post.createdAt ? new Date(post.createdAt).toISOString() : '',
          post.updatedAt ? new Date(post.updatedAt).toISOString() : ''
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="posts-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        console.log('Sending CSV with', posts.length, 'posts');
        res.status(200).send(csvContent);
      } catch (error) {
        console.error('Error exporting posts:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to export posts'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in posts export:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
