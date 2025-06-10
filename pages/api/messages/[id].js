import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { serializeBigInt } from '../../../lib/bigintUtils';

export default async function handler(req, res) {
  const { id } = req.query;

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

      // Check if this is a conversation ID or message ID
      if (id.startsWith('conv_')) {
        return res.status(400).json({ error: 'Use /api/messages/conversations?conversationId=' + id + ' for conversation data' });
      }

      const messageId = parseInt(id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId },
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

      // Convert BigInt values to strings for JSON serialization
      const serializedMessage = serializeBigInt(message);
      res.status(200).json({ message: serializedMessage });
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  } else if (req.method === 'DELETE') {
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

      const messageId = parseInt(id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user is either sender or recipient
      if (message.senderId !== user.id && message.recipientId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete the message
      await prisma.message.delete({
        where: { id: messageId }
      });

      res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
