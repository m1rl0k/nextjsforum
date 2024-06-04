import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { token } = req.query;

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          notifications: true,
        },
      });

      if (user) {
        res.status(200).json(user.notifications);
      } else {
        res.status(401).json({ error: 'User not authenticated' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
  } else {
    res.status(405).end();
  }
}