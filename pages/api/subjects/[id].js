import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: true,
          threads: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                }
              },
              posts: {
                select: {
                  id: true,
                }
              }
            },
            orderBy: [
              { sticky: 'desc' },
              { lastPostAt: 'desc' }
            ]
          }
        }
      });

      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      res.status(200).json(subject);
    } catch (error) {
      console.error('Error fetching subject:', error);
      res.status(500).json({ error: 'Failed to fetch subject' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
