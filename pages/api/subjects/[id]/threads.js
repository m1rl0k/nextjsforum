import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const { page = 1, limit = 20, sortBy = 'lastPostAt', sortOrder = 'desc' } = req.query;

  if (req.method === 'GET') {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build orderBy object
      const orderBy = [];
      
      // Always put sticky threads first
      orderBy.push({ sticky: 'desc' });
      
      // Then sort by the requested field
      if (sortBy === 'lastPostAt') {
        orderBy.push({ lastPostAt: sortOrder });
      } else if (sortBy === 'createdAt') {
        orderBy.push({ createdAt: sortOrder });
      } else if (sortBy === 'title') {
        orderBy.push({ title: sortOrder });
      } else if (sortBy === 'viewCount') {
        orderBy.push({ viewCount: sortOrder });
      }

      const threads = await prisma.thread.findMany({
        where: {
          subjectId: parseInt(id)
        },
        skip,
        take: parseInt(limit),
        orderBy,
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
          },
          subject: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      const totalThreads = await prisma.thread.count({
        where: {
          subjectId: parseInt(id)
        }
      });

      const totalPages = Math.ceil(totalThreads / parseInt(limit));

      res.status(200).json({
        threads,
        totalPages,
        currentPage: parseInt(page),
        totalThreads
      });
    } catch (error) {
      console.error('Error fetching threads:', error);
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
