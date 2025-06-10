import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

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

    const { id } = req.query;

    if (req.method === 'PUT') {
      // Update existing category or subject
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

      // Check if it's a category or subject
      const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
      
      if (category) {
        // Update category
        const updatedCategory = await prisma.category.update({
          where: { id: parseInt(id) },
          data: {
            name,
            description,
            order: parseInt(order)
          }
        });

        res.status(200).json({
          status: 'success',
          data: updatedCategory
        });
      } else {
        // Update subject
        const updatedSubject = await prisma.subject.update({
          where: { id: parseInt(id) },
          data: {
            name,
            description,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        });

        res.status(200).json({
          status: 'success',
          data: updatedSubject
        });
      }
    } else if (req.method === 'DELETE') {
      // Delete category or subject
      
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
    console.error('Error in admin forums [id]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
