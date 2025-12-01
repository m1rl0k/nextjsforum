import prisma from '../lib/prisma';

function generateSiteMap(baseUrl, pages, changefreq, priority) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  ${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq || changefreq}</changefreq>
    <priority>${page.priority || priority}</priority>
  </url>`).join('')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Get SEO settings
  let changefreq = 'daily';
  let priority = '0.7';
  let sitemapEnabled = true;
  
  try {
    const seoSettings = await prisma.siteSettings.findMany({
      where: { category: 'seo' }
    });
    
    seoSettings.forEach(s => {
      if (s.key === 'seo_enableSitemap') sitemapEnabled = s.value === 'true';
      if (s.key === 'seo_sitemapChangefreq') changefreq = s.value;
      if (s.key === 'seo_sitemapPriority') priority = s.value;
    });
  } catch (e) {
    console.error('Failed to get SEO settings for sitemap:', e);
  }

  // If sitemap is disabled, return 404
  if (!sitemapEnabled) {
    res.statusCode = 404;
    res.end();
    return { props: {} };
  }

  const pages = [];

  try {
    // Get all active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true }
    });
    
    categories.forEach(cat => {
      pages.push({
        url: `/category/${cat.slug || cat.id}`,
        lastmod: cat.updatedAt?.toISOString(),
        priority: '0.8'
      });
    });

    // Get all active forums/subjects
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true }
    });
    
    subjects.forEach(sub => {
      pages.push({
        url: `/forum/${sub.slug || sub.id}`,
        lastmod: sub.updatedAt?.toISOString(),
        priority: '0.7'
      });
    });

    // Get recent threads (last 1000)
    const threads = await prisma.thread.findMany({
      where: { 
        isVisible: true,
        isApproved: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
      select: { id: true, slug: true, updatedAt: true }
    });
    
    threads.forEach(thread => {
      pages.push({
        url: `/threads/${thread.slug || thread.id}`,
        lastmod: thread.updatedAt?.toISOString(),
        priority: '0.6'
      });
    });

    // Get public user profiles
    const users = await prisma.user.findMany({
      where: { isBanned: false },
      take: 500,
      select: { id: true, username: true, updatedAt: true }
    });
    
    users.forEach(user => {
      pages.push({
        url: `/users/${user.username}`,
        lastmod: user.updatedAt?.toISOString(),
        changefreq: 'weekly',
        priority: '0.4'
      });
    });

    // Static pages
    pages.push(
      { url: '/login', priority: '0.3', changefreq: 'monthly' },
      { url: '/register', priority: '0.3', changefreq: 'monthly' }
    );

  } catch (error) {
    console.error('Sitemap generation error:', error);
  }

  // Generate sitemap XML
  const sitemap = generateSiteMap(baseUrl, pages, changefreq, priority);

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  // This component doesn't render anything
  return null;
}

