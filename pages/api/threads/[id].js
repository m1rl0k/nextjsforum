import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const thread = await prisma.thread.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        subject: true,
        posts: {
          include: {
            user: true,
            replyTo: true,
          },
        },
      },
    });

    if (thread) {
      res.status(200).json(thread);
    } else {
      res.status(404).json({ error: 'Thread not found' });
    }
  } else if (req.method === 'POST') {
    const { token, content, replyToId } = req.body;

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user) {
        const post = await prisma.post.create({
          data: {
            content,
            threadId: parseInt(id),
            userId: user.id,
            replyToId: replyToId ? parseInt(replyToId) : null,
          },
        });
        res.status(201).json(post);
      } else {
        res.status(401).json({ error: 'User not authenticated' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Posting reply failed' });
    }
  } else if (req.method === 'PUT') {
    const { token, action } = req.body;

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user && user.role === 'MODERATOR') {
        if (action === 'lock') {
          await prisma.thread.update({
            where: { id: parseInt(id) },
            data: { locked: true },
          });
        } else if (action === 'unlock') {
          await prisma.thread.update({
            where: { id: parseInt(id) },
            data: { locked: false },
          });
        }

        res.status(200).json({ message: 'Thread updated successfully' });
      } else {
        res.status(403).json({ error: 'User not authorized' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update thread' });
    }
  } else {
    res.status(405).end();
  }
}
