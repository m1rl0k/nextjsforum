import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

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

    const { id } = req.query;

    if (req.method === 'GET') {
      try {
        // In a real implementation, you would retrieve the backup file from storage
        // For now, we'll create a comprehensive backup on-demand
        
        const backupData = {};

        // Get all data
        const [users, categories, threads, posts, settings] = await Promise.all([
          prisma.user.findMany({
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              bio: true,
              location: true,
              signature: true,
              avatar: true,
              postCount: true,
              isActive: true,
              createdAt: true,
              updatedAt: true
            }
          }),
          prisma.category.findMany({
            include: {
              subjects: true
            }
          }),
          prisma.thread.findMany({
            include: {
              user: {
                select: { id: true, username: true }
              },
              subject: {
                select: { id: true, name: true }
              }
            }
          }),
          prisma.post.findMany({
            include: {
              user: {
                select: { id: true, username: true }
              },
              thread: {
                select: { id: true, title: true }
              }
            }
          }),
          prisma.setting.findMany().catch(() => []) // Handle case where settings table doesn't exist
        ]);

        backupData.metadata = {
          version: '1.0',
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          backupId: id,
          totalUsers: users.length,
          totalCategories: categories.length,
          totalThreads: threads.length,
          totalPosts: posts.length
        };

        backupData.users = users;
        backupData.categories = categories;
        backupData.threads = threads;
        backupData.posts = posts;
        backupData.settings = settings;

        // Convert to JSON string
        const jsonContent = JSON.stringify(backupData, null, 2);

        // Set headers for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="forum-backup-${id}-${new Date().toISOString().split('T')[0]}.json"`);
        res.setHeader('Content-Length', Buffer.byteLength(jsonContent));
        
        res.status(200).send(jsonContent);
      } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to download backup'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in backup download:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
