import settingsService from '../../../lib/settingsService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const status = await settingsService.getInstallationStatus();
    const isInstalled = await settingsService.isInstalled();

    res.status(200).json({
      isInstalled,
      installationStep: status?.installationStep || 1,
      dbConfigured: status?.dbConfigured || false,
      adminCreated: status?.adminCreated || false,
      siteConfigured: status?.siteConfigured || false,
      forumsCreated: status?.forumsCreated || false,
      version: status?.version || '1.0.0'
    });
  } catch (error) {
    console.error('Error getting installation status:', error);
    res.status(500).json({
      message: 'Error checking installation status',
      isInstalled: false,
      installationStep: 1
    });
  }
}
