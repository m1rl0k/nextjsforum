import prisma from '../../lib/prisma';

/**
 * Health check endpoint for monitoring
 * Returns 200 if the application and database are healthy
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Check database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    };

    // Check if we can query basic data
    const categoryCount = await prisma.category.count();
    health.checks.database.categories = categoryCount;

  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    return res.status(503).json(health);
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
  };

  health.responseTime = Date.now() - startTime;

  res.status(200).json(health);
}

