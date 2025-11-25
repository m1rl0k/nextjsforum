import prisma from './prisma';

// Cache for IP bans
const ipBanCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get client IP address from request
 */
export function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Get the first IP in the chain (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }

  return req.connection?.remoteAddress || req.socket?.remoteAddress || '';
}

/**
 * Check if an IP is banned
 */
export async function isIpBanned(ipAddress) {
  if (!ipAddress) return { banned: false };

  // Check cache first
  const cached = ipBanCache.get(ipAddress);
  if (cached && cached.expiry > Date.now()) {
    return cached.result;
  }

  try {
    const ban = await prisma.ipBan.findFirst({
      where: {
        ipAddress: ipAddress,
        isActive: true,
        OR: [
          { isPermanent: true },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    const result = {
      banned: !!ban,
      reason: ban?.reason || 'Your IP address has been banned',
      expiresAt: ban?.expiresAt,
      isPermanent: ban?.isPermanent || false
    };

    // Cache the result
    ipBanCache.set(ipAddress, {
      result,
      expiry: Date.now() + CACHE_DURATION
    });

    return result;
  } catch (error) {
    console.error('Error checking IP ban:', error);
    return { banned: false };
  }
}

/**
 * Clear IP ban cache for a specific IP
 */
export function clearIpBanCache(ipAddress) {
  if (ipAddress) {
    ipBanCache.delete(ipAddress);
  } else {
    ipBanCache.clear();
  }
}

/**
 * Ban an IP address
 */
export async function banIp(ipAddress, bannedBy, reason, duration = null) {
  if (!ipAddress) {
    throw new Error('IP address is required');
  }

  // Calculate expiry if duration provided (in hours)
  let expiresAt = null;
  let isPermanent = true;

  if (duration && duration > 0) {
    expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    isPermanent = false;
  }

  // Check if IP is already banned
  const existingBan = await prisma.ipBan.findFirst({
    where: {
      ipAddress: ipAddress,
      isActive: true
    }
  });

  if (existingBan) {
    // Update existing ban
    const updated = await prisma.ipBan.update({
      where: { id: existingBan.id },
      data: {
        reason,
        bannedBy,
        expiresAt,
        isPermanent,
        updatedAt: new Date()
      }
    });

    clearIpBanCache(ipAddress);
    return updated;
  }

  // Create new ban
  const ban = await prisma.ipBan.create({
    data: {
      ipAddress,
      reason,
      bannedBy,
      expiresAt,
      isPermanent,
      isActive: true
    }
  });

  clearIpBanCache(ipAddress);
  return ban;
}

/**
 * Unban an IP address
 */
export async function unbanIp(ipAddress) {
  if (!ipAddress) {
    throw new Error('IP address is required');
  }

  await prisma.ipBan.updateMany({
    where: {
      ipAddress: ipAddress,
      isActive: true
    },
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  });

  clearIpBanCache(ipAddress);
}

/**
 * Get all active IP bans
 */
export async function getActiveIpBans(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [bans, total] = await Promise.all([
    prisma.ipBan.findMany({
      where: { isActive: true },
      include: {
        bannedByUser: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.ipBan.count({ where: { isActive: true } })
  ]);

  return {
    bans,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
}

/**
 * Middleware to check IP ban on requests
 */
export async function checkIpBanMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const banStatus = await isIpBanned(ip);

  if (banStatus.banned) {
    const message = banStatus.isPermanent
      ? `Your IP address has been permanently banned. Reason: ${banStatus.reason}`
      : `Your IP address is banned until ${new Date(banStatus.expiresAt).toLocaleString()}. Reason: ${banStatus.reason}`;

    return res.status(403).json({
      error: 'IP Banned',
      message,
      banned: true
    });
  }

  if (next) next();
  return true;
}

export default {
  getClientIp,
  isIpBanned,
  banIp,
  unbanIp,
  getActiveIpBans,
  clearIpBanCache,
  checkIpBanMiddleware
};
