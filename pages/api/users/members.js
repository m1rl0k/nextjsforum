import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        sortBy = 'username', 
        sortOrder = 'asc' 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build where clause for search
      const where = {};
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Build orderBy object
      const orderBy = {};
      if (sortBy === 'username') {
        orderBy.username = sortOrder;
      } else if (sortBy === 'createdAt') {
        orderBy.createdAt = sortOrder;
      } else if (sortBy === 'postCount') {
        orderBy.postCount = sortOrder;
      } else {
        orderBy.username = 'asc'; // default
      }

      const members = await prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        select: {
          id: true,
          username: true,
          avatar: true,
          location: true,
          role: true,
          postCount: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              threads: true
            }
          }
        }
      });

      // Update postCount if it's not set
      const membersWithPostCount = members.map(member => ({
        ...member,
        postCount: member.postCount || member._count.posts
      }));

      const totalMembers = await prisma.user.count({ where });
      const totalPages = Math.ceil(totalMembers / parseInt(limit));

      res.status(200).json({
        members: membersWithPostCount,
        totalPages,
        currentPage: parseInt(page),
        totalMembers
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
