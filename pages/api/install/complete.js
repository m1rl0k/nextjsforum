import settingsService from '../../../lib/settingsService';
import prisma from '../../../lib/prisma';
import { rateLimit } from '../../../lib/rateLimit';

// Strict rate limiting for installation completion
const completeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many requests, please wait.',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  try {
    await new Promise((resolve, reject) => {
      completeRateLimit(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    return; // Rate limit response already sent
  }

  try {
    // Check if already installed (prevent re-installation attacks)
    const isInstalled = await settingsService.isInstalled();
    if (isInstalled) {
      return res.status(403).json({
        message: 'Forum is already installed. Re-installation is not allowed.',
        code: 'ALREADY_INSTALLED'
      });
    }

    // Verify all steps were completed
    const status = await settingsService.getInstallationStatus();
    if (!status?.dbConfigured || !status?.adminCreated || !status?.siteConfigured) {
      return res.status(400).json({
        message: 'Please complete all installation steps before finalizing.',
        code: 'INCOMPLETE_STEPS',
        completedSteps: {
          database: status?.dbConfigured || false,
          admin: status?.adminCreated || false,
          siteConfig: status?.siteConfigured || false,
          forums: status?.forumsCreated || false
        }
      });
    }

    // Verify admin user exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminExists) {
      return res.status(400).json({
        message: 'Admin account not found. Please complete step 2.',
        code: 'NO_ADMIN_USER'
      });
    }

    // Mark installation as complete
    await settingsService.updateInstallationStatus({
      isInstalled: true,
      installationStep: 5,
      installationDate: new Date(),
      dbConfigured: true,
      adminCreated: true,
      siteConfigured: true,
      forumsCreated: true
    });

    // Set final site settings
    await settingsService.saveSiteSetting('installation_completed', 'true');
    await settingsService.saveSiteSetting('installation_date', new Date().toISOString());
    await settingsService.saveSiteSetting('installation_version', '1.0.0');

    // Log installation completion (for audit)
    console.log(`Installation completed at ${new Date().toISOString()} by admin: ${adminExists.username}`);

    res.status(200).json({
      message: 'Installation completed successfully!',
      redirectTo: '/login'
    });

  } catch (error) {
    console.error('Error completing installation:', error);
    res.status(500).json({
      message: 'Installation completion failed. Please try again.',
      code: 'COMPLETION_ERROR'
    });
  }
}
