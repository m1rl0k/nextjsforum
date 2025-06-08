import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import settingsService from '../../../lib/settingsService';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get current template settings using hybrid service
      const settings = await settingsService.getThemeSettings();

      res.status(200).json({
        status: 'success',
        data: settings
      });
    } else if (req.method === 'POST') {
      // Update template settings
      const settings = req.body;

      // Validate settings
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: 'Invalid settings data' });
      }

      // Save settings using hybrid service
      await settingsService.saveThemeSettings(settings);

      res.status(200).json({
        status: 'success',
        message: 'Template settings updated successfully'
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin templates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

function generateCustomCSS(settings) {
  return `
/* Custom Theme CSS - Generated automatically */
:root {
  --primary-color: ${settings.primaryColor || '#007bff'};
  --secondary-color: ${settings.secondaryColor || '#6c757d'};
  --background-color: ${settings.backgroundColor || '#f8f9fa'};
  --text-color: ${settings.textColor || '#212529'};
  --link-color: ${settings.linkColor || '#007bff'};
  --header-background: ${settings.headerBackground || '#343a40'};
  --header-text: ${settings.headerText || '#ffffff'};
  --sidebar-background: ${settings.sidebarBackground || '#f8f9fa'};
  --border-color: ${settings.borderColor || '#dee2e6'};
  --button-radius: ${settings.buttonRadius || '4px'};
  --card-radius: ${settings.cardRadius || '8px'};
  --font-size: ${settings.fontSize || '14px'};
  --font-family: ${settings.fontFamily || 'system-ui, -apple-system, sans-serif'};
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--font-family);
  font-size: var(--font-size);
}

a {
  color: var(--link-color);
}

.button, button {
  border-radius: var(--button-radius);
  background-color: var(--primary-color);
}

.card, .category-block, .thread-item {
  border-radius: var(--card-radius);
  border-color: var(--border-color);
}

.nav {
  background-color: var(--header-background);
  color: var(--header-text);
}

.sidebar {
  background-color: var(--sidebar-background);
}

${settings.compactMode ? `
.thread-item {
  padding: 8px 12px;
}
.post {
  padding: 12px;
}
` : ''}

${!settings.showAvatars ? `
.avatar, .user-avatar {
  display: none;
}
` : ''}

${!settings.showSignatures ? `
.signature {
  display: none;
}
` : ''}

${settings.enableDarkMode ? `
@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1a1a1a;
    --text-color: #e0e0e0;
    --header-background: #2d2d2d;
    --sidebar-background: #2d2d2d;
    --border-color: #404040;
  }
}
` : ''}

/* Custom CSS */
${settings.customCSS || ''}
`;
}
