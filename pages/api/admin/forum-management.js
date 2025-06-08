import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import settingsService from '../../../lib/settingsService';

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

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { action } = req.query;

    switch (action) {
      case 'stats':
        return await handleGetStats(req, res);
      case 'users':
        return await handleUserManagement(req, res);
      case 'content':
        return await handleContentManagement(req, res);
      case 'groups':
        return await handleUserGroups(req, res);
      case 'reports':
        return await handleReports(req, res);
      case 'export':
        return await handleExportConfig(req, res);
      case 'import':
        return await handleImportConfig(req, res);
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Forum management error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGetStats(req, res) {
  try {
    const [forumStats, contentStats] = await Promise.all([
      settingsService.getForumStats(),
      settingsService.getContentStats()
    ]);

    // Recent activity
    const recentThreads = await prisma.thread.findMany({
      take: 5,
      where: { deleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        subject: { select: { name: true } }
      }
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, email: true, createdAt: true }
    });

    res.status(200).json({
      forumStats,
      contentStats,
      recentActivity: {
        threads: recentThreads,
        users: recentUsers
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Error retrieving statistics' });
  }
}

async function handleUserManagement(req, res) {
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20, search = '', role = '' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        AND: [
          search ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          } : {},
          role ? { role: role } : {}
        ]
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true,
            isBanned: true,
            postCount: true,
            threadCount: true,
            createdAt: true,
            lastLogin: true
          }
        }),
        prisma.user.count({ where })
      ]);

      res.status(200).json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error retrieving users' });
    }
  } else if (req.method === 'POST') {
    try {
      const { userId, action, reason, duration } = req.body;

      switch (action) {
        case 'ban':
          await prisma.user.update({
            where: { id: userId },
            data: {
              isBanned: true,
              banReason: reason,
              banExpiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
            }
          });
          break;

        case 'unban':
          await prisma.user.update({
            where: { id: userId },
            data: {
              isBanned: false,
              banReason: null,
              banExpiresAt: null
            }
          });
          break;

        case 'deactivate':
          await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
          });
          break;

        case 'activate':
          await prisma.user.update({
            where: { id: userId },
            data: { isActive: true }
          });
          break;

        case 'promote':
          await prisma.user.update({
            where: { id: userId },
            data: { role: req.body.newRole }
          });
          break;

        default:
          return res.status(400).json({ message: 'Invalid action' });
      }

      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  }
}

async function handleContentManagement(req, res) {
  if (req.method === 'GET') {
    try {
      const { type = 'threads', page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      if (type === 'threads') {
        const [threads, total] = await Promise.all([
          prisma.thread.findMany({
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true } },
              subject: { select: { name: true } },
              _count: { select: { posts: true } }
            }
          }),
          prisma.thread.count()
        ]);

        res.status(200).json({ threads, total });
      } else if (type === 'posts') {
        const [posts, total] = await Promise.all([
          prisma.post.findMany({
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true } },
              thread: { select: { title: true } }
            }
          }),
          prisma.post.count()
        ]);

        res.status(200).json({ posts, total });
      }
    } catch (error) {
      console.error('Error getting content:', error);
      res.status(500).json({ message: 'Error retrieving content' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { type, id } = req.body;

      if (type === 'thread') {
        await prisma.thread.update({
          where: { id: parseInt(id) },
          data: { deleted: true, deletedAt: new Date() }
        });
      } else if (type === 'post') {
        await prisma.post.update({
          where: { id: parseInt(id) },
          data: { deleted: true, deletedAt: new Date() }
        });
      }

      res.status(200).json({ message: 'Content deleted successfully' });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ message: 'Error deleting content' });
    }
  }
}

async function handleUserGroups(req, res) {
  if (req.method === 'GET') {
    try {
      const groups = await settingsService.getUserGroups();
      res.status(200).json({ groups });
    } catch (error) {
      console.error('Error getting user groups:', error);
      res.status(500).json({ message: 'Error retrieving user groups' });
    }
  } else if (req.method === 'POST') {
    try {
      const group = await settingsService.createUserGroup(req.body);
      res.status(201).json({ group, message: 'User group created successfully' });
    } catch (error) {
      console.error('Error creating user group:', error);
      res.status(500).json({ message: 'Error creating user group' });
    }
  }
}

async function handleReports(req, res) {
  if (req.method === 'GET') {
    try {
      const { status = 'PENDING' } = req.query;
      
      const reports = await prisma.report.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { username: true } },
          thread: { select: { title: true } },
          post: { select: { content: true } },
          user: { select: { username: true } }
        }
      });

      res.status(200).json({ reports });
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({ message: 'Error retrieving reports' });
    }
  } else if (req.method === 'POST') {
    try {
      const { reportId, action, resolution } = req.body;

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED',
          resolvedAt: new Date(),
          resolution
        }
      });

      res.status(200).json({ message: 'Report updated successfully' });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ message: 'Error updating report' });
    }
  }
}

async function handleExportConfig(req, res) {
  try {
    const config = await settingsService.exportConfiguration();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="forum-config.json"');
    res.status(200).json(config);
  } catch (error) {
    console.error('Error exporting config:', error);
    res.status(500).json({ message: 'Error exporting configuration' });
  }
}

async function handleImportConfig(req, res) {
  try {
    const result = await settingsService.importConfiguration(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error importing config:', error);
    res.status(500).json({ message: 'Error importing configuration' });
  }
}
