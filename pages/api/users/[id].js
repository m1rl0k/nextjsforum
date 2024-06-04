import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        threads: true,
        posts: true,
      },
    });

    if (user) {
      const postCount = user.posts.length;
      res.status(200).json({ ...user, postCount });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else if (req.method === 'PUT') {
    const { bio, avatar, location } = req.body;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { bio, avatar, location },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  } else {
    res.status(405).end();
  }
}
