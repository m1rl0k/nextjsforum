import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { saveBackupFile } from '../../../lib/backupStorage';

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
      // Get list of backups with pagination
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      try {
        const [backups, total] = await Promise.all([
          prisma.backup.findMany({
            include: {
              creator: {
                select: { id: true, username: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          }),
          prisma.backup.count()
        ]);

        // Convert BigInt to number for JSON serialization
        const backupsResponse = backups.map(backup => ({
          ...backup,
          size: Number(backup.size)
        }));

        res.status(200).json({
          status: 'success',
          backups: backupsResponse,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      } catch (error) {
        console.error('Error fetching backups:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to fetch backups'
        });
      }
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

        // Save backup file to storage
        const filename = `forum-backup-${Date.now()}.json`;
        const { filePath, size } = await saveBackupFile(filename, backupData);

        // Create backup record in database
        const backup = await prisma.backup.create({
          data: {
            filename,
            originalName: `Forum Backup ${new Date().toLocaleDateString()}`,
            size: BigInt(size),
            includes: backupData.metadata.includes,
            status: 'completed',
            createdBy: user.id,
            filePath,
            description: `Backup created on ${new Date().toLocaleString()}`
          },
          include: {
            creator: {
              select: { id: true, username: true }
            }
          }
        });

        // Convert BigInt to number for JSON serialization
        const backupResponse = {
          ...backup,
          size: Number(backup.size)
        };

        res.status(200).json({
          status: 'success',
          message: 'Backup created successfully',
          backup: backupResponse
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
