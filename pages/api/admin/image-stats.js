import { verifyToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication and admin role
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get image statistics
    const totalImages = await prisma.image.count();
    const orphanedImages = await prisma.image.count({
      where: { isOrphaned: true }
    });
    const attachedImages = totalImages - orphanedImages;

    // Get total storage used
    const images = await prisma.image.findMany({
      select: { size: true }
    });
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);

    // Get recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUploads = await prisma.image.count({
      where: {
        uploadedAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get top uploaders
    const topUploaders = await prisma.image.groupBy({
      by: ['uploadedBy'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get user details for top uploaders
    const uploaderIds = topUploaders.map(u => u.uploadedBy);
    const uploaderDetails = await prisma.user.findMany({
      where: {
        id: {
          in: uploaderIds
        }
      },
      select: {
        id: true,
        username: true
      }
    });

    const topUploadersWithDetails = topUploaders.map(uploader => {
      const userDetail = uploaderDetails.find(u => u.id === uploader.uploadedBy);
      return {
        userId: uploader.uploadedBy,
        username: userDetail?.username || 'Unknown',
        imageCount: uploader._count.id
      };
    });

    res.status(200).json({
      totalImages,
      attachedImages,
      orphanedImages,
      totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      recentUploads,
      topUploaders: topUploadersWithDetails
    });

  } catch (error) {
    console.error('Error getting image stats:', error);
    res.status(500).json({ error: 'Failed to get image statistics' });
  }
}
