import prisma from '../../../lib/prisma';

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

      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
