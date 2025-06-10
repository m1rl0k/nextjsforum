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
        console.log('Starting users export...');

        // Get all users
        const users = await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            bio: true,
            location: true,
            postCount: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true
          },
          orderBy: { createdAt: 'desc' }
        });

        // Convert to CSV format
        const csvHeaders = [
          'ID',
          'Username',
          'Email',
          'Role',
          'Bio',
          'Location',
          'Post Count',
          'Active',
          'Created At',
          'Updated At',
          'Last Login'
        ];

        const csvRows = users.map(user => [
          user.id,
          `"${user.username || ''}"`,
          `"${user.email || ''}"`,
          user.role,
          `"${(user.bio || '').replace(/"/g, '""')}"`,
          `"${user.location || ''}"`,
          user.postCount || 0,
          user.isActive ? 'Yes' : 'No',
          user.createdAt ? new Date(user.createdAt).toISOString() : '',
          user.updatedAt ? new Date(user.updatedAt).toISOString() : '',
          user.lastLogin ? new Date(user.lastLogin).toISOString() : ''
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        console.log('Sending CSV with', users.length, 'users');
        res.status(200).send(csvContent);
      } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to export users'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in users export:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
