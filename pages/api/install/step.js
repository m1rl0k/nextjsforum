import prisma from '../../../lib/prisma';
import settingsService from '../../../lib/settingsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { step, data } = req.body;

    // Check if already installed
    const isInstalled = await settingsService.isInstalled();
    if (isInstalled) {
      return res.status(400).json({ message: 'Forum is already installed' });
    }

    let updateData = { installationStep: step + 1 };

    switch (step) {
      case 1: // Database Configuration
        await processDatabaseStep(data);
        updateData.dbConfigured = true;
        break;

      case 2: // Admin Account
        await processAdminStep(data);
        updateData.adminCreated = true;
        break;

      case 3: // Site Configuration
        await processSiteConfigStep(data);
        updateData.siteConfigured = true;
        break;

      case 4: // Forum Structure
        await processForumStructureStep(data);
        updateData.forumsCreated = true;
        break;

      default:
        return res.status(400).json({ message: 'Invalid step' });
    }

    // Update installation status
    await settingsService.updateInstallationStatus(updateData);

    res.status(200).json({ 
      message: `Step ${step} completed successfully`,
      nextStep: step + 1
    });

  } catch (error) {
    console.error(`Error processing installation step:`, error);
    res.status(500).json({ 
      message: error.message || 'Installation step failed'
    });
  }
}

async function processDatabaseStep(data) {
  // Database connection is configured via DATABASE_URL environment variable
  // We don't store credentials in the database for security reasons

  // Test the database connection by attempting a simple query
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection test successful');
  } catch (error) {
    throw new Error('Database connection failed. Please check your DATABASE_URL environment variable.');
  }

  // Only store non-sensitive metadata about the database type
  await settingsService.saveSiteSetting('db_type', data.dbType || 'postgresql');
  await settingsService.saveSiteSetting('db_configured', 'true');
}

async function processAdminStep(data) {
  const bcrypt = require('bcryptjs');
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { 
      OR: [
        { username: data.adminUsername },
        { email: data.adminEmail }
      ]
    }
  });

  if (existingAdmin) {
    throw new Error('Admin user already exists with this username or email');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      username: data.adminUsername,
      email: data.adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true // Admin is automatically verified
    }
  });

  // Store admin user ID
  await settingsService.saveSiteSetting('admin_user_id', adminUser.id.toString());
}

async function processSiteConfigStep(data) {
  // Save site configuration
  await settingsService.saveSiteSetting('site_name', data.siteName);
  await settingsService.saveSiteSetting('site_description', data.siteDescription);
  await settingsService.saveSiteSetting('admin_email', data.adminEmailContact);
  await settingsService.saveSiteSetting('timezone', data.timezone);

  // Update theme settings with site name
  const currentTheme = await settingsService.getThemeSettings();
  await settingsService.saveThemeSettings({
    ...currentTheme,
    siteName: data.siteName,
    siteDescription: data.siteDescription
  });
}

async function processForumStructureStep(data) {
  if (data.createSampleData) {
    // Create default categories
    for (const categoryData of data.defaultCategories) {
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          order: data.defaultCategories.indexOf(categoryData)
        }
      });

      // Create a default subject for each category
      await prisma.subject.create({
        data: {
          name: `General ${categoryData.name}`,
          description: `General discussions about ${categoryData.name.toLowerCase()}`,
          categoryId: category.id
        }
      });
    }

    // Create a welcome thread
    const generalCategory = await prisma.category.findFirst({
      include: { subjects: true }
    });

    if (generalCategory && generalCategory.subjects.length > 0) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (adminUser) {
        await prisma.thread.create({
          data: {
            title: 'Welcome to your new forum!',
            content: `Welcome to your new NextJS Forum! 

This is your first thread. You can:
- Create new categories and subjects
- Customize your theme and appearance
- Manage users and permissions
- Configure forum settings

Visit the Admin Panel to get started with customization.

Happy posting!`,
            userId: adminUser.id,
            subjectId: generalCategory.subjects[0].id,
            isSticky: true
          }
        });
      }
    }
  }
}
