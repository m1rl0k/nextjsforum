import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

// Default SEO settings
const defaultSeoSettings = {
  siteTitle: '',
  siteTitleSeparator: ' - ',
  metaDescription: '',
  metaKeywords: '',
  ogImage: '/og-image.png',
  twitterHandle: '',
  twitterCardType: 'summary_large_image',
  googleVerification: '',
  bingVerification: '',
  enableSitemap: true,
  sitemapChangefreq: 'daily',
  sitemapPriority: '0.7',
  robotsTxt: '',
  canonicalUrl: '',
  enableStructuredData: true,
  organizationName: '',
  organizationLogo: ''
};

export default async function handler(req, res) {
  try {
    // Verify admin authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Fetch SEO settings
      const settings = await prisma.siteSettings.findMany({
        where: {
          category: 'seo'
        }
      });

      // Convert to object
      const seoSettings = { ...defaultSeoSettings };
      settings.forEach(setting => {
        const key = setting.key.replace('seo_', '');
        let value = setting.value;
        
        // Parse booleans
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        
        seoSettings[key] = value;
      });

      return res.status(200).json({
        status: 'success',
        settings: seoSettings
      });

    } else if (req.method === 'PUT' || req.method === 'POST') {
      // Save SEO settings
      const newSettings = req.body;

      if (!newSettings || typeof newSettings !== 'object') {
        return res.status(400).json({ message: 'Invalid settings data' });
      }

      // Save each setting
      for (const [key, value] of Object.entries(newSettings)) {
        if (defaultSeoSettings.hasOwnProperty(key)) {
          const dbKey = `seo_${key}`;
          const stringValue = typeof value === 'boolean' ? String(value) : String(value || '');

          await prisma.siteSettings.upsert({
            where: { key: dbKey },
            update: {
              value: stringValue,
              category: 'seo',
              updatedAt: new Date()
            },
            create: {
              key: dbKey,
              value: stringValue,
              category: 'seo',
              type: typeof value === 'boolean' ? 'boolean' : 'string',
              description: `SEO setting: ${key}`
            }
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'SEO settings saved successfully'
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('SEO settings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

