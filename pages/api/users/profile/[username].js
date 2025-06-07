import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { username } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: false, // Don't expose email
          bio: true,
          avatar: true,
          location: true,
          signature: true,
          postCount: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          threads: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              subjectId: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          },
          posts: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              threadId: true,
              thread: {
                select: {
                  id: true,
                  title: true,
                  subjectId: true,
                  subject: {
                    select: {
                      id: true,
                      name: true,
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate actual post count if not stored
      if (!user.postCount) {
        const postCount = await prisma.post.count({
          where: { userId: user.id }
        });
        user.postCount = postCount;
      }

      res.status(200).json({
        user,
        recentThreads: user.threads,
        recentPosts: user.posts
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
