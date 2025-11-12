import prisma from '../../lib/prisma';

/**
 * Public API endpoint to get basic site information
 * Used by Navigation and other components to display site name, description, etc.
 * This is separate from theme settings to avoid duplication
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch site settings from database
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ['site_name', 'site_description', 'admin_email']
        }
      }
    });

    // Convert array to object
    const siteInfo = {
      siteName: 'NextJS Forum',
      siteDescription: 'A modern forum built with Next.js',
      adminEmail: ''
    };

    settings.forEach(setting => {
      if (setting.key === 'site_name') {
        siteInfo.siteName = setting.value;
      } else if (setting.key === 'site_description') {
        siteInfo.siteDescription = setting.value;
      } else if (setting.key === 'admin_email') {
        siteInfo.adminEmail = setting.value;
      }
    });

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json(siteInfo);
  } catch (error) {
    console.error('Error fetching site info:', error);
    
    // Return defaults on error
    return res.status(200).json({
      siteName: 'NextJS Forum',
      siteDescription: 'A modern forum built with Next.js',
      adminEmail: ''
    });
  }
}

