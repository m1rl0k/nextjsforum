import prisma from '../../lib/prisma';
import { z } from 'zod';
import { validateQuery } from '../../lib/validation';

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search term must be at least 2 characters').max(200),
  type: z.enum(['all', 'threads', 'posts', 'users']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  // Advanced filters
  subjectId: z.coerce.number().int().positive().optional(),
  authorId: z.coerce.number().int().positive().optional(),
  author: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'replies', 'views']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
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

      const { q, type, page, limit, subjectId, authorId, author, dateFrom, dateTo, sortBy, sortOrder } = validation.data;
      const searchTerm = q.trim();
      const skip = (page - 1) * limit;
      const results = {
        threads: [],
        posts: [],
        users: []
      };

      // Build date filters
      const dateFilters = {};
      if (dateFrom) {
        dateFilters.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilters.lte = endDate;
      }

      // Find author by username if provided
      let authorUserId = authorId;
      if (author && !authorId) {
        const authorUser = await prisma.user.findFirst({
          where: { username: { equals: author, mode: 'insensitive' } },
          select: { id: true }
        });
        if (authorUser) {
          authorUserId = authorUser.id;
        }
      }

      // Build thread order by
      const getThreadOrderBy = () => {
        switch (sortBy) {
          case 'date': return { createdAt: sortOrder };
          case 'replies': return { replyCount: sortOrder };
          case 'views': return { viewCount: sortOrder };
          default: return { createdAt: 'desc' };
        }
      };

      // Search threads
      if (type === 'all' || type === 'threads') {
        const threadWhere = {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { content: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            { deleted: false }
          ]
        };

        // Add optional filters
        if (subjectId) {
          threadWhere.AND.push({ subjectId: subjectId });
        }
        if (authorUserId) {
          threadWhere.AND.push({ userId: authorUserId });
        }
        if (Object.keys(dateFilters).length > 0) {
          threadWhere.AND.push({ createdAt: dateFilters });
        }

        const [threads, threadCount] = await Promise.all([
          prisma.thread.findMany({
            where: threadWhere,
            include: {
              user: {
                select: { id: true, username: true, avatar: true }
              },
              subject: {
                select: { id: true, name: true }
              }
            },
            orderBy: getThreadOrderBy(),
            skip: type === 'threads' ? skip : 0,
            take: type === 'threads' ? limit : 10
          }),
          type === 'threads' ? prisma.thread.count({ where: threadWhere }) : 0
        ]);

        results.threads = threads;
        results.threadCount = threadCount;
      }

      // Search posts
      if (type === 'all' || type === 'posts') {
        const postWhere = {
          AND: [
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { deleted: false }
          ]
        };

        if (subjectId) {
          postWhere.AND.push({ thread: { subjectId: subjectId } });
        }
        if (authorUserId) {
          postWhere.AND.push({ userId: authorUserId });
        }
        if (Object.keys(dateFilters).length > 0) {
          postWhere.AND.push({ createdAt: dateFilters });
        }

        const [posts, postCount] = await Promise.all([
          prisma.post.findMany({
            where: postWhere,
            include: {
              user: {
                select: { id: true, username: true, avatar: true }
              },
              thread: {
                select: {
                  id: true,
                  title: true,
                  subjectId: true,
                  subject: {
                    select: { id: true, name: true }
                  }
                }
              }
            },
            orderBy: { createdAt: sortOrder },
            skip: type === 'posts' ? skip : 0,
            take: type === 'posts' ? limit : 10
          }),
          type === 'posts' ? prisma.post.count({ where: postWhere }) : 0
        ]);

        results.posts = posts;
        results.postCount = postCount;
      }

      // Search users
      if (type === 'all' || type === 'users') {
        const userWhere = {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } },
            { location: { contains: searchTerm, mode: 'insensitive' } }
          ],
          isActive: true
        };

        const [users, userCount] = await Promise.all([
          prisma.user.findMany({
            where: userWhere,
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
            orderBy: { username: 'asc' },
            skip: type === 'users' ? skip : 0,
            take: type === 'users' ? limit : 10
          }),
          type === 'users' ? prisma.user.count({ where: userWhere }) : 0
        ]);

        results.users = users;
        results.userCount = userCount;
      }

      // Calculate total results for pagination
      let totalResults = 0;
      if (type === 'threads') {
        totalResults = results.threadCount || results.threads.length;
      } else if (type === 'posts') {
        totalResults = results.postCount || results.posts.length;
      } else if (type === 'users') {
        totalResults = results.userCount || results.users.length;
      } else {
        totalResults = results.threads.length + results.posts.length + results.users.length;
      }

      const totalPages = Math.ceil(totalResults / limit);

      res.status(200).json({
        results,
        totalPages,
        currentPage: page,
        totalResults,
        searchTerm,
        filters: {
          subjectId,
          authorId: authorUserId,
          dateFrom,
          dateTo,
          sortBy,
          sortOrder
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
