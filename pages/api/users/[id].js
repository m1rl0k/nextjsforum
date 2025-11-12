import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          username: true,
          email: true,
          bio: true,
          avatar: true,
          location: true,
          signature: true,
          website: true,
          displayName: true,
          role: true,
          isActive: true,
          postCount: true,
          threadCount: true,
          reputationPoints: true,
          joinDate: true,
          lastActivity: true,
          createdAt: true,
          updatedAt: true,
          threads: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              viewCount: true,
              postCount: true
            },
            where: { deleted: false },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          posts: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              threadId: true
            },
            where: { deleted: false },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else if (req.method === 'PUT') {
    try {
      // Get token from Authorization header or cookies
      const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!currentUser) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user is updating their own profile or is admin
      if (currentUser.id !== parseInt(id) && currentUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { bio, avatar, location, signature } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          bio: bio || null,
          avatar: avatar || null,
          location: location || null,
          signature: signature || null
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
