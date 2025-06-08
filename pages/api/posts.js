import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { content, threadId, replyToId } = req.body;

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

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const post = await prisma.post.create({
        data: {
          content,
          threadId: parseInt(threadId),
          userId: user.id,
          replyToId: replyToId ? parseInt(replyToId) : null,
        },
      });
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Creating post failed' });
    }
  } else {
    res.status(405).end();
  }
}
