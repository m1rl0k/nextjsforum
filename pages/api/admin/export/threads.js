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
        // Get all threads with related data
        const threads = await prisma.thread.findMany({
          include: {
            user: {
              select: { id: true, username: true }
            },
            subject: {
              select: { id: true, name: true, category: { select: { name: true } } }
            },
            posts: {
              select: { id: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Convert to CSV format
        const csvHeaders = [
          'ID',
          'Title',
          'Content Preview',
          'Author',
          'Category',
          'Forum',
          'Reply Count',
          'View Count',
          'Sticky',
          'Locked',
          'Deleted',
          'Created At',
          'Updated At'
        ];

        const csvRows = threads.map(thread => [
          thread.id,
          `"${(thread.title || '').replace(/"/g, '""')}"`,
          `"${(thread.content || '').substring(0, 100).replace(/"/g, '""')}"`,
          `"${thread.user?.username || 'Unknown'}"`,
          `"${thread.subject?.category?.name || ''}"`,
          `"${thread.subject?.name || ''}"`,
          thread.posts?.length || 0,
          thread.viewCount || 0,
          thread.sticky ? 'Yes' : 'No',
          thread.locked ? 'Yes' : 'No',
          thread.deleted ? 'Yes' : 'No',
          thread.createdAt ? new Date(thread.createdAt).toISOString() : '',
          thread.updatedAt ? new Date(thread.updatedAt).toISOString() : ''
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="threads-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        console.log('Sending CSV with', threads.length, 'threads');
        res.status(200).send(csvContent);
      } catch (error) {
        console.error('Error exporting threads:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to export threads'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in threads export:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
