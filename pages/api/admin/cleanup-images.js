import { verifyToken } from '../../../lib/auth';
import { cleanupOrphanedImages } from '../../../lib/imageUtils';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { hoursOld = 24 } = req.body;

    // Clean up orphaned images
    const cleanedCount = await cleanupOrphanedImages(hoursOld);

    res.status(200).json({
      success: true,
      message: `Cleaned up ${cleanedCount} orphaned images`,
      cleanedCount
    });

  } catch (error) {
    console.error('Error cleaning up images:', error);
    res.status(500).json({ error: 'Failed to cleanup images' });
  }
}
