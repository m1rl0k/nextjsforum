import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../components/ThemeProvider';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../../../styles/AdminTemplates.module.css';

const AdminTemplates = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { refreshThemeSettings } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('colors');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/admin/templates');
      return;
    }

    if (user?.role !== 'ADMIN' && !loading) {
      router.push('/');
      return;
    }

    fetchSettings();
  }, [user, isAuthenticated, loading]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/templates', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (res.ok) {
        setSettings(data.data);
      } else {
        setError('Failed to load template settings');
      }
    } catch (err) {
      setError('Failed to load template settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLivePreview = () => {
    // Save current settings to sessionStorage
    sessionStorage.setItem('previewTheme', JSON.stringify(settings));
    // Open forum in new tab
    window.open('/?preview=true', '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Template settings saved successfully! Changes applied.');
        // Refresh theme settings to apply changes immediately
        if (refreshThemeSettings) {
          await refreshThemeSettings();
        }
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('⚠️ Are you sure you want to reset all template settings to defaults? This will overwrite all your current customizations.')) {
      setMessage('');
      setError('');
      setSettings({
        theme: 'classic',
        primaryColor: '#2B4F81',
        secondaryColor: '#4C76B2',
        backgroundColor: '#E0E8F5',
        textColor: '#000000',
        linkColor: '#006699',
        linkHoverColor: '#0088CC',
        headerBackground: '#2B4F81',
        headerText: '#FFFFFF',
        navbarBackground: '#4C76B2',
        navbarText: '#FFFFFF',
        categoryHeaderBackground: '#738FBF',
        categoryHeaderText: '#FFFFFF',
        subjectHeaderBackground: '#DEE4F2',
        subjectHeaderText: '#000000',
        threadBackground: '#FFFFFF',
        threadAltBackground: '#F5F5FF',
        threadHoverBackground: '#E8EFFD',
        postHeaderBackground: '#DEE4F2',
        postBodyBackground: '#FFFFFF',
        postFooterBackground: '#F5F5FF',
        sidebarBackground: '#E0E8F5',
        borderColor: '#94A3C4',
        buttonBackground: '#4C76B2',
        buttonText: '#FFFFFF',
        buttonHoverBackground: '#0088CC',
        inputBackground: '#FFFFFF',
        inputText: '#000000',
        inputBorderColor: '#94A3C4',
        buttonRadius: '0px',
        cardRadius: '0px',
        fontSize: '13px',
        fontFamily: 'Verdana, Arial, sans-serif',
        customCSS: '',
        logoUrl: '',
        faviconUrl: '/favicon.ico',
        siteName: 'NextJS Forum',
        siteDescription: 'A modern forum built with Next.js',
        footerText: 'Powered by NextJS Forum',
        enableDarkMode: false,
        compactMode: false,
        showAvatars: true,
        showSignatures: true,
        threadsPerPage: 20,
        postsPerPage: 10
      });
      setMessage('✅ Settings reset to defaults. Click "Save Theme Settings" to apply.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading template settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1>Template & Styling</h1>
              <p>Customize the appearance and layout of your forum.</p>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={handleLivePreview}
                className={styles.previewButton}
              >
                👁️ Live Preview
              </button>
              <button
                type="button"
                onClick={() => window.open('/', '_blank')}
                className={styles.previewButton}
              >
                🔗 Open Forum
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'colors' ? styles.active : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            Colors & Theme
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'layout' ? styles.active : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            Layout & Typography
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'branding' ? styles.active : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            Branding
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'advanced' ? styles.active : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {activeTab === 'colors' && (
            <div className={styles.section}>
              <h2>Colors & Theme</h2>

              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Basic Colors</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="primaryColor">Primary Color</label>
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={settings.primaryColor || '#2B4F81'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="secondaryColor">Secondary Color</label>
                  <input
                    type="color"
                    id="secondaryColor"
                    name="secondaryColor"
                    value={settings.secondaryColor || '#4C76B2'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="backgroundColor">Page Background</label>
                  <input
                    type="color"
                    id="backgroundColor"
                    name="backgroundColor"
                    value={settings.backgroundColor || '#E0E8F5'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="textColor">Text Color</label>
                  <input
                    type="color"
                    id="textColor"
                    name="textColor"
                    value={settings.textColor || '#000000'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Header & Navigation</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="headerBackground">Header Background</label>
                  <input
                    type="color"
                    id="headerBackground"
                    name="headerBackground"
                    value={settings.headerBackground || '#2B4F81'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="headerText">Header Text</label>
                  <input
                    type="color"
                    id="headerText"
                    name="headerText"
                    value={settings.headerText || '#FFFFFF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="navbarBackground">Navbar Background</label>
                  <input
                    type="color"
                    id="navbarBackground"
                    name="navbarBackground"
                    value={settings.navbarBackground || '#4C76B2'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="navbarText">Navbar Text</label>
                  <input
                    type="color"
                    id="navbarText"
                    name="navbarText"
                    value={settings.navbarText || '#FFFFFF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Links & Buttons</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="linkColor">Link Color</label>
                  <input
                    type="color"
                    id="linkColor"
                    name="linkColor"
                    value={settings.linkColor || '#006699'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="linkHoverColor">Link Hover Color</label>
                  <input
                    type="color"
                    id="linkHoverColor"
                    name="linkHoverColor"
                    value={settings.linkHoverColor || '#0088CC'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="buttonBackground">Button Background</label>
                  <input
                    type="color"
                    id="buttonBackground"
                    name="buttonBackground"
                    value={settings.buttonBackground || '#4C76B2'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="buttonText">Button Text</label>
                  <input
                    type="color"
                    id="buttonText"
                    name="buttonText"
                    value={settings.buttonText || '#FFFFFF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Forum Elements</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="categoryHeaderBackground">Category Header</label>
                  <input
                    type="color"
                    id="categoryHeaderBackground"
                    name="categoryHeaderBackground"
                    value={settings.categoryHeaderBackground || '#738FBF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="categoryHeaderText">Category Header Text</label>
                  <input
                    type="color"
                    id="categoryHeaderText"
                    name="categoryHeaderText"
                    value={settings.categoryHeaderText || '#FFFFFF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="threadBackground">Thread Background</label>
                  <input
                    type="color"
                    id="threadBackground"
                    name="threadBackground"
                    value={settings.threadBackground || '#FFFFFF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="threadAltBackground">Thread Alt Background</label>
                  <input
                    type="color"
                    id="threadAltBackground"
                    name="threadAltBackground"
                    value={settings.threadAltBackground || '#F5F5FF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="sidebarBackground">Sidebar Background</label>
                  <input
                    type="color"
                    id="sidebarBackground"
                    name="sidebarBackground"
                    value={settings.sidebarBackground || '#E0E8F5'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="borderColor">Border Color</label>
                  <input
                    type="color"
                    id="borderColor"
                    name="borderColor"
                    value={settings.borderColor || '#94A3C4'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Form Elements</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="inputBackground">Input Background</label>
                  <input
                    type="color"
                    id="inputBackground"
                    name="inputBackground"
                    value={settings.inputBackground || '#FFFFFF'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="inputText">Input Text</label>
                  <input
                    type="color"
                    id="inputText"
                    name="inputText"
                    value={settings.inputText || '#000000'}
                    onChange={handleInputChange}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="enableDarkMode"
                    checked={settings.enableDarkMode || false}
                    onChange={handleInputChange}
                  />
                  Enable automatic dark mode support
                </label>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className={styles.section}>
              <h2>Branding</h2>

              <div className={styles.infoBox} style={{
                background: '#e3f2fd',
                border: '1px solid #90caf9',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#1565c0'
              }}>
                ℹ️ <strong>Note:</strong> Site name and description are managed in <a href="/admin/settings" style={{ color: '#1565c0', textDecoration: 'underline' }}>Site Settings</a>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="logoEnabled"
                    checked={settings.logoEnabled || false}
                    onChange={handleInputChange}
                  />
                  Enable custom logo (disabled by default)
                </label>
              </div>

              {settings.logoEnabled && (
                <div className={styles.formGroup}>
                  <label htmlFor="logoUrl">Logo URL</label>
                  <input
                    type="url"
                    id="logoUrl"
                    name="logoUrl"
                    value={settings.logoUrl || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="https://example.com/logo.png"
                  />
                  <small className={styles.helpText}>
                    Logo will be displayed in the navigation bar and match theme colors consistently.
                  </small>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="footerText">Footer Text</label>
                <input
                  type="text"
                  id="footerText"
                  name="footerText"
                  value={settings.footerText || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Powered by NextJS Forum"
                />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className={styles.section}>
              <h2>Advanced Settings</h2>

              <div className={styles.formGroup}>
                <label htmlFor="customCSS">Custom CSS</label>
                <textarea
                  id="customCSS"
                  name="customCSS"
                  value={settings.customCSS || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="10"
                  placeholder="/* Add your custom CSS here */"
                />
                <small className={styles.helpText}>
                  Add custom CSS to override default styles. Use with caution.
                </small>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="threadsPerPage">Threads per Page</label>
                  <input
                    type="number"
                    id="threadsPerPage"
                    name="threadsPerPage"
                    value={settings.threadsPerPage || 20}
                    onChange={handleInputChange}
                    className={styles.input}
                    min="5"
                    max="100"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="postsPerPage">Posts per Page</label>
                  <input
                    type="number"
                    id="postsPerPage"
                    name="postsPerPage"
                    value={settings.postsPerPage || 10}
                    onChange={handleInputChange}
                    className={styles.input}
                    min="5"
                    max="50"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className={styles.section}>
              <h2>Layout & Typography</h2>

              <h3 style={{ marginBottom: '15px', marginTop: '0', color: '#495057' }}>Typography</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="fontSize">Font Size</label>
                  <select
                    id="fontSize"
                    name="fontSize"
                    value={settings.fontSize || '14px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="12px">Small (12px)</option>
                    <option value="13px">Classic (13px)</option>
                    <option value="14px">Medium (14px)</option>
                    <option value="16px">Large (16px)</option>
                    <option value="18px">Extra Large (18px)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fontFamily">Font Family</label>
                  <select
                    id="fontFamily"
                    name="fontFamily"
                    value={settings.fontFamily || 'Verdana, Arial, sans-serif'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="Verdana, Arial, sans-serif">Verdana (Classic)</option>
                    <option value="system-ui, -apple-system, sans-serif">System Default</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="'Inter', sans-serif">Inter (Modern)</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Header Layout</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="headerHeight">Header Height</label>
                  <select
                    id="headerHeight"
                    name="headerHeight"
                    value={settings.headerHeight || '60px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="50px">Compact (50px)</option>
                    <option value="60px">Standard (60px)</option>
                    <option value="80px">Tall (80px)</option>
                    <option value="100px">Extra Tall (100px)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="headerLayout">Header Layout</label>
                  <select
                    id="headerLayout"
                    name="headerLayout"
                    value={settings.headerLayout || 'left'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="left">Logo Left, Nav Right</option>
                    <option value="center">Centered Logo & Nav</option>
                    <option value="stacked">Stacked (Logo Top, Nav Below)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="headerPadding">Header Padding</label>
                  <select
                    id="headerPadding"
                    name="headerPadding"
                    value={settings.headerPadding || '0 20px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="0 10px">Tight (10px)</option>
                    <option value="0 20px">Standard (20px)</option>
                    <option value="0 40px">Spacious (40px)</option>
                    <option value="0 60px">Extra Spacious (60px)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="logoMaxHeight">Logo Max Height</label>
                  <select
                    id="logoMaxHeight"
                    name="logoMaxHeight"
                    value={settings.logoMaxHeight || '40px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="30px">Small (30px)</option>
                    <option value="40px">Medium (40px)</option>
                    <option value="50px">Large (50px)</option>
                    <option value="60px">Extra Large (60px)</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Content Layout</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="containerMaxWidth">Container Max Width</label>
                  <select
                    id="containerMaxWidth"
                    name="containerMaxWidth"
                    value={settings.containerMaxWidth || '1200px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="960px">Narrow (960px)</option>
                    <option value="1200px">Standard (1200px)</option>
                    <option value="1400px">Wide (1400px)</option>
                    <option value="1600px">Extra Wide (1600px)</option>
                    <option value="100%">Full Width</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="contentPadding">Content Padding</label>
                  <select
                    id="contentPadding"
                    name="contentPadding"
                    value={settings.contentPadding || '20px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="10px">Tight (10px)</option>
                    <option value="20px">Standard (20px)</option>
                    <option value="30px">Comfortable (30px)</option>
                    <option value="40px">Spacious (40px)</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginBottom: '15px', marginTop: '25px', color: '#495057' }}>Border & Spacing</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="buttonRadius">Button Border Radius</label>
                  <select
                    id="buttonRadius"
                    name="buttonRadius"
                    value={settings.buttonRadius || '4px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="0px">Square (0px)</option>
                    <option value="2px">Subtle (2px)</option>
                    <option value="4px">Slightly Rounded (4px)</option>
                    <option value="6px">Rounded (6px)</option>
                    <option value="8px">Very Rounded (8px)</option>
                    <option value="12px">Extra Rounded (12px)</option>
                    <option value="50px">Pill Shape</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cardRadius">Card Border Radius</label>
                  <select
                    id="cardRadius"
                    name="cardRadius"
                    value={settings.cardRadius || '0px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="0px">Square (0px)</option>
                    <option value="4px">Slightly Rounded (4px)</option>
                    <option value="8px">Rounded (8px)</option>
                    <option value="12px">Very Rounded (12px)</option>
                    <option value="16px">Extra Rounded (16px)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="borderWidth">Border Width</label>
                  <select
                    id="borderWidth"
                    name="borderWidth"
                    value={settings.borderWidth || '1px'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="0px">None</option>
                    <option value="1px">Thin (1px)</option>
                    <option value="2px">Medium (2px)</option>
                    <option value="3px">Thick (3px)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="shadowStyle">Shadow Style</label>
                  <select
                    id="shadowStyle"
                    name="shadowStyle"
                    value={settings.shadowStyle || 'none'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="none">No Shadows</option>
                    <option value="subtle">Subtle Shadows</option>
                    <option value="medium">Medium Shadows</option>
                    <option value="strong">Strong Shadows</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="compactMode"
                    checked={settings.compactMode || false}
                    onChange={handleInputChange}
                  />
                  Enable compact mode (smaller spacing)
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="showAvatars"
                    checked={settings.showAvatars !== false}
                    onChange={handleInputChange}
                  />
                  Show user avatars
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="showSignatures"
                    checked={settings.showSignatures !== false}
                    onChange={handleInputChange}
                  />
                  Show user signatures
                </label>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? '💾 Saving...' : '💾 Save Theme Settings'}
            </button>
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => window.open('/', '_blank')}
            >
              🔗 Preview Forum
            </button>
            <button
              type="button"
              className={styles.resetButton}
              onClick={resetToDefaults}
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminTemplates;
