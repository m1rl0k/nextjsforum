import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get token from cookies
      const token = req.cookies.token;

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

      const { type = 'inbox' } = req.query;

      let messages;
      if (type === 'sent') {
        messages = await prisma.message.findMany({
          where: { senderId: user.id },
          include: {
            recipient: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        messages = await prisma.message.findMany({
          where: { recipientId: user.id },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      res.status(200).json({ messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else if (req.method === 'POST') {
    try {
      // Get token from cookies
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const sender = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!sender) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { recipient, content } = req.body;

      // Find recipient by username
      const recipientUser = await prisma.user.findUnique({
        where: { username: recipient }
      });

      if (!recipientUser) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      if (recipientUser.id === sender.id) {
        return res.status(400).json({ error: 'Cannot send message to yourself' });
      }

      const message = await prisma.message.create({
        data: {
          content,
          senderId: sender.id,
          recipientId: recipientUser.id,
        },
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

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}