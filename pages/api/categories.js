import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const categories = await prisma.category.findMany({
      include: {
        subjects: true,
      },
    });
    res.status(200).json(categories);
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