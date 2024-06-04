import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const threads = await prisma.thread.findMany({
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: true,
        subject: true,
        posts: true,
      },
    });

    const totalThreads = await prisma.thread.count();

    res.status(200).json({
      threads,
      totalPages: Math.ceil(totalThreads / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } else if (req.method === 'POST') {
    const { token, title, content, subjectId } = req.body;

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user) {
        const thread = await prisma.thread.create({
          data: {
            title,
            content,
            subjectId: parseInt(subjectId),
            userId: user.id,
          },
        });
        res.status(201).json(thread);
      } else {
        res.status(401).json({ error: 'User not authenticated' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Creating thread failed' });
    }
  } else {
    res.status(405).end();
  }
}