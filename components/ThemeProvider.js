import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

// Cache configuration
const CACHE_KEY = 'theme_settings_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DARK_MODE_KEY = 'dark_mode_preference';

// Default vBulletin theme settings
const defaultThemeSettings = {
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
  siteName: 'NextJS Forum',
  logoUrl: '',
  enableDarkMode: false
};

// Dark mode color overrides for vBulletin style
const darkModeColors = {
  primaryColor: '#4A6FA5',
  secondaryColor: '#5B82B8',
  backgroundColor: '#1a1d21',
  textColor: '#e0e0e0',
  linkColor: '#6fa8dc',
  linkHoverColor: '#9fc5e8',
  headerBackground: '#252a30',
  headerText: '#FFFFFF',
  navbarBackground: '#2d333b',
  navbarText: '#e0e0e0',
  categoryHeaderBackground: '#3a4149',
  categoryHeaderText: '#FFFFFF',
  subjectHeaderBackground: '#2d333b',
  subjectHeaderText: '#e0e0e0',
  threadBackground: '#22272e',
  threadAltBackground: '#2d333b',
  threadHoverBackground: '#3a4149',
  postHeaderBackground: '#2d333b',
  postBodyBackground: '#22272e',
  postFooterBackground: '#2d333b',
  sidebarBackground: '#252a30',
  borderColor: '#444c56',
  buttonBackground: '#4A6FA5',
  buttonText: '#FFFFFF',
  buttonHoverBackground: '#5B82B8',
  inputBackground: '#2d333b',
  inputText: '#e0e0e0',
  inputBorderColor: '#444c56'
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper to get cached settings
const getCachedSettings = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

// Helper to set cached settings
const setCachedSettings = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Storage full or unavailable
  }
};

// Helper to get dark mode preference
const getDarkModePreference = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) return saved === 'true';
    // Check system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false;
  } catch {
    return false;
  }
};

