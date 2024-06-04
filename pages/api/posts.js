import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { token, content, threadId, replyToId } = req.body;

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user) {
        const post = await prisma.post.create({
          data: {
            content,
            threadId: parseInt(threadId),
            userId: user.id,
            replyToId: replyToId ? parseInt(replyToId) : null,
          },
        });
        res.status(201).json(post);
      } else {
        res.status(401).json({ error: 'User not authenticated' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Creating post failed' });
    }
  } else {
    res.status(405).end();
  }
}
