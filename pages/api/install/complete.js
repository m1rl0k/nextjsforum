import settingsService from '../../../lib/settingsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if already installed
    const isInstalled = await settingsService.isInstalled();
    if (isInstalled) {
      return res.status(400).json({ message: 'Forum is already installed' });
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

    res.status(200).json({ 
      message: 'Installation completed successfully!',
      redirectTo: '/login'
    });

  } catch (error) {
    console.error('Error completing installation:', error);
    res.status(500).json({ 
      message: error.message || 'Installation completion failed'
    });
  }
}
