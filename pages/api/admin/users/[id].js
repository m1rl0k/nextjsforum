import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get specific user details
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          threads: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              viewCount: true,
              subject: {
                select: {
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          posts: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              thread: {
                select: {
                  id: true,
                  title: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              threads: true,
              posts: true,
              sentMessages: true,
              receivedMessages: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        status: 'success',
        data: user
      });
    } else if (req.method === 'PUT') {
      // Update user (ban, promote, etc.)
      const { action, role, isActive, bio, location, signature } = req.body;

      const updateData = {};

      if (action === 'ban') {
        updateData.isActive = false;
      } else if (action === 'unban') {
        updateData.isActive = true;
      } else if (action === 'promote' && role) {
        updateData.role = role;
      } else {
        // Regular profile update
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (signature !== undefined) updateData.signature = signature;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (role !== undefined) updateData.role = role;
      }

      // Prevent admin from banning themselves
      if (adminUser.id === parseInt(id) && updateData.isActive === false) {
        return res.status(400).json({ message: 'Cannot ban yourself' });
      }

      // Prevent demoting the last admin
      if (updateData.role && updateData.role !== 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true }
        });
        
        const targetUser = await prisma.user.findUnique({
          where: { id: parseInt(id) }
        });

        if (targetUser?.role === 'ADMIN' && adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot demote the last admin' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          bio: true,
          location: true,
          signature: true,
          createdAt: true,
          lastLogin: true
        }
      });

      res.status(200).json({
        status: 'success',
        data: updatedUser,
        message: `User ${action || 'updated'} successfully`
      });
    } else if (req.method === 'DELETE') {
      // Delete user (soft delete - just ban them)
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent admin from deleting themselves
      if (adminUser.id === parseInt(id)) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
      }

      // Prevent deleting the last admin
      if (targetUser.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true }
        });

        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last admin' });
        }
      }

      // Soft delete by banning
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      res.status(200).json({
        status: 'success',
        message: 'User banned successfully'
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin user management:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
