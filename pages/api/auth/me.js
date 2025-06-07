import { verifyToken } from '../../../lib/auth';
import prisma from '../../../lib/db';
import { UnauthorizedError, NotFoundError } from '../../../lib/apiError';
import { errorHandler } from '../../../lib/apiError';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
}
