import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Default theme settings - Classic vBulletin colors
    const defaultSettings = {
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
    };

    // Try to read existing settings
    let settings = defaultSettings;
    try {
      const settingsPath = path.join(process.cwd(), 'config', 'template-settings.json');
      if (fs.existsSync(settingsPath)) {
        const fileContent = fs.readFileSync(settingsPath, 'utf8');
        const savedSettings = JSON.parse(fileContent);
        settings = { ...defaultSettings, ...savedSettings };
      }
    } catch (error) {
      console.log('Using default theme settings');
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error loading theme settings:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
}
