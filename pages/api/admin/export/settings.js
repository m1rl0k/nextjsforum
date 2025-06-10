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
        // Get all settings
        let settings = [];
        try {
          settings = await prisma.setting.findMany({
            orderBy: { key: 'asc' }
          });
        } catch (error) {
          // Settings table might not exist
          console.log('Settings table not found, using defaults');
        }

        // Get categories and subjects structure
        const categories = await prisma.category.findMany({
          include: {
            subjects: true
          },
          orderBy: { order: 'asc' }
        });

        // Create comprehensive settings export
        const exportData = {
          metadata: {
            exportedAt: new Date().toISOString(),
            exportedBy: user.username,
            version: '1.0',
            forumSoftware: 'NextJS Forum'
          },
          settings: settings.reduce((acc, setting) => {
            try {
              acc[setting.key] = JSON.parse(setting.value);
            } catch (e) {
              acc[setting.key] = setting.value;
            }
            return acc;
          }, {}),
          forumStructure: {
            categories: categories.map(cat => ({
              id: cat.id,
              name: cat.name,
              description: cat.description,
              order: cat.order,
              subjects: cat.subjects.map(sub => ({
                id: sub.id,
                name: sub.name,
                description: sub.description,
                slug: sub.slug
              }))
            }))
          },
          systemInfo: {
            totalUsers: await prisma.user.count(),
            totalThreads: await prisma.thread.count(),
            totalPosts: await prisma.post.count(),
            totalCategories: await prisma.category.count(),
            totalSubjects: await prisma.subject.count()
          }
        };

        // Set headers for JSON download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="forum-settings-${new Date().toISOString().split('T')[0]}.json"`);
        
        res.status(200).json(exportData);
      } catch (error) {
        console.error('Error exporting settings:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to export settings'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in settings export:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
