import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Get token from Authorization header or cookies
      const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
      
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const message = await prisma.message.findUnique({
        where: { id: parseInt(id) },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          recipient: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user is either sender or recipient
      if (message.senderId !== user.id && message.recipientId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.status(200).json({ message });
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
