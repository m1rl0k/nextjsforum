import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      // Anonymous user - just return OK
      return res.status(200).json({ ok: true, anonymous: true });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return res.status(200).json({ ok: true, anonymous: true });
    }

    // Update user's lastActivity timestamp
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        lastActivity: new Date()
      }
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    // Fail silently - activity tracking shouldn't break the app
    console.error('Error updating activity:', error);
    return res.status(200).json({ ok: true, error: 'silent' });
  }
}

