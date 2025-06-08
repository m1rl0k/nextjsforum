import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Verify admin authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (req.method === 'GET') {
      // Fetch current settings
      const settings = await prisma.moderationSettings.findFirst();
      
      res.status(200).json({
        settings: settings || {
          requireApproval: false,
          newUserPostCount: 5,
          autoModeration: false,
          profanityFilter: false,
          spamDetection: false,
          linkModeration: false,
          imageModeration: false,
          reportThreshold: 3,
          autoLockReports: false,
          moderationQueue: true,
          emailNotifications: true,
          bannedWords: '',
          allowedDomains: '',
          trustedUserPostCount: 50,
          autoApproveImages: false,
          maxLinksPerPost: 3,
          minPostLength: 10,
          maxPostLength: 10000
        }
      });

    } else if (req.method === 'POST') {
      // Save settings
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({ message: 'Settings data required' });
      }

      // Check if settings exist
      const existingSettings = await prisma.moderationSettings.findFirst();

      let savedSettings;
      if (existingSettings) {
        savedSettings = await prisma.moderationSettings.update({
          where: { id: existingSettings.id },
          data: {
            requireApproval: settings.requireApproval,
            newUserPostCount: settings.newUserPostCount,
            autoModeration: settings.autoModeration,
            profanityFilter: settings.profanityFilter,
            spamDetection: settings.spamDetection,
            linkModeration: settings.linkModeration,
            imageModeration: settings.imageModeration,
            reportThreshold: settings.reportThreshold,
            autoLockReports: settings.autoLockReports,
            moderationQueue: settings.moderationQueue,
            emailNotifications: settings.emailNotifications,
            bannedWords: settings.bannedWords,
            allowedDomains: settings.allowedDomains,
            trustedUserPostCount: settings.trustedUserPostCount,
            autoApproveImages: settings.autoApproveImages,
            maxLinksPerPost: settings.maxLinksPerPost,
            minPostLength: settings.minPostLength,
            maxPostLength: settings.maxPostLength,
            updatedAt: new Date()
          }
        });
      } else {
        savedSettings = await prisma.moderationSettings.create({
          data: {
            requireApproval: settings.requireApproval,
            newUserPostCount: settings.newUserPostCount,
            autoModeration: settings.autoModeration,
            profanityFilter: settings.profanityFilter,
            spamDetection: settings.spamDetection,
            linkModeration: settings.linkModeration,
            imageModeration: settings.imageModeration,
            reportThreshold: settings.reportThreshold,
            autoLockReports: settings.autoLockReports,
            moderationQueue: settings.moderationQueue,
            emailNotifications: settings.emailNotifications,
            bannedWords: settings.bannedWords,
            allowedDomains: settings.allowedDomains,
            trustedUserPostCount: settings.trustedUserPostCount,
            autoApproveImages: settings.autoApproveImages,
            maxLinksPerPost: settings.maxLinksPerPost,
            minPostLength: settings.minPostLength,
            maxPostLength: settings.maxPostLength
          }
        });
      }

      res.status(200).json({
        message: 'Settings saved successfully',
        settings: savedSettings
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling moderation settings:', error);
    res.status(500).json({ message: 'Failed to handle moderation settings' });
  }
}
