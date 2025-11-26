import prisma from '../../../lib/prisma';
import settingsService from '../../../lib/settingsService';
import { rateLimit } from '../../../lib/rateLimit';
import {
  validate,
  installDatabaseSchema,
  installAdminSchema,
  installSiteConfigSchema,
  installForumStructureSchema
} from '../../../lib/validation';
import { sanitizeText } from '../../../lib/sanitize';

// Strict rate limiting for installation (prevent brute force)
const installRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many installation requests, please slow down.',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  try {
    await new Promise((resolve, reject) => {
      installRateLimit(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    return; // Rate limit response already sent
  }

  try {
    const { step, data } = req.body;

    // Validate step number
    if (!Number.isInteger(step) || step < 1 || step > 4) {
      return res.status(400).json({ message: 'Invalid installation step' });
    }

    // Check if already installed (security - prevent re-installation)
    const isInstalled = await settingsService.isInstalled();
    if (isInstalled) {
      return res.status(403).json({
        message: 'Forum is already installed. Re-installation is not allowed.',
        code: 'ALREADY_INSTALLED'
      });
    }

    // Validate step data based on step number
    const validationResult = validateStepData(step, data);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.errors
      });
    }

    let updateData = { installationStep: step + 1 };

    switch (step) {
      case 1: // Database Configuration
        await processDatabaseStep(validationResult.data);
        updateData.dbConfigured = true;
        break;

      case 2: // Admin Account
        await processAdminStep(validationResult.data);
        updateData.adminCreated = true;
        break;

      case 3: // Site Configuration
        await processSiteConfigStep(validationResult.data);
        updateData.siteConfigured = true;
        break;

      case 4: // Forum Structure
        await processForumStructureStep(validationResult.data);
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

    // Return user-friendly error messages
    const errorMessage = getErrorMessage(error);
    res.status(500).json({
      message: errorMessage,
      code: error.code || 'INSTALLATION_ERROR'
    });
  }
}

/**
 * Validate step data based on step number
 */
function validateStepData(step, data) {
  switch (step) {
    case 1:
      return validate(installDatabaseSchema, data);
    case 2:
      return validate(installAdminSchema, data);
    case 3:
      return validate(installSiteConfigSchema, data);
    case 4:
      return validate(installForumStructureSchema, data);
    default:
      return { success: false, errors: [{ field: 'step', message: 'Invalid step' }] };
  }
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error) {
  // Map common errors to user-friendly messages
  if (error.code === 'P2002') {
    return 'A record with this information already exists.';
  }
  if (error.code === 'P2003') {
    return 'Related data not found. Please try again.';
  }
  if (error.message?.includes('connect')) {
    return 'Database connection failed. Please check your database configuration.';
  }
  if (error.message?.includes('timeout')) {
    return 'Operation timed out. Please try again.';
  }

  // Return sanitized error message or generic message
  return sanitizeText(error.message) || 'Installation step failed. Please try again.';
}

async function processDatabaseStep(data) {
  // Database connection is configured via DATABASE_URL environment variable
  // We don't store credentials in the database for security reasons

  // Test the database connection with timeout
  const connectionTimeout = 10000; // 10 seconds

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), connectionTimeout);
    });

    const queryPromise = prisma.$queryRaw`SELECT 1`;

    await Promise.race([queryPromise, timeoutPromise]);
    console.log('Database connection test successful');
  } catch (dbError) {
    console.error('Database connection error:', dbError);

    if (dbError.message === 'Connection timeout') {
      const error = new Error('Database connection timed out. Please check your database server.');
      error.code = 'DB_TIMEOUT';
      throw error;
    }

    const error = new Error('Database connection failed. Please verify your DATABASE_URL environment variable is correct.');
    error.code = 'DB_CONNECTION_FAILED';
    throw error;
  }

  // Verify required tables exist (check if migrations have been run)
  try {
    await prisma.installationStatus.findFirst();
  } catch (tableError) {
    console.error('Database schema error:', tableError);
    const error = new Error('Database schema not found. Please run "npx prisma migrate deploy" first.');
    error.code = 'DB_SCHEMA_MISSING';
    throw error;
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
