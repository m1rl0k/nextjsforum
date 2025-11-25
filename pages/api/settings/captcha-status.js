import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let enabled = false;

    try {
      const setting = await prisma.siteSettings.findUnique({
        where: { key: 'captcha_enabled' }
      });
      enabled = setting?.value === 'true';
    } catch (e) {
      // Default to disabled
    }

    res.status(200).json({ enabled });
  } catch (error) {
    console.error('Error checking captcha status:', error);
    res.status(200).json({ enabled: false });
  }
}
