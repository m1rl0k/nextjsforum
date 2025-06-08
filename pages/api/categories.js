import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Fetch categories with their subjects and statistics
      const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: {
          subjects: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              _count: {
                select: {
                  threads: {
                    where: { deleted: false }
                  }
                }
              }
            }
          }
        }
      });

      // Calculate post counts and get last post info for each subject
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const subjectsWithStats = await Promise.all(
            category.subjects.map(async (subject) => {
              // Get post count for this subject
              const postCount = await prisma.post.count({
                where: {
                  thread: {
                    subjectId: subject.id,
                    deleted: false
                  },
                  deleted: false
                }
              });

              // Get last post info
              const lastPost = await prisma.post.findFirst({
                where: {
                  thread: {
                    subjectId: subject.id,
                    deleted: false
                  },
                  deleted: false
                },
                orderBy: { createdAt: 'desc' },
                include: {
                  user: {
                    select: { id: true, username: true }
                  },
                  thread: {
                    select: { id: true, title: true }
                  }
                }
              });

              return {
                ...subject,
                threadCount: subject._count.threads,
                postCount,
                lastPost: lastPost?.createdAt || null,
                lastPostUser: lastPost?.user || null,
                lastThread: lastPost?.thread || null
              };
            })
          );

          return {
            ...category,
            subjects: subjectsWithStats
          };
        })
      );

      // Calculate overall forum statistics
      const totalThreads = await prisma.thread.count({ where: { deleted: false } });
      const totalPosts = await prisma.post.count({ where: { deleted: false } });
      const totalMembers = await prisma.user.count({ where: { isActive: true } });

      const newestMember = await prisma.user.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, createdAt: true }
      });

      res.status(200).json({
        categories: categoriesWithStats,
        stats: {
          totalThreads,
          totalPosts,
          totalMembers,
          newestMember
        }
      });

    } catch (error) {
      console.error('Error fetching categories:', error);

      // Fallback to mock data if database fails
      const mockCategories = [
        {
          id: 1,
          name: 'General Discussion',
          description: 'Talk about anything related to our forum',
          order: 1,
          subjects: [
            {
              id: 1,
              name: 'Introductions',
              description: 'Introduce yourself to the community',
              categoryId: 1,
              threadCount: 1,
              postCount: 1,
              lastPost: new Date(),
              lastPostUser: { id: 1, username: 'admin' },
              lastThread: { id: 1, title: 'Welcome to our forum!' }
            }
          ]
        }
      ];

      res.status(200).json({
        categories: mockCategories,
        stats: {
          totalThreads: 1,
          totalPosts: 1,
          totalMembers: 2,
          newestMember: { id: 2, username: 'testuser', createdAt: new Date() }
        }
      });
    }
  } else if (req.method === 'POST') {
    const { name } = req.body;

    try {
      const category = await prisma.category.create({
        data: { name },
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create category' });
    }
  } else {
    res.status(405).end();
  }
}