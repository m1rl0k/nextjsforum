import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Consider users active if they've been active in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const activeUsers = await prisma.user.count({
      where: {
        lastActivity: {
          gte: fifteenMinutesAgo
        },
        isActive: true
      }
    });

    const guestRatio = Number.parseFloat(process.env.GUEST_ESTIMATE_RATIO || '0');
    const estimatedGuests = Number.isFinite(guestRatio) && guestRatio > 0
      ? Math.max(0, Math.floor(activeUsers * guestRatio))
      : 0;

    res.status(200).json({
      total: activeUsers + estimatedGuests,
      members: activeUsers,
      guests: estimatedGuests
    });
  } catch (error) {
    console.error('Error fetching online stats:', error);
    res.status(200).json({
      total: 0,
      members: 0,
      guests: 0
    });
  }
}
