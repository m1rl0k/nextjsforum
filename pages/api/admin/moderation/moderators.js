import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify moderator authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return res.status(403).json({ message: 'Moderator access required' });
    }

    const moderators = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'MODERATOR']
        }
      },
      select: {
        id: true,
        username: true,
        role: true
      },
      orderBy: { username: 'asc' }
    });

    res.status(200).json({
      moderators
    });

  } catch (error) {
    console.error('Error fetching moderators:', error);
    res.status(500).json({ message: 'Failed to fetch moderators' });
  }
}
