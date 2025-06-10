import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

// Default settings
const defaultSettings = {
  siteName: 'NextJS Forum',
  siteDescription: 'A modern forum built with NextJS',
  allowRegistration: true,
  requireEmailVerification: false,
  defaultUserRole: 'USER',
  postsPerPage: 20,
  threadsPerPage: 20,
  maxFileSize: 5,
  allowedFileTypes: 'jpg,jpeg,png,gif,pdf',
  enableNotifications: true,
  enablePrivateMessages: true,
  moderationMode: 'auto',
  spamFilterEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'The forum is currently under maintenance. Please check back later.'
};

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get current settings
      try {
        const settings = await prisma.setting.findMany();
        
        // Convert array of settings to object
        const settingsObj = { ...defaultSettings };
        settings.forEach(setting => {
          let value = setting.value;
          
          // Parse JSON values
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not valid JSON
          }
          
          settingsObj[setting.key] = value;
        });

        res.status(200).json({
          status: 'success',
          settings: settingsObj
        });
      } catch (error) {
        // If settings table doesn't exist, return defaults
        res.status(200).json({
          status: 'success',
          settings: defaultSettings
        });
      }
    } else if (req.method === 'PUT') {
      // Update settings
      const newSettings = req.body;

      // Validate settings
      const validatedSettings = {};
      Object.keys(defaultSettings).forEach(key => {
        if (newSettings.hasOwnProperty(key)) {
          validatedSettings[key] = newSettings[key];
        }
      });

      try {
        // Try to create settings table if it doesn't exist
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Setting" (
            "id" SERIAL PRIMARY KEY,
            "key" TEXT UNIQUE NOT NULL,
            "value" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
      } catch (error) {
        // Table might already exist, continue
      }

      // Update each setting
      for (const [key, value] of Object.entries(validatedSettings)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        try {
          await prisma.setting.upsert({
            where: { key },
            update: { 
              value: stringValue,
              updatedAt: new Date()
            },
            create: { 
              key, 
              value: stringValue 
            }
          });
        } catch (error) {
          console.error(`Error updating setting ${key}:`, error);
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully'
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
