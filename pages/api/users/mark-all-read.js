import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Update user's last activity to mark everything as read
    // In a real forum, you might have a separate "read status" table
    // For now, we'll update the user's lastActivity timestamp
    const now = new Date();
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActivity: now,
        // You could also add a lastReadAll field
        // lastReadAll: now
      }
    });

    // Optional: Create a read status record for tracking
    // This would be useful for more granular read tracking
    /*
    await prisma.userReadStatus.upsert({
      where: { userId: user.id },
      update: { lastReadAll: now },
      create: { 
        userId: user.id, 
        lastReadAll: now 
      }
    });
    */

    res.status(200).json({ 
      message: 'All forums marked as read successfully',
      timestamp: now
    });

  } catch (error) {
    console.error('Error marking all forums as read:', error);
    res.status(500).json({ message: 'Failed to mark forums as read' });
  }
}
