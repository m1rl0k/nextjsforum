import prisma from '../../lib/prisma';

/**
 * Generate XML sitemap for SEO
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Get all categories
    const categories = await prisma.category.findMany({
      select: { id: true, updatedAt: true }
    });

    // Get all active subjects
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true }
    });

    // Get recent threads (last 1000)
    const threads = await prisma.thread.findMany({
      where: { isLocked: false },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000
    });

    // Build sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Static pages -->
  <url>
    <loc>${baseUrl}/help</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Categories -->
  ${categories.map(cat => `
  <url>
    <loc>${baseUrl}/categories/${cat.id}</loc>
    <lastmod>${cat.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Subjects (Forums) -->
  ${subjects.map(subject => `
  <url>
    <loc>${baseUrl}/subjects/${subject.id}</loc>
    <lastmod>${subject.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- Threads -->
  ${threads.map(thread => `
  <url>
    <loc>${baseUrl}/threads/${thread.id}</loc>
    <lastmod>${thread.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(sitemap);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).end();
  }
}

