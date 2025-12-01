import Head from 'next/head';
import { useTheme } from './ThemeProvider';

/**
 * SEO Component - Handles meta tags, Open Graph, and Twitter Cards
 * 
 * @param {string} title - Page title (will be appended with site name)
 * @param {string} description - Page description for meta and OG
 * @param {string} keywords - Comma-separated keywords
 * @param {string} image - OG/Twitter image URL
 * @param {string} url - Canonical URL
 * @param {string} type - OG type (website, article, profile)
 * @param {object} article - Article metadata (author, publishedTime, modifiedTime, tags)
 * @param {object} profile - Profile metadata (username, firstName, lastName)
 * @param {boolean} noindex - Set to true to prevent indexing
 * @param {object} seoSettings - Override site-wide SEO settings
 */
const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  article,
  profile,
  noindex = false,
  seoSettings: overrideSettings
}) => {
  const { themeSettings } = useTheme();
  
  // Merge settings with defaults
  const siteSettings = {
    siteName: themeSettings?.siteName || 'NextJS Forum',
    siteDescription: themeSettings?.siteDescription || 'A modern forum built with Next.js',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    defaultImage: '/og-image.png',
    twitterHandle: '',
    ...overrideSettings
  };

  // Build full title
  const fullTitle = title 
    ? `${title} - ${siteSettings.siteName}`
    : siteSettings.siteName;

  // Use page description or fall back to site description
  const metaDescription = description || siteSettings.siteDescription;

  // Build full URL
  const canonicalUrl = url 
    ? `${siteSettings.siteUrl}${url.startsWith('/') ? url : '/' + url}`
    : siteSettings.siteUrl;

  // Build image URL
  const ogImage = image 
    ? (image.startsWith('http') ? image : `${siteSettings.siteUrl}${image}`)
    : `${siteSettings.siteUrl}${siteSettings.defaultImage}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteSettings.siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Article-specific OG tags */}
      {type === 'article' && article && (
        <>
          {article.author && <meta property="article:author" content={article.author} />}
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.tags?.map((tag, i) => (
            <meta key={i} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Profile-specific OG tags */}
      {type === 'profile' && profile && (
        <>
          {profile.username && <meta property="profile:username" content={profile.username} />}
          {profile.firstName && <meta property="profile:first_name" content={profile.firstName} />}
          {profile.lastName && <meta property="profile:last_name" content={profile.lastName} />}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      {siteSettings.twitterHandle && (
        <>
          <meta name="twitter:site" content={siteSettings.twitterHandle} />
          <meta name="twitter:creator" content={siteSettings.twitterHandle} />
        </>
      )}

      {/* Favicon */}
      <link rel="icon" href={themeSettings?.faviconUrl || '/favicon.ico'} />
      <link rel="apple-touch-icon" href={themeSettings?.faviconUrl || '/favicon.ico'} />
    </Head>
  );
};

export default SEO;

