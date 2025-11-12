import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      const categoryId = parseInt(id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Get subjects in this category with stats
      const subjects = await prisma.subject.findMany({
        where: { 
          categoryId: categoryId,
          isActive: true
        },
        include: {
          category: true,
          _count: {
            select: {
              threads: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      });

      // Get all thread IDs for these subjects
      const subjectIds = subjects.map(s => s.id);

      // Get post counts for all subjects in one query
      const postCounts = await prisma.post.groupBy({
        by: ['threadId'],
        where: {
          thread: {
            subjectId: { in: subjectIds },
            deleted: false
          },
          deleted: false
        },
        _count: {
          id: true
        }
      });

      // Create a map of thread counts per subject
      const threadsBySubject = await prisma.thread.groupBy({
        by: ['subjectId'],
        where: {
          subjectId: { in: subjectIds },
          deleted: false
        },
        _count: {
          id: true
        }
      });

      const threadCountMap = new Map(
        threadsBySubject.map(item => [item.subjectId, item._count.id])
      );

      // Get last threads for all subjects in one query
      const lastThreads = await prisma.thread.findMany({
        where: {
          subjectId: { in: subjectIds },
          deleted: false
        },
        orderBy: { lastPostAt: 'desc' },
        distinct: ['subjectId'],
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      const lastThreadMap = new Map(
        lastThreads.map(thread => [thread.subjectId, thread])
      );

      // Combine the data
      const subjectsWithStats = subjects.map(subject => {
        const lastThread = lastThreadMap.get(subject.id);
        const threadCount = threadCountMap.get(subject.id) || 0;

        return {
          ...subject,
          postCount: subject.postCount || 0,
          threadCount,
          lastPost: lastThread?.lastPostAt || null,
          lastPostUser: lastThread?.user || null,
          lastThreadId: lastThread?.id || null
        };
      });

      res.status(200).json(subjectsWithStats);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ error: 'Failed to fetch subjects' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
