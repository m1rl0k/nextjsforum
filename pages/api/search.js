import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { q, type = 'all', page = 1, limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Search term must be at least 2 characters' });
      }

      const searchTerm = q.trim();
      const skip = (parseInt(page) - 1) * parseInt(limit);
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
          take: type === 'threads' ? parseInt(limit) : 10
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
          take: type === 'posts' ? parseInt(limit) : 10
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
          take: type === 'users' ? parseInt(limit) : 10
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
