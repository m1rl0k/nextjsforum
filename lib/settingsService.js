import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

class SettingsService {
  constructor() {
    this.useDatabase = process.env.NODE_ENV === 'production' || process.env.USE_DATABASE_SETTINGS === 'true';
    this.jsonPath = path.join(process.cwd(), 'config', 'template-settings.json');
  }

  // Check if installation is complete
  async isInstalled() {
    try {
      if (this.useDatabase) {
        const status = await prisma.installationStatus.findFirst();
        return status?.isInstalled || false;
      } else {
        // For development, assume installed
        return true;
      }
    } catch (error) {
      console.error('Error checking installation status:', error);
      return false;
    }
  }

  // Get installation status
  async getInstallationStatus() {
    try {
      if (this.useDatabase) {
        return await prisma.installationStatus.findFirst();
      } else {
        return {
          isInstalled: true,
          installationStep: 5,
          dbConfigured: true,
          adminCreated: true,
          siteConfigured: true,
          forumsCreated: true
        };
      }
    } catch (error) {
      console.error('Error getting installation status:', error);
      return null;
    }
  }

  // Update installation status
  async updateInstallationStatus(updates) {
    try {
      if (this.useDatabase) {
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
      }
      return updates;
    } catch (error) {
      console.error('Error updating installation status:', error);
      throw error;
    }
  }

  // Get theme settings
  async getThemeSettings() {
    try {
      if (this.useDatabase) {
        // Try database first
        const dbSettings = await prisma.themeSettings.findFirst({
          where: { isActive: true }
        });
        
        if (dbSettings) {
          return dbSettings;
        }
      }

      // Fallback to JSON file
      return this.getJsonSettings();
    } catch (error) {
      console.error('Error getting theme settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Save theme settings
  async saveThemeSettings(settings) {
    try {
      if (this.useDatabase) {
        // Save to database
        const existing = await prisma.themeSettings.findFirst({
          where: { isActive: true }
        });

        if (existing) {
          return await prisma.themeSettings.update({
            where: { id: existing.id },
            data: { ...settings, updatedAt: new Date() }
          });
        } else {
          return await prisma.themeSettings.create({
            data: { ...settings, isActive: true }
          });
        }
      } else {
        // Save to JSON file for development
        return this.saveJsonSettings(settings);
      }
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
}

export default new SettingsService();
