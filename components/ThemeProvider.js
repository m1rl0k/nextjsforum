import { useEffect, useState } from 'react';
import Head from 'next/head';

const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState({
    // Default vBulletin colors to prevent flash
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
    logoUrl: ''
  });

  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const res = await fetch('/api/theme-settings');
        if (res.ok) {
          const data = await res.json();
          setThemeSettings(data);
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      }
    };

    loadThemeSettings();
  }, []);

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

  return (
    <>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: generateCSS(themeSettings) }} />
        {themeSettings.logoUrl && (
          <link rel="icon" href={themeSettings.faviconUrl || '/favicon.ico'} />
        )}
        <title>{themeSettings.siteName || 'NextJS Forum'}</title>
        <meta name="description" content={themeSettings.siteDescription || 'A modern forum built with Next.js'} />
      </Head>
      {children}
    </>
  );
};

export default ThemeProvider;
