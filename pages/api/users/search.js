import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { validateQuery } from '../../../lib/validation';

const userSearchSchema = z.object({
  q: z.string().min(2, 'Search term must be at least 2 characters').max(100),
  limit: z.coerce.number().int().positive().max(50).default(10)
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Validate query parameters
      const validation = validateQuery(userSearchSchema, req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const { q, limit } = validation.data;
      const searchTerm = q.trim();

      const users = await prisma.user.findMany({
        where: {
          username: {
            contains: searchTerm,
            mode: 'insensitive'
          },
          isActive: true // Only return active users
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          displayName: true
        },
        orderBy: {
          username: 'asc'
        },
        take: limit
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
