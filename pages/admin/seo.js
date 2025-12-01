import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminSettings.module.css';

const SEOSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/seo', { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      setError('Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSuccess('✅ SEO settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.header}>
        <h1>SEO Settings</h1>
        <p>Manage search engine optimization and social sharing settings</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic SEO */}
        <div className={styles.section}>
          <h2>Basic SEO</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="siteTitle">Site Title Override</label>
            <input
              type="text"
              id="siteTitle"
              name="siteTitle"
              value={settings.siteTitle}
              onChange={handleChange}
              placeholder="Leave empty to use site name from settings"
            />
            <small>Override the default site name for SEO purposes</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="siteTitleSeparator">Title Separator</label>
            <input
              type="text"
              id="siteTitleSeparator"
              name="siteTitleSeparator"
              value={settings.siteTitleSeparator}
              onChange={handleChange}
              placeholder=" - "
            />
            <small>Character(s) between page title and site name (e.g., " - ", " | ")</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="metaDescription">Default Meta Description</label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={settings.metaDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Default description for pages without specific descriptions"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="metaKeywords">Default Meta Keywords</label>
            <input
              type="text"
              id="metaKeywords"
              name="metaKeywords"
              value={settings.metaKeywords}
              onChange={handleChange}
              placeholder="forum, community, discussion"
            />
            <small>Comma-separated keywords (note: most search engines ignore this)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="canonicalUrl">Canonical URL Base</label>
            <input
              type="url"
              id="canonicalUrl"
              name="canonicalUrl"
              value={settings.canonicalUrl}
              onChange={handleChange}
              placeholder="https://yourforum.com"
            />
            <small>Base URL for canonical tags (leave empty to auto-detect)</small>
          </div>
        </div>

        {/* Social Sharing */}
        <div className={styles.section}>
          <h2>Social Sharing (Open Graph)</h2>

          <div className={styles.formGroup}>
            <label htmlFor="ogImage">Default OG Image</label>
            <input
              type="text"
              id="ogImage"
              name="ogImage"
              value={settings.ogImage}
              onChange={handleChange}
              placeholder="/og-image.png"
            />
            <small>Default image for social sharing (1200x630 recommended)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="twitterHandle">Twitter Handle</label>
            <input
              type="text"
              id="twitterHandle"
              name="twitterHandle"
              value={settings.twitterHandle}
              onChange={handleChange}
              placeholder="@yourforum"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="twitterCardType">Twitter Card Type</label>
            <select
              id="twitterCardType"
              name="twitterCardType"
              value={settings.twitterCardType}
              onChange={handleChange}
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
            </select>
          </div>
        </div>

        {/* Search Engine Verification */}
        <div className={styles.section}>
          <h2>Search Engine Verification</h2>

          <div className={styles.formGroup}>
            <label htmlFor="googleVerification">Google Verification Code</label>
            <input
              type="text"
              id="googleVerification"
              name="googleVerification"
              value={settings.googleVerification}
              onChange={handleChange}
              placeholder="abc123..."
            />
            <small>Verification code from Google Search Console (just the code, not full meta tag)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bingVerification">Bing Verification Code</label>
            <input
              type="text"
              id="bingVerification"
              name="bingVerification"
              value={settings.bingVerification}
              onChange={handleChange}
              placeholder="ABC123..."
            />
          </div>
        </div>

        {/* Sitemap Settings */}
        <div className={styles.section}>
          <h2>Sitemap Settings</h2>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="enableSitemap"
                checked={settings.enableSitemap}
                onChange={handleChange}
              />
              Enable XML Sitemap
            </label>
            <small>Generate /sitemap.xml automatically</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sitemapChangefreq">Change Frequency</label>
            <select
              id="sitemapChangefreq"
              name="sitemapChangefreq"
              value={settings.sitemapChangefreq}
              onChange={handleChange}
            >
              <option value="always">Always</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sitemapPriority">Default Priority</label>
            <select
              id="sitemapPriority"
              name="sitemapPriority"
              value={settings.sitemapPriority}
              onChange={handleChange}
            >
              <option value="1.0">1.0 (Highest)</option>
              <option value="0.9">0.9</option>
              <option value="0.8">0.8</option>
              <option value="0.7">0.7 (Default)</option>
              <option value="0.6">0.6</option>
              <option value="0.5">0.5</option>
              <option value="0.4">0.4</option>
              <option value="0.3">0.3</option>
              <option value="0.2">0.2</option>
              <option value="0.1">0.1 (Lowest)</option>
            </select>
          </div>
        </div>

        {/* Structured Data */}
        <div className={styles.section}>
          <h2>Structured Data (Schema.org)</h2>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="enableStructuredData"
                checked={settings.enableStructuredData}
                onChange={handleChange}
              />
              Enable Structured Data
            </label>
            <small>Add JSON-LD structured data for better search results</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="organizationName">Organization Name</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={settings.organizationName}
              onChange={handleChange}
              placeholder="Your Forum Name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="organizationLogo">Organization Logo URL</label>
            <input
              type="text"
              id="organizationLogo"
              name="organizationLogo"
              value={settings.organizationLogo}
              onChange={handleChange}
              placeholder="/logo.png"
            />
          </div>
        </div>

        {/* Robots.txt */}
        <div className={styles.section}>
          <h2>Custom Robots.txt</h2>

          <div className={styles.formGroup}>
            <label htmlFor="robotsTxt">Custom Rules</label>
            <textarea
              id="robotsTxt"
              name="robotsTxt"
              value={settings.robotsTxt}
              onChange={handleChange}
              rows={6}
              placeholder="# Add custom robots.txt rules here
Disallow: /admin/
Disallow: /api/"
            />
            <small>Leave empty for default rules. This will be appended to auto-generated rules.</small>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save SEO Settings'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default SEOSettings;

