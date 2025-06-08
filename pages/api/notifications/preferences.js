import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (req.method === 'GET') {
      // Get user's notification preferences
      let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId: user.id }
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: { userId: user.id }
        });
      }

      res.status(200).json(preferences);

    } else if (req.method === 'PUT') {
      // Update notification preferences
      const {
        emailThreadReply,
        emailPostReply,
        emailMentions,
        emailMessages,
        emailModeration,
        emailSystem,
        browserThreadReply,
        browserPostReply,
        browserMentions,
        browserMessages,
        browserModeration,
        browserSystem,
        emailDigest,
        digestFrequency
      } = req.body;

      const preferences = await prisma.notificationPreferences.upsert({
        where: { userId: user.id },
        update: {
          emailThreadReply: emailThreadReply ?? undefined,
          emailPostReply: emailPostReply ?? undefined,
          emailMentions: emailMentions ?? undefined,
          emailMessages: emailMessages ?? undefined,
          emailModeration: emailModeration ?? undefined,
          emailSystem: emailSystem ?? undefined,
          browserThreadReply: browserThreadReply ?? undefined,
          browserPostReply: browserPostReply ?? undefined,
          browserMentions: browserMentions ?? undefined,
          browserMessages: browserMessages ?? undefined,
          browserModeration: browserModeration ?? undefined,
          browserSystem: browserSystem ?? undefined,
          emailDigest: emailDigest ?? undefined,
          digestFrequency: digestFrequency ?? undefined,
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          emailThreadReply: emailThreadReply ?? true,
          emailPostReply: emailPostReply ?? true,
          emailMentions: emailMentions ?? true,
          emailMessages: emailMessages ?? true,
          emailModeration: emailModeration ?? true,
          emailSystem: emailSystem ?? true,
          browserThreadReply: browserThreadReply ?? true,
          browserPostReply: browserPostReply ?? true,
          browserMentions: browserMentions ?? true,
          browserMessages: browserMessages ?? true,
          browserModeration: browserModeration ?? true,
          browserSystem: browserSystem ?? true,
          emailDigest: emailDigest ?? false,
          digestFrequency: digestFrequency ?? 'daily'
        }
      });

      res.status(200).json(preferences);

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling notification preferences:', error);
    res.status(500).json({ error: 'Failed to handle notification preferences' });
  }
}
