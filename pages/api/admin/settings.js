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
        const settings = await prisma.siteSettings.findMany();

        // Map snake_case to camelCase
        const reverseKeyMapping = {
          site_name: 'siteName',
          site_description: 'siteDescription',
          registration_enabled: 'allowRegistration',
          email_verification: 'requireEmailVerification',
          default_user_role: 'defaultUserRole',
          posts_per_page: 'postsPerPage',
          threads_per_page: 'threadsPerPage',
          max_upload_size: 'maxFileSize',
          allowed_file_types: 'allowedFileTypes',
          enable_notifications: 'enableNotifications',
          enable_private_messages: 'enablePrivateMessages',
          moderation_mode: 'moderationMode',
          spam_filter_enabled: 'spamFilterEnabled',
          maintenance_mode: 'maintenanceMode',
          maintenance_message: 'maintenanceMessage'
        };

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

          // Convert snake_case key to camelCase
          const camelKey = reverseKeyMapping[setting.key] || setting.key;
          settingsObj[camelKey] = value;
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

      // Map camelCase to snake_case for database
      const keyMapping = {
        siteName: 'site_name',
        siteDescription: 'site_description',
        allowRegistration: 'registration_enabled',
        requireEmailVerification: 'email_verification',
        defaultUserRole: 'default_user_role',
        postsPerPage: 'posts_per_page',
        threadsPerPage: 'threads_per_page',
        maxFileSize: 'max_upload_size',
        allowedFileTypes: 'allowed_file_types',
        enableNotifications: 'enable_notifications',
        enablePrivateMessages: 'enable_private_messages',
        moderationMode: 'moderation_mode',
        spamFilterEnabled: 'spam_filter_enabled',
        maintenanceMode: 'maintenance_mode',
        maintenanceMessage: 'maintenance_message'
      };

      // Validate and convert settings
      const validatedSettings = {};
      Object.keys(defaultSettings).forEach(key => {
        if (newSettings.hasOwnProperty(key)) {
          const dbKey = keyMapping[key] || key;
          validatedSettings[dbKey] = newSettings[key];
        }
      });

      // Update each setting using SiteSettings model
      for (const [key, value] of Object.entries(validatedSettings)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        try {
          await prisma.siteSettings.upsert({
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

      // Also update theme settings if site name or description changed
      // This keeps them in sync for backward compatibility
      if (validatedSettings.siteName || validatedSettings.siteDescription) {
        try {
          const themeSettings = await prisma.themeSettings.findFirst();
          if (themeSettings) {
            const updateData = {};
            if (validatedSettings.siteName) {
              updateData.siteName = validatedSettings.siteName;
            }
            if (validatedSettings.siteDescription) {
              updateData.siteDescription = validatedSettings.siteDescription;
            }

            await prisma.themeSettings.update({
              where: { id: themeSettings.id },
              data: updateData
            });
          }
        } catch (error) {
          console.error('Error syncing theme settings:', error);
          // Don't fail the request if theme sync fails
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
