import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { banIp, unbanIp, getActiveIpBans, clearIpBanCache } from '../../../lib/ipBan';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // GET - List IP bans
    if (req.method === 'GET') {
      const { page = 1, limit = 20 } = req.query;
      const result = await getActiveIpBans(parseInt(page), parseInt(limit));
      return res.status(200).json(result);
    }

    // POST - Create IP ban
    if (req.method === 'POST') {
      const { ipAddress, reason, duration } = req.body;

      if (!ipAddress) {
        return res.status(400).json({ message: 'IP address is required' });
      }

      // Validate IP format (basic check)
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      if (!ipRegex.test(ipAddress) && !ipAddress.includes('*')) {
        return res.status(400).json({ message: 'Invalid IP address format' });
      }

      try {
        const ban = await banIp(
          ipAddress.trim(),
          user.id,
          reason || 'No reason provided',
          duration ? parseInt(duration) : null
        );

        // Log the action
        await prisma.moderationLog.create({
          data: {
            moderatorId: user.id,
            action: 'BAN_IP',
            targetType: 'IP',
            targetId: ban.id,
            reason: reason || 'IP banned',
            details: JSON.stringify({
              ipAddress,
              duration: duration || 'permanent'
            })
          }
        });

        return res.status(201).json({
          message: 'IP banned successfully',
          ban
        });
      } catch (error) {
        console.error('Error banning IP:', error);
        return res.status(500).json({ message: error.message || 'Failed to ban IP' });
      }
    }

    // DELETE - Remove IP ban
    if (req.method === 'DELETE') {
      const { ipAddress, id } = req.body;

      if (!ipAddress && !id) {
        return res.status(400).json({ message: 'IP address or ban ID is required' });
      }

      try {
        if (id) {
          // Unban by ID
          const ban = await prisma.ipBan.findUnique({ where: { id: parseInt(id) } });
          if (!ban) {
            return res.status(404).json({ message: 'Ban not found' });
          }

          await prisma.ipBan.update({
            where: { id: parseInt(id) },
            data: { isActive: false }
          });

          clearIpBanCache(ban.ipAddress);
        } else {
          // Unban by IP
          await unbanIp(ipAddress);
        }

        // Log the action
        await prisma.moderationLog.create({
          data: {
            moderatorId: user.id,
            action: 'UNBAN_IP',
            targetType: 'IP',
            targetId: id ? parseInt(id) : 0,
            reason: 'IP ban removed',
            details: JSON.stringify({ ipAddress: ipAddress || 'by ID' })
          }
        });

        return res.status(200).json({ message: 'IP ban removed successfully' });
      } catch (error) {
        console.error('Error removing IP ban:', error);
        return res.status(500).json({ message: 'Failed to remove IP ban' });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in IP bans API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
