import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Search term must be at least 2 characters' });
      }

      const searchTerm = q.trim();

      const users = await prisma.user.findMany({
        where: {
          username: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          username: true,
          avatar: true
        },
        orderBy: {
          username: 'asc'
        },
        take: parseInt(limit)
      });

      res.status(200).json({ users });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
