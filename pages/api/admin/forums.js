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
      const {
        name,
        description,
        categoryId,
        isCategory = false,
        order = 0,
        isLocked = false,
        isPrivate = false,
        allowThreads = true,
        slug
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (isCategory) {
        // Create category
        const category = await prisma.category.create({
          data: {
            name,
            description,
            order: parseInt(order),
            isLocked,
            isPrivate
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
            categoryId: parseInt(categoryId),
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            isLocked,
            isPrivate,
            allowThreads
          }
        });

        res.status(201).json({
          status: 'success',
          data: subject
        });
      }
    } else if (req.method === 'PUT') {
      // Update existing category or subject
      const { id } = req.query;
      const {
        name,
        description,
        categoryId,
        isCategory = false,
        order = 0,
        isLocked = false,
        isPrivate = false,
        allowThreads = true,
        slug
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (isCategory) {
        // Update category
        const category = await prisma.category.update({
          where: { id: parseInt(id) },
          data: {
            name,
            description,
            order: parseInt(order),
            isLocked,
            isPrivate
          }
        });

        res.status(200).json({
          status: 'success',
          data: category
        });
      } else {
        // Update subject
        const subject = await prisma.subject.update({
          where: { id: parseInt(id) },
          data: {
            name,
            description,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            isLocked,
            isPrivate,
            allowThreads
          }
        });

        res.status(200).json({
          status: 'success',
          data: subject
        });
      }
    } else if (req.method === 'DELETE') {
      // Delete category or subject
      const { id } = req.query;

      // First check if it's a category or subject
      const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });

      if (category) {
        // Check if category has subjects
        const subjectCount = await prisma.subject.count({
          where: { categoryId: parseInt(id) }
        });

        if (subjectCount > 0) {
          return res.status(400).json({
            message: 'Cannot delete category with existing forums. Please delete or move the forums first.'
          });
        }

        await prisma.category.delete({
          where: { id: parseInt(id) }
        });
      } else {
        // Check if subject has threads
        const threadCount = await prisma.thread.count({
          where: { subjectId: parseInt(id) }
        });

        if (threadCount > 0) {
          return res.status(400).json({
            message: 'Cannot delete forum with existing threads. Please delete or move the threads first.'
          });
        }

        await prisma.subject.delete({
          where: { id: parseInt(id) }
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Forum deleted successfully'
      });
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
