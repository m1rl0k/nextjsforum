import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get all categories with their subjects
      const categories = await prisma.category.findMany({
        include: {
          subjects: {
            orderBy: { id: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      });

      res.status(200).json({
        status: 'success',
        data: categories
      });
    } else if (req.method === 'POST') {
      // Create new category or subject
      const { name, description, categoryId, isCategory = false, order = 0 } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (isCategory) {
        // Create category
        const category = await prisma.category.create({
          data: {
            name,
            description,
            order: parseInt(order)
          }
        });

        res.status(201).json({
          status: 'success',
          data: category
        });
      } else {
        // Create subject
        if (!categoryId) {
          return res.status(400).json({ message: 'Category ID is required for subjects' });
        }

        const subject = await prisma.subject.create({
          data: {
            name,
            description,
            categoryId: parseInt(categoryId)
          }
        });

        res.status(201).json({
          status: 'success',
          data: subject
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin forums:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
