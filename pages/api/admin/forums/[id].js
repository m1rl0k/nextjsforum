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
        canPost = true,
        canReply = true,
        requiresApproval = false,
        guestPosting = false,
        isActive = true,
        slug,
        icon
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      // Check if it's a category or subject
      const category = await prisma.category.findUnique({ where: { id: Number.parseInt(id, 10) } });

      if (category) {
        // Update category
        const updatedCategory = await prisma.category.update({
          where: { id: Number.parseInt(id, 10) },
          data: {
            name,
            description: description || null,
            order: Number.parseInt(order, 10) || 0
          }
        });

        res.status(200).json({
          status: 'success',
          data: updatedCategory
        });
      } else {
        // Update subject
        const updatedSubject = await prisma.subject.update({
          where: { id: Number.parseInt(id, 10) },
          data: {
            name,
            description: description || null,
            categoryId: categoryId ? Number.parseInt(categoryId, 10) : undefined,
            slug: slug || name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
            order: Number.parseInt(order, 10) || 0,
            canPost,
            canReply,
            requiresApproval,
            guestPosting,
            isActive,
            icon: icon || null
          }
        });

        res.status(200).json({
          status: 'success',
          data: updatedSubject
        });
      }
    } else if (req.method === 'DELETE') {
      // Delete category or subject
      const numericId = Number.parseInt(id, 10);
      const { type, cascade } = req.query;

      if (Number.isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      // Check what type we're deleting based on the type parameter
      if (type === 'category') {
        // Deleting a category
        const category = await prisma.category.findUnique({
          where: { id: numericId },
          include: {
            subjects: true
          }
        });

        if (!category) {
          return res.status(404).json({ message: 'Category not found' });
        }

        // Check if it has subjects
        if (category.subjects && category.subjects.length > 0) {
          if (cascade === 'true') {
            // Cascade delete - delete all subjects first, then the category
            console.log(`Cascade deleting category ${numericId} with ${category.subjects.length} subjects`);

            // Delete all threads in all subjects first
            for (const subject of category.subjects) {
              await prisma.thread.deleteMany({
                where: { subjectId: subject.id }
              });
            }

            // Delete all subjects
            await prisma.subject.deleteMany({
              where: { categoryId: numericId }
            });

            // Now delete the category
            await prisma.category.delete({
              where: { id: numericId }
            });

            return res.status(200).json({
              status: 'success',
              message: `Category and ${category.subjects.length} forum(s) deleted successfully`
            });
          } else {
            // Return error with child info for confirmation
            return res.status(400).json({
              message: `Cannot delete category "${category.name}" with existing forums.`,
              hasChildren: true,
              childCount: category.subjects.length,
              children: category.subjects.map(s => s.name)
            });
          }
        }

        // No subjects, safe to delete
        await prisma.category.delete({
          where: { id: numericId }
        });

        return res.status(200).json({
          status: 'success',
          message: 'Category deleted successfully'
        });
      }

      // Not a category, check if it's a subject
      const subject = await prisma.subject.findUnique({
        where: { id: numericId },
        include: {
          _count: {
            select: {
              threads: true
            }
          }
        }
      });

      if (!subject) {
        return res.status(404).json({
          message: 'Forum or category not found'
        });
      }

      // It's a subject - check if it has threads
      if (subject._count.threads > 0) {
        return res.status(400).json({
          message: 'Cannot delete forum with existing threads. Please delete or move the threads first.'
        });
      }

      await prisma.subject.delete({
        where: { id: numericId }
      });

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