const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState(() => {
    // Initialize with cached settings if available
    const cached = getCachedSettings();
    return cached ? { ...defaultThemeSettings, ...cached } : defaultThemeSettings;
  });
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dark mode preference on mount
  useEffect(() => {
    setDarkMode(getDarkModePreference());
  }, []);

  const loadThemeSettings = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);

      // Check if we're in preview mode
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const isPreview = urlParams.get('preview') === 'true';

        if (isPreview) {
          const previewTheme = sessionStorage.getItem('previewTheme');
          if (previewTheme) {
            const previewSettings = JSON.parse(previewTheme);
            setThemeSettings(prev => ({ ...prev, ...previewSettings }));
            setLoading(false);
            return;
          }
        }
      }

      // Use cache if available and not forcing refresh
      if (!forceRefresh) {
        const cached = getCachedSettings();
        if (cached) {
          setThemeSettings(prev => ({ ...prev, ...cached }));
          setLoading(false);
          // Still fetch in background to update cache (stale-while-revalidate)
          fetchAndCacheSettings();
          return;
        }
      }

      await fetchAndCacheSettings();
    } catch (err) {
      console.error('Failed to load theme settings:', err);
      setError('Failed to load theme settings');
      setLoading(false);
    }
  }, []);

  const fetchAndCacheSettings = async () => {
    try {
      const res = await fetch('/api/theme-settings');
      if (res.ok) {
        const data = await res.json();
        setCachedSettings(data);
        setThemeSettings(prev => ({ ...prev, ...data }));
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to fetch theme settings:', err);
      setError('Failed to fetch theme settings');
    } finally {
      setLoading(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(DARK_MODE_KEY, String(newValue));
      }
      return newValue;
    });
  }, []);

  // Clear cache (useful when settings are updated)
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Refresh settings and clear cache
  const refreshThemeSettings = useCallback(async () => {
    clearCache();
    await loadThemeSettings(true);
  }, [clearCache, loadThemeSettings]);

  useEffect(() => {
    loadThemeSettings();
  }, [loadThemeSettings]);

  // Get effective theme colors (apply dark mode overrides if enabled)
  const getEffectiveColors = useCallback(() => {
    if (darkMode && themeSettings.enableDarkMode !== false) {
      return { ...themeSettings, ...darkModeColors };
    }
    return themeSettings;
  }, [darkMode, themeSettings]);

  // Apply theme styles using CSS custom properties
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const colors = getEffectiveColors();

    // Set dark mode class on html element
    if (darkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }

    // Apply CSS custom properties - Colors
    root.style.setProperty('--primary-color', colors.primaryColor);
    root.style.setProperty('--secondary-color', colors.secondaryColor);
    root.style.setProperty('--header-bg', colors.headerBackground || colors.headerBg);
    root.style.setProperty('--header-text', colors.headerText);
    root.style.setProperty('--navbar-bg', colors.navbarBackground || colors.primaryColor);
    root.style.setProperty('--navbar-text', colors.navbarText || colors.headerText);
    root.style.setProperty('--background-color', colors.backgroundColor);
    root.style.setProperty('--text-color', colors.textColor);
    root.style.setProperty('--link-color', colors.linkColor);
    root.style.setProperty('--link-hover-color', colors.linkHoverColor);
    root.style.setProperty('--button-bg', colors.buttonBackground || colors.buttonBg);
    root.style.setProperty('--button-text', colors.buttonText);
    root.style.setProperty('--button-hover-bg', colors.buttonHoverBackground || colors.buttonHoverBg);
    root.style.setProperty('--border-color', colors.borderColor);

    // Dark mode specific variables
    root.style.setProperty('--category-header-bg', colors.categoryHeaderBackground);
    root.style.setProperty('--category-header-text', colors.categoryHeaderText);
    root.style.setProperty('--subject-header-bg', colors.subjectHeaderBackground);
    root.style.setProperty('--subject-header-text', colors.subjectHeaderText);
    root.style.setProperty('--thread-bg', colors.threadBackground);
    root.style.setProperty('--thread-alt-bg', colors.threadAltBackground);
    root.style.setProperty('--thread-hover', colors.threadHoverBackground);
    root.style.setProperty('--post-header-bg', colors.postHeaderBackground);
    root.style.setProperty('--post-body-bg', colors.postBodyBackground);
    root.style.setProperty('--post-footer-bg', colors.postFooterBackground);
    root.style.setProperty('--sidebar-bg', colors.sidebarBackground);
    root.style.setProperty('--input-bg', colors.inputBackground);
    root.style.setProperty('--input-text', colors.inputText);
    root.style.setProperty('--input-border', colors.inputBorderColor);

    // Apply Layout Variables
    root.style.setProperty('--header-height', themeSettings.headerHeight || '60px');
    root.style.setProperty('--header-padding', themeSettings.headerPadding || '0 20px');
    root.style.setProperty('--logo-max-height', themeSettings.logoMaxHeight || '40px');
    root.style.setProperty('--container-max-width', themeSettings.containerMaxWidth || '1200px');
    root.style.setProperty('--content-padding', themeSettings.contentPadding || '20px');
    root.style.setProperty('--button-radius', themeSettings.buttonRadius || '4px');
    root.style.setProperty('--card-radius', themeSettings.cardRadius || '0px');
    root.style.setProperty('--border-width', themeSettings.borderWidth || '1px');

    // Apply Shadow Style
    const shadowStyles = {
      none: 'none',
      subtle: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 2px 8px rgba(0,0,0,0.15)',
      strong: '0 4px 12px rgba(0,0,0,0.2)'
    };
    root.style.setProperty('--box-shadow', shadowStyles[themeSettings.shadowStyle] || shadowStyles.none);

    // Apply body styles
    document.body.style.fontFamily = themeSettings.fontFamily || 'Verdana, Arial, sans-serif';
    document.body.style.fontSize = themeSettings.fontSize || '13px';
    document.body.style.backgroundColor = colors.backgroundColor || '#E0E8F5';
    document.body.style.color = colors.textColor || '#000000';
  }, [themeSettings, darkMode, getEffectiveColors]);



  const generateCSS = (settings) => {
    if (!settings) return '';

    return `
      /* Override CSS variables with theme settings */
      :root {
        --primary-color: ${settings.primaryColor || '#2B4F81'} !important;
        --secondary-color: ${settings.secondaryColor || '#4C76B2'} !important;
        --header-bg: ${settings.headerBackground || '#2B4F81'} !important;
        --header-text: ${settings.headerText || '#FFFFFF'} !important;
        --navbar-bg: ${settings.navbarBackground || '#4C76B2'} !important;
        --navbar-text: ${settings.navbarText || '#FFFFFF'} !important;
        --category-header-bg: ${settings.categoryHeaderBackground || '#738FBF'} !important;
        --category-header-text: ${settings.categoryHeaderText || '#FFFFFF'} !important;
        --subject-header-bg: ${settings.subjectHeaderBackground || '#DEE4F2'} !important;
        --subject-header-text: ${settings.subjectHeaderText || '#000000'} !important;
        --thread-alt-bg: ${settings.threadAltBackground || '#F5F5FF'} !important;
        --thread-bg: ${settings.threadBackground || '#FFFFFF'} !important;
        --thread-hover: ${settings.threadHoverBackground || '#E8EFFD'} !important;
        --border-color: ${settings.borderColor || '#94A3C4'} !important;
        --link-color: ${settings.linkColor || '#006699'} !important;
        --link-hover-color: ${settings.linkHoverColor || '#0088CC'} !important;
        --button-bg: ${settings.buttonBackground || '#4C76B2'} !important;
        --button-text: ${settings.buttonText || '#FFFFFF'} !important;
        --button-hover-bg: ${settings.buttonHoverBackground || '#0088CC'} !important;
        --post-header-bg: ${settings.postHeaderBackground || '#DEE4F2'} !important;
        --post-body-bg: ${settings.postBodyBackground || '#FFFFFF'} !important;
        --post-footer-bg: ${settings.postFooterBackground || '#F5F5FF'} !important;
        --sidebar-bg: ${settings.sidebarBackground || '#E0E8F5'} !important;
        --input-bg: ${settings.inputBackground || '#FFFFFF'} !important;
        --input-text: ${settings.inputText || '#000000'} !important;
        --input-border: ${settings.inputBorderColor || '#94A3C4'} !important;
      }

      /* Apply font settings to body */
      body {
        font-family: ${settings.fontFamily || 'Verdana, Arial, sans-serif'} !important;
        font-size: ${settings.fontSize || '13px'} !important;
        color: ${settings.textColor || '#000000'} !important;
        background-color: ${settings.backgroundColor || '#E0E8F5'} !important;
      }

      /* Override link colors */
      a {
        color: var(--link-color) !important;
      }

      a:hover {
        color: var(--link-hover-color) !important;
      }

      /* Button styling - keep classic look, no rounded corners unless specified */
      .button {
        background-color: var(--button-bg) !important;
        color: var(--button-text) !important;
        border-radius: ${settings.buttonRadius === '0px' ? '0px' : (settings.buttonRadius || '0px')} !important;
        border: 1px solid var(--border-color) !important;
      }

      .button:hover {
        background-color: var(--button-hover-bg) !important;
        color: var(--button-text) !important;
        text-decoration: none !important;
      }

      /* Form elements with proper contrast */
      .form-input, .form-textarea, .form-select, input, textarea, select {
        background-color: var(--input-bg) !important;
        color: var(--input-text) !important;
        border-color: var(--input-border) !important;
      }

      .form-input:focus, .form-textarea:focus, .form-select:focus,
      input:focus, textarea:focus, select:focus {
        border-color: var(--primary-color) !important;
        outline: none !important;
        box-shadow: 0 0 3px rgba(43, 79, 129, 0.3) !important;
      }

      /* Container background */
      .container {
        background-color: ${settings.backgroundColor || '#FFFFFF'} !important;
      }

      /* Basic navigation theming - let CSS modules handle the details */
      .nav {
        background-color: var(--header-bg) !important;
        color: var(--header-text) !important;
      }

      /* Admin panel theming - ensure proper contrast */
      .adminNav {
        background-color: var(--header-bg) !important;
        color: var(--header-text) !important;
      }

      .adminNav a {
        color: var(--header-text) !important;
      }

      .adminNav a:hover {
        color: var(--header-text) !important;
        opacity: 0.8;
      }

      /* Admin sidebar theming */
      .adminSidebar {
        background-color: var(--sidebar-bg) !important;
        border-color: var(--border-color) !important;
        color: var(--subject-header-text) !important;
      }

      .adminSidebar h2 {
        color: var(--subject-header-text) !important;
      }

      .adminSidebar a {
        color: var(--subject-header-text) !important;
      }

      .adminSidebar a:hover {
        color: var(--link-color) !important;
      }

      /* Login/Register page theming */
      .loginContainer, .registerContainer {
        background-color: ${settings.backgroundColor || '#E0E8F5'} !important;
      }

      .loginForm, .registerForm {
        background-color: ${settings.backgroundColor || '#FFFFFF'} !important;
        border-color: var(--border-color) !important;
      }

      /* Enhanced form elements theming */
      .loginForm .form-input, .registerForm .form-input,
      .loginContainer input, .registerContainer input {
        background-color: var(--input-bg) !important;
        color: var(--input-text) !important;
        border-color: var(--input-border) !important;
      }

      .loginForm .form-input:focus, .registerForm .form-input:focus,
      .loginContainer input:focus, .registerContainer input:focus {
        border-color: var(--primary-color) !important;
        box-shadow: 0 0 3px rgba(43, 79, 129, 0.3) !important;
      }

      /* Admin content theming */
      .adminContent {
        background-color: ${settings.backgroundColor || '#FFFFFF'} !important;
        color: ${settings.textColor || '#000000'} !important;
      }

      ${settings.compactMode ? `
        .thread-row, .subject-row {
          padding: 8px 12px !important;
        }
        .post {
          padding: 12px !important;
        }
        .post-content {
          padding: 12px !important;
        }
      ` : ''}

      ${!settings.showAvatars ? `
        .avatar, .user-avatar, .post-avatar {
          display: none !important;
        }
      ` : ''}

      ${!settings.showSignatures ? `
        .signature, .post-signature {
          display: none !important;
        }
      ` : ''}

      ${settings.enableDarkMode ? `
        @media (prefers-color-scheme: dark) {
          :root {
            --primary-color: #4A90E2 !important;
            --secondary-color: #6BA3F5 !important;
            --header-bg: #1a1a1a !important;
            --header-text: #ffffff !important;
            --navbar-bg: #2d2d2d !important;
            --navbar-text: #ffffff !important;
            --category-header-bg: #3d3d3d !important;
            --category-header-text: #ffffff !important;
            --subject-header-bg: #2a2a2a !important;
            --subject-header-text: #e0e0e0 !important;
            --thread-bg: #1e1e1e !important;
            --thread-alt-bg: #252525 !important;
            --thread-hover: #333333 !important;
            --border-color: #404040 !important;
            --link-color: #4A90E2 !important;
            --link-hover-color: #6BA3F5 !important;
            --button-bg: #4A90E2 !important;
            --button-text: #ffffff !important;
            --button-hover-bg: #6BA3F5 !important;
            --post-header-bg: #2a2a2a !important;
            --post-body-bg: #1e1e1e !important;
            --post-footer-bg: #252525 !important;
            --sidebar-bg: #2d2d2d !important;
            --input-bg: #2a2a2a !important;
            --input-text: #e0e0e0 !important;
            --input-border: #404040 !important;
          }

          body {
            background-color: #1a1a1a !important;
            color: #e0e0e0 !important;
          }

          .card, .category-block, .post, .subject-row, .thread-row,
          .loginForm, .registerForm {
            background-color: #1e1e1e !important;
            color: #e0e0e0 !important;
            border-color: #404040 !important;
          }

          .container {
            background-color: #1a1a1a !important;
          }
        }
      ` : ''}

      /* Custom CSS */
      ${settings.customCSS || ''}
    `;
  };

  const contextValue = {
    themeSettings,
    setThemeSettings,
    refreshThemeSettings,
    darkMode,
    toggleDarkMode,
    loading,
    error,
    clearCache
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
