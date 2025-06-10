import { verifyToken } from '../../../lib/auth';
import { batchUpdateThreadSlugs } from '../../../lib/slugUtils';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    // Get the number of threads without slugs
    const threadsWithoutSlugs = await prisma.thread.count({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    });

    if (threadsWithoutSlugs === 0) {
      return res.status(200).json({
        message: 'All threads already have slugs',
        updated: 0,
        remaining: 0
      });
    }

    // Update slugs in batches
    const { limit = 100 } = req.body;
    const updatedCount = await batchUpdateThreadSlugs(limit);

    // Get remaining count
    const remainingCount = await prisma.thread.count({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    });

    res.status(200).json({
      message: `Updated ${updatedCount} thread slugs`,
      updated: updatedCount,
      remaining: remainingCount,
      total: threadsWithoutSlugs
    });

  } catch (error) {
    console.error('Error migrating slugs:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}
