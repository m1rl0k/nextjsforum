import settingsService from '../../../lib/settingsService';
import prisma from '../../../lib/prisma';

// Cache for installation status (avoid hitting DB on every request)
let statusCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const now = Date.now();

    // Use cached status if available and not expired
    if (statusCache && statusCache.isInstalled && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json(statusCache);
    }

    // Check database connection first
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (dbError) {
      console.warn('Database not connected during status check');
    }

    const status = await settingsService.getInstallationStatus();
    const isInstalled = await settingsService.isInstalled();

    const responseData = {
      isInstalled,
      installationStep: status?.installationStep || 1,
      dbConfigured: status?.dbConfigured || false,
      adminCreated: status?.adminCreated || false,
      siteConfigured: status?.siteConfigured || false,
      forumsCreated: status?.forumsCreated || false,
      version: status?.version || '1.0.0',
      dbConnected,
      // System requirements for frontend display
      requirements: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryAvailable: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };

    // Cache the result
    statusCache = responseData;
    cacheTimestamp = now;

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting installation status:', error);

    // Return safe defaults on error
    res.status(200).json({
      isInstalled: false,
      installationStep: 1,
      dbConfigured: false,
      adminCreated: false,
      siteConfigured: false,
      forumsCreated: false,
      version: '1.0.0',
      dbConnected: false,
      error: 'Unable to check installation status'
    });
  }
}

// Export function to invalidate cache (called after installation changes)
export function invalidateStatusCache() {
  statusCache = null;
  cacheTimestamp = 0;
}
