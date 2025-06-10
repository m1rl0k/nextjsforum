import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

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

    // Check if user is part of this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        OR: [
          { senderId: user.id },
          { recipientId: user.id }
        ]
      }
    });

    if (messages.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Delete all messages in this conversation where user is involved
    await prisma.message.deleteMany({
      where: {
        conversationId: id,
        OR: [
          { senderId: user.id },
          { recipientId: user.id }
        ]
      }
    });

    res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
}
