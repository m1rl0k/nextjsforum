import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const subjects = await prisma.subject.findMany({
      include: {
        category: true,
        threads: true,
      },
    });
    res.status(200).json(subjects);
  } else if (req.method === 'POST') {
    // Authentication required for creating subjects
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Only ADMIN can create subjects
      if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { name, categoryId } = req.body;

      if (!name || !categoryId) {
        return res.status(400).json({ error: 'Name and categoryId are required' });
      }

      const subject = await prisma.subject.create({
        data: {
          name,
          categoryId: Number.parseInt(categoryId, 10),
        },
      });
      res.status(201).json(subject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({ error: 'Failed to create subject' });
    }
  } else {
    res.status(405).end();
  }
}