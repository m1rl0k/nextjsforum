import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { token, recipientId, content } = req.body;

    try {
      const decoded = verifyToken(token);
      const sender = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (sender) {
        const message = await prisma.message.create({
          data: {
            content,
            senderId: sender.id,
            recipientId: parseInt(recipientId),
          },
        });

        res.status(201).json(message);
      } else {
        res.status(401).json({ error: 'User not authenticated' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  } else {
    res.status(405).end();
  }
}