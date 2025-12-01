import prisma from '../lib/prisma';

export async function getServerSideProps({ res }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Get custom robots rules from SEO settings
  let customRules = '';
  
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'seo_robotsTxt' }
    });
    if (setting?.value) {
      customRules = setting.value;
    }
  } catch (e) {
    console.error('Failed to get robots.txt settings:', e);
  }

  // Default robots.txt content
  const robotsTxt = `# Robots.txt for ${baseUrl}
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /moderation/
Disallow: /api/
Disallow: /install/
Disallow: /_next/

# Disallow user actions
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password

# Allow search engines to access the sitemap
Sitemap: ${baseUrl}/sitemap.xml

${customRules ? `# Custom rules\n${customRules}` : ''}
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(robotsTxt);
  res.end();

  return { props: {} };
}

export default function Robots() {
  return null;
}

