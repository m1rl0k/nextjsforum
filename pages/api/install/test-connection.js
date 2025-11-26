import prisma from '../../../lib/prisma';
import settingsService from '../../../lib/settingsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if already installed
    const isInstalled = await settingsService.isInstalled();
    if (isInstalled) {
      return res.status(403).json({ message: 'Forum is already installed' });
    }

    const { action } = req.body;

    // Test basic connection with timeout
    const connectionTimeout = 5000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), connectionTimeout);
    });

    const queryPromise = prisma.$queryRaw`SELECT 1 as connected`;
    await Promise.race([queryPromise, timeoutPromise]);

    if (action === 'test') {
      // Just test connection
      return res.status(200).json({
        success: true,
        message: 'Database connection successful!',
        connected: true
      });
    }

    if (action === 'info') {
      // Get database info and existing tables
      let tables = [];
      let dbVersion = 'Unknown';
      let dbSize = 'Unknown';

      try {
        // Get PostgreSQL version
        const versionResult = await prisma.$queryRaw`SELECT version()`;
        dbVersion = versionResult[0]?.version?.split(' ').slice(0, 2).join(' ') || 'PostgreSQL';

        // Get database size
        const sizeResult = await prisma.$queryRaw`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `;
        dbSize = sizeResult[0]?.size || 'Unknown';

        // Get list of tables
        const tablesResult = await prisma.$queryRaw`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public' 
          ORDER BY tablename
        `;
        tables = tablesResult.map(t => t.tablename);
      } catch (e) {
        console.log('Could not get extended DB info:', e.message);
      }

      return res.status(200).json({
        success: true,
        connected: true,
        dbVersion,
        dbSize,
        tables,
        tableCount: tables.length,
        hasExistingData: tables.length > 0
      });
    }

    if (action === 'reset') {
      // Drop all tables and reset database (DANGEROUS!)
      try {
        // Get all tables
        const tablesResult = await prisma.$queryRaw`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public'
        `;

        // Drop each table
        for (const table of tablesResult) {
          await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE`);
        }

        // Also drop enums
        await prisma.$executeRawUnsafe(`
          DO $$ DECLARE
            r RECORD;
          BEGIN
            FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
            LOOP
              EXECUTE 'DROP TYPE IF EXISTS "' || r.typname || '" CASCADE';
            END LOOP;
          END $$;
        `);

        return res.status(200).json({
          success: true,
          message: 'Database reset successfully. All tables have been dropped.',
          tables: [],
          tableCount: 0
        });
      } catch (e) {
        return res.status(500).json({
          success: false,
          message: 'Failed to reset database: ' + e.message
        });
      }
    }

    return res.status(400).json({ message: 'Invalid action' });

  } catch (error) {
    console.error('Database connection test failed:', error);
    
    let message = 'Database connection failed';
    if (error.message === 'Connection timeout') {
      message = 'Connection timed out. Check if the database server is running.';
    } else if (error.message?.includes('ECONNREFUSED')) {
      message = 'Connection refused. Check if the database server is running and the port is correct.';
    } else if (error.message?.includes('authentication')) {
      message = 'Authentication failed. Check your username and password.';
    } else if (error.message?.includes('does not exist')) {
      message = 'Database does not exist. Check the database name.';
    }

    return res.status(500).json({
      success: false,
      connected: false,
      message,
      error: error.message
    });
  }
}

