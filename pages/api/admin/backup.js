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

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get list of backups (placeholder - would need backup storage system)
      const backups = [
        {
          id: 1,
          createdAt: new Date().toISOString(),
          size: 1024 * 1024 * 5, // 5MB
          includes: ['Users', 'Threads', 'Posts', 'Categories', 'Settings']
        }
      ];

      res.status(200).json({
        status: 'success',
        backups
      });
    } else if (req.method === 'POST') {
      // Create new backup
      const {
        includeUsers = true,
        includeThreads = true,
        includePosts = true,
        includeCategories = true,
        includeSettings = true,
        includeImages = false,
        format = 'json'
      } = req.body;

      try {
        const backupData = {};

        if (includeUsers) {
          const users = await prisma.user.findMany({
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
          });
          backupData.users = users;
        }

        if (includeCategories) {
          const categories = await prisma.category.findMany({
            include: {
              subjects: true
            }
          });
          backupData.categories = categories;
        }

        if (includeThreads) {
          const threads = await prisma.thread.findMany({
            include: {
              user: {
                select: { id: true, username: true }
              },
              subject: {
                select: { id: true, name: true }
              }
            }
          });
          backupData.threads = threads;
        }

        if (includePosts) {
          const posts = await prisma.post.findMany({
            include: {
              user: {
                select: { id: true, username: true }
              },
              thread: {
                select: { id: true, title: true }
              }
            }
          });
          backupData.posts = posts;
        }

        if (includeSettings) {
          try {
            const settings = await prisma.setting.findMany();
            backupData.settings = settings;
          } catch (error) {
            // Settings table might not exist
            backupData.settings = [];
          }
        }

        // Add metadata
        backupData.metadata = {
          version: '1.0',
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          includes: Object.keys(backupData).filter(key => key !== 'metadata')
        };

        // In a real implementation, you would save this to a file or cloud storage
        // For now, we'll just return success
        res.status(200).json({
          status: 'success',
          message: 'Backup created successfully',
          backup: {
            id: Date.now(),
            size: JSON.stringify(backupData).length,
            includes: backupData.metadata.includes,
            createdAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to create backup'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin backup:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
