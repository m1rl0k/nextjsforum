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

      // Get post counts and last post info for each subject
      const subjectsWithStats = await Promise.all(
        subjects.map(async (subject) => {
          // Get post count for this subject
          const postCount = await prisma.post.count({
            where: {
              thread: {
                subjectId: subject.id
              }
            }
          });

          // Get last thread info
          const lastThread = await prisma.thread.findFirst({
            where: { subjectId: subject.id },
            orderBy: { lastPostAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          });

          return {
            ...subject,
            postCount,
            threadCount: subject._count.threads,
            lastPost: lastThread?.lastPostAt || null,
            lastPostUser: lastThread?.user || null,
            lastThreadId: lastThread?.id || null
          };
        })
      );

      res.status(200).json(subjectsWithStats);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ error: 'Failed to fetch subjects' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
