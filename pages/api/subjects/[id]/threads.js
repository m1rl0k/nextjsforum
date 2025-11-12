import prisma from '../../../../lib/prisma';
import { paginationSchema, validateQuery } from '../../../../lib/validation';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Validate subject ID
      const subjectId = Number.parseInt(id, 10);
      if (Number.isNaN(subjectId) || subjectId <= 0) {
        return res.status(400).json({ error: 'Invalid subject ID' });
      }

      // Validate pagination parameters
      const validation = validateQuery(paginationSchema, req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.errors
        });
      }

      const { page, limit, sortBy = 'lastPostAt', sortOrder = 'desc' } = validation.data;
      const skip = (page - 1) * limit;
      
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
          subjectId,
          deleted: false
        },
        skip,
        take: limit,
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
          subjectId,
          deleted: false
        }
      });

      const totalPages = Math.ceil(totalThreads / limit);

      res.status(200).json({
        threads,
        totalPages,
        currentPage: page,
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
