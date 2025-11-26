import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

class SettingsService {
  constructor() {
    // Use hybrid approach: JSON for dev defaults, DB for user changes
    this.useDatabase = process.env.NODE_ENV === 'production' || process.env.USE_DATABASE_SETTINGS === 'true';
    this.jsonPath = path.join(process.cwd(), 'config', 'template-settings.json');
    this.configDir = path.join(process.cwd(), 'config');

    // Always use both JSON and DB for commercial viability
    this.hybridMode = true;
  }

  // Check if installation is complete
  async isInstalled() {
    try {
      // Always check database for installation status (even in dev)
      const status = await prisma.installationStatus.findFirst();
      return status?.isInstalled || false;
    } catch (error) {
      console.error('Error checking installation status:', error);
      return false;
    }
  }

  // Get installation status
  async getInstallationStatus() {
    try {
      // Always check database for installation status (even in dev)
      const status = await prisma.installationStatus.findFirst();
      if (status) {
        return status;
      }
      // Return defaults if no status record exists
      return {
        isInstalled: false,
        installationStep: 1,
        dbConfigured: false,
        adminCreated: false,
        siteConfigured: false,
        forumsCreated: false
      };
    } catch (error) {
      console.error('Error getting installation status:', error);
      return null;
    }
  }

  // Update installation status
  async updateInstallationStatus(updates) {
    try {
      // Always write installation status to database (even in dev)
      const existing = await prisma.installationStatus.findFirst();
      if (existing) {
        return await prisma.installationStatus.update({
          where: { id: existing.id },
          data: updates
        });
      } else {
        return await prisma.installationStatus.create({
          data: updates
        });
      }
    } catch (error) {
      console.error('Error updating installation status:', error);
      throw error;
    }
  }

