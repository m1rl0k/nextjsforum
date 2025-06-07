import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      // Increment view count
      await prisma.thread.update({
        where: { id: parseInt(id) },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      res.status(500).json({ error: 'Failed to increment view count' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
