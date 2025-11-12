import prisma from '../../lib/prisma';
import { z } from 'zod';
import { validateQuery } from '../../lib/validation';

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search term must be at least 2 characters').max(200),
  type: z.enum(['all', 'threads', 'posts', 'users']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Validate query parameters
      const validation = validateQuery(searchQuerySchema, req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const { q, type, page, limit } = validation.data;
      const searchTerm = q.trim();
      const skip = (page - 1) * limit;
      const results = {
        threads: [],
        posts: [],
        users: []
      };

      // Search threads
      if (type === 'all' || type === 'threads') {
        results.threads = await prisma.thread.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { content: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: type === 'threads' ? limit : 10
        });
      }

      // Search posts
      if (type === 'all' || type === 'posts') {
        results.posts = await prisma.post.findMany({
          where: {
            content: { contains: searchTerm, mode: 'insensitive' }
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            thread: {
              select: {
                id: true,
                title: true,
                subjectId: true,
                subject: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: type === 'posts' ? limit : 10
        });
      }

      // Search users
      if (type === 'all' || type === 'users') {
        results.users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: searchTerm, mode: 'insensitive' } },
              { bio: { contains: searchTerm, mode: 'insensitive' } },
              { location: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            location: true,
            role: true,
            postCount: true,
            createdAt: true
          },
          orderBy: {
            username: 'asc'
          },
          take: type === 'users' ? limit : 10
        });
      }

      // Calculate total results for pagination (simplified)
      let totalResults = 0;
      if (type === 'threads') {
        totalResults = results.threads.length;
      } else if (type === 'posts') {
        totalResults = results.posts.length;
      } else if (type === 'users') {
        totalResults = results.users.length;
      } else {
        totalResults = results.threads.length + results.posts.length + results.users.length;
      }

      const totalPages = Math.ceil(totalResults / parseInt(limit));

      res.status(200).json({
        results,
        totalPages,
        currentPage: parseInt(page),
        totalResults,
        searchTerm
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