  // Get theme settings (hybrid approach)
  async getThemeSettings() {
    try {
      let settings = this.getDefaultSettings();

      // Always try JSON first (for dev defaults and fallback)
      try {
        const jsonSettings = this.getJsonSettings();
        settings = { ...settings, ...jsonSettings };
      } catch (error) {
        console.log('No JSON settings found, using defaults');
      }

      // Then try database (for user customizations)
      if (this.useDatabase || this.hybridMode) {
        try {
          const dbSettings = await prisma.themeSettings.findFirst({
            where: { isActive: true }
          });

          if (dbSettings) {
            // Merge: defaults < JSON < database
            settings = { ...settings, ...dbSettings };
          }
        } catch (error) {
          console.log('Database not available, using JSON/defaults');
        }
      }

      return settings;
    } catch (error) {
      console.error('Error getting theme settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Save theme settings (hybrid approach)
  async saveThemeSettings(settings) {
    try {
      let result = settings;

      // Always save to JSON for development/backup
      try {
        result = this.saveJsonSettings(settings);
      } catch (error) {
        console.log('Could not save to JSON:', error.message);
      }

      // Also save to database if available (for production/user customizations)
      if (this.useDatabase || this.hybridMode) {
        try {
          const existing = await prisma.themeSettings.findFirst({
            where: { isActive: true }
          });

          if (existing) {
            result = await prisma.themeSettings.update({
              where: { id: existing.id },
              data: { ...settings, updatedAt: new Date() }
            });
          } else {
            result = await prisma.themeSettings.create({
              data: { ...settings, isActive: true }
            });
          }
        } catch (error) {
          console.log('Database not available, saved to JSON only');
        }
      }

      return result;
    } catch (error) {
      console.error('Error saving theme settings:', error);
      throw error;
    }
  }

  // Get site settings
  async getSiteSettings() {
    try {
      if (this.useDatabase) {
        const settings = await prisma.siteSettings.findMany();
        return this.formatSiteSettings(settings);
      } else {
        // Return default settings for development
        return this.getDefaultSiteSettings();
      }
    } catch (error) {
      console.error('Error getting site settings:', error);
      return this.getDefaultSiteSettings();
    }
  }

  // Save site setting
  async saveSiteSetting(key, value, type = 'string', category = 'general', description = '') {
    try {
      if (this.useDatabase) {
        return await prisma.siteSettings.upsert({
          where: { key },
          update: { value, type, category, description, updatedAt: new Date() },
          create: { key, value, type, category, description }
        });
      }
      return { key, value, type, category, description };
    } catch (error) {
      console.error('Error saving site setting:', error);
      throw error;
    }
  }

  // JSON file operations (for development/fallback)
  getJsonSettings() {
    try {
      if (fs.existsSync(this.jsonPath)) {
        const fileContent = fs.readFileSync(this.jsonPath, 'utf8');
        const settings = JSON.parse(fileContent);
        return { ...this.getDefaultSettings(), ...settings };
      }
    } catch (error) {
      console.error('Error reading JSON settings:', error);
    }
    return this.getDefaultSettings();
  }

  saveJsonSettings(settings) {
    try {
      const configDir = path.dirname(this.jsonPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.jsonPath, JSON.stringify(settings, null, 2));
      return settings;
    } catch (error) {
      console.error('Error saving JSON settings:', error);
      throw error;
    }
  }

  // Default settings
  getDefaultSettings() {
    return {
      siteName: 'NextJS Forum',
      logoEnabled: false,
      logoUrl: '',
      faviconUrl: '/favicon.ico',
      siteDescription: 'A modern forum built with Next.js',
      footerText: 'Powered by NextJS Forum',
      primaryColor: '#2B4F81',
      secondaryColor: '#4C76B2',
      backgroundColor: '#E0E8F5',
      textColor: '#000000',
      linkColor: '#006699',
      linkHoverColor: '#0088CC',
      headerBackground: '#2B4F81',
      headerText: '#FFFFFF',
      navbarBackground: '#4C76B2',
      navbarText: '#FFFFFF',
      categoryHeaderBackground: '#738FBF',
      categoryHeaderText: '#FFFFFF',
      subjectHeaderBackground: '#DEE4F2',
      subjectHeaderText: '#000000',
      threadBackground: '#FFFFFF',
      threadAltBackground: '#F5F5FF',
      threadHoverBackground: '#E8EFFD',
      postHeaderBackground: '#DEE4F2',
      postBodyBackground: '#FFFFFF',
      postFooterBackground: '#F5F5FF',
      sidebarBackground: '#E0E8F5',
      borderColor: '#94A3C4',
      buttonBackground: '#4C76B2',
      buttonText: '#FFFFFF',
      buttonHoverBackground: '#0088CC',
      inputBackground: '#FFFFFF',
      inputText: '#000000',
      inputBorderColor: '#94A3C4',
      buttonRadius: '0px',
      cardRadius: '0px',
      fontSize: '13px',
      fontFamily: 'Verdana, Arial, sans-serif',
      enableDarkMode: false,
      compactMode: false,
      showAvatars: true,
      showSignatures: true,
      threadsPerPage: 20,
      postsPerPage: 10,
      customCSS: ''
    };
  }

  getDefaultSiteSettings() {
    return {
      site_name: 'NextJS Forum',
      site_description: 'A modern forum built with Next.js',
      admin_email: '',
      registration_enabled: true,
      email_verification: false,
      guest_posting: false,
      maintenance_mode: false,
      maintenance_message: 'The forum is currently under maintenance. Please check back later.',
      max_upload_size: 5,
      allowed_file_types: 'jpg,jpeg,png,gif,pdf,doc,docx',
      timezone: 'UTC',
      date_format: 'YYYY-MM-DD',
      time_format: '24'
    };
  }

  formatSiteSettings(settings) {
    const formatted = {};
    settings.forEach(setting => {
      let value = setting.value;
      if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'number') {
        value = parseInt(value);
      }
      formatted[setting.key] = value;
    });
    return formatted;
  }

  // ============================================================================
  // COMMERCIAL FORUM FEATURES
  // ============================================================================

  // User Groups Management
  async getUserGroups() {
    try {
      if (this.useDatabase) {
        return await prisma.userGroup.findMany({
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, email: true }
                }
              }
            }
          },
          orderBy: { priority: 'desc' }
        });
      }
      return this.getDefaultUserGroups();
    } catch (error) {
      console.error('Error getting user groups:', error);
      return this.getDefaultUserGroups();
    }
  }

  async createUserGroup(groupData) {
    try {
      if (this.useDatabase) {
        return await prisma.userGroup.create({
          data: groupData
        });
      }
      // For development, just return the data
      return { id: Date.now(), ...groupData };
    } catch (error) {
      console.error('Error creating user group:', error);
      throw error;
    }
  }

  // Forum Statistics
  async getForumStats() {
    try {
      if (this.useDatabase) {
        const [userCount, threadCount, postCount, latestUser] = await Promise.all([
          prisma.user.count({ where: { isActive: true } }),
          prisma.thread.count({ where: { deleted: false } }),
          prisma.post.count({ where: { deleted: false } }),
          prisma.user.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: { id: true, username: true, createdAt: true }
          })
        ]);

        return {
          totalUsers: userCount,
          totalThreads: threadCount,
          totalPosts: postCount,
          latestUser,
          onlineUsers: await this.getOnlineUserCount()
        };
      }

      return this.getDefaultStats();
    } catch (error) {
      console.error('Error getting forum stats:', error);
      return this.getDefaultStats();
    }
  }

  async getOnlineUserCount() {
    try {
      if (this.useDatabase) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return await prisma.user.count({
          where: {
            lastActivity: { gte: fiveMinutesAgo },
            isActive: true
          }
        });
      }
      return 0;
    } catch (error) {
      console.error('Error getting online user count:', error);
      return 0;
    }
  }

  // Content Management
  async getContentStats() {
    try {
      if (this.useDatabase) {
        const [categories, subjects, threads, posts, reports] = await Promise.all([
          prisma.category.count(),
          prisma.subject.count({ where: { isActive: true } }),
          prisma.thread.count({ where: { deleted: false } }),
          prisma.post.count({ where: { deleted: false } }),
          prisma.report.count({ where: { status: 'PENDING' } })
        ]);

        return {
          categories,
          subjects,
          threads,
          posts,
          pendingReports: reports
        };
      }

      return { categories: 0, subjects: 0, threads: 0, posts: 0, pendingReports: 0 };
    } catch (error) {
      console.error('Error getting content stats:', error);
      return { categories: 0, subjects: 0, threads: 0, posts: 0, pendingReports: 0 };
    }
  }

  // Default data for development
  getDefaultUserGroups() {
    return [
      {
        id: 1,
        name: 'Administrators',
        description: 'Full access to all forum features',
        color: '#dc3545',
        priority: 100,
        canPost: true,
        canReply: true,
        canEdit: true,
        canDelete: true,
        canModerate: true,
        canAdmin: true
      },
      {
        id: 2,
        name: 'Moderators',
        description: 'Can moderate posts and users',
        color: '#28a745',
        priority: 50,
        canPost: true,
        canReply: true,
        canEdit: true,
        canDelete: true,
        canModerate: true,
        canAdmin: false
      },
      {
        id: 3,
        name: 'Members',
        description: 'Regular forum members',
        color: '#007bff',
        priority: 10,
        canPost: true,
        canReply: true,
        canEdit: false,
        canDelete: false,
        canModerate: false,
        canAdmin: false
      }
    ];
  }

  getDefaultStats() {
    return {
      totalUsers: 1,
      totalThreads: 0,
      totalPosts: 0,
      latestUser: null,
      onlineUsers: 0
    };
  }

  // Configuration Management
  async exportConfiguration() {
    try {
      const config = {
        siteSettings: await this.getSiteSettings(),
        themeSettings: await this.getThemeSettings(),
        userGroups: await this.getUserGroups(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return config;
    } catch (error) {
      console.error('Error exporting configuration:', error);
      throw error;
    }
  }

  async importConfiguration(config) {
    try {
      if (config.siteSettings) {
        for (const [key, value] of Object.entries(config.siteSettings)) {
          await this.saveSiteSetting(key, value.toString());
        }
      }

      if (config.themeSettings) {
        await this.saveThemeSettings(config.themeSettings);
      }

      return { success: true, message: 'Configuration imported successfully' };
    } catch (error) {
      console.error('Error importing configuration:', error);
      throw error;
    }
  }
}

export default new SettingsService();
