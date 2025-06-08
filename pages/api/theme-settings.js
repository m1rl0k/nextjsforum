import settingsService from '../../lib/settingsService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const settings = await settingsService.getThemeSettings();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error loading theme settings:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
}
