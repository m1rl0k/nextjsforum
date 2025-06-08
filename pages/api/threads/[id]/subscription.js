import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { id } = req.query;
    const threadId = parseInt(id);

    // Verify thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (req.method === 'GET') {
      // Check subscription status
      const subscription = await prisma.threadSubscription.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: threadId
          }
        }
      });

      res.status(200).json({ 
        isSubscribed: !!subscription,
        subscription: subscription || null
      });

    } else if (req.method === 'POST') {
      // Subscribe to thread
      try {
        const subscription = await prisma.threadSubscription.create({
          data: {
            userId: user.id,
            threadId: threadId
          }
        });

        res.status(201).json({ 
          message: 'Successfully subscribed to thread',
          subscription
        });
      } catch (error) {
        if (error.code === 'P2002') {
          // Already subscribed
          res.status(200).json({ message: 'Already subscribed to this thread' });
        } else {
          throw error;
        }
      }

    } else if (req.method === 'DELETE') {
      // Unsubscribe from thread
      const deleted = await prisma.threadSubscription.deleteMany({
        where: {
          userId: user.id,
          threadId: threadId
        }
      });

      if (deleted.count > 0) {
        res.status(200).json({ message: 'Successfully unsubscribed from thread' });
      } else {
        res.status(404).json({ message: 'Subscription not found' });
      }

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling thread subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
