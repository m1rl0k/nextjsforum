import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          threads: true,
          posts: true,
        },
      });

      if (user) {
        const postCount = user.posts.length;
        res.status(200).json({ ...user, postCount });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
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
