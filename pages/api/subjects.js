import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const subjects = await prisma.subject.findMany({
      include: {
        category: true,
        threads: true,
      },
    });
    res.status(200).json(subjects);
  } else if (req.method === 'POST') {
    const { name, categoryId } = req.body;

    try {
      const subject = await prisma.subject.create({
        data: {
          name,
          categoryId: parseInt(categoryId),
        },
      });
      res.status(201).json(subject);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create subject' });
    }
  } else {
    res.status(405).end();
  }
}