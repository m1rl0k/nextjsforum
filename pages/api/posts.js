import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { associateImagesWithPost } from '../../lib/imageUtils';
import { notifyThreadReply, notifyMentions, extractMentions } from '../../lib/notifications';
import { filterHtmlContent, stripHtml } from '../../lib/profanityFilter';
import { getUserPermissions } from '../../lib/permissions';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { content, threadId, replyToId } = req.body;

    try {
      // Get token from cookies
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const trimmedContent = content?.trim();

      // Validate content
      if (!trimmedContent || trimmedContent.length < 1) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      if (!threadId) {
        return res.status(400).json({ error: 'Thread ID is required' });
      }

      // Get thread with subject to check permissions
      const thread = await prisma.thread.findUnique({
        where: { id: Number.parseInt(threadId, 10) },
        include: {
          subject: true
        }
      });

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      // Check if thread is locked
      if (thread.isLocked) {
        return res.status(403).json({ error: 'This thread is locked and cannot accept new replies' });
      }

      // Check if subject allows replies and ACLs
      const perms = await getUserPermissions(user.id, thread.subject.id, user.role);
      if (!thread.subject.canReply || !perms.canReply) {
        return res.status(403).json({ error: 'Replies are not allowed in this forum' });
      }

      // Check if subject is active
      if (!thread.subject.isActive) {
        return res.status(403).json({ error: 'This forum is not active' });
      }

      // Check guest posting permission
      if (!thread.subject.guestPosting && user.role === 'GUEST') {
        return res.status(403).json({ error: 'Guest posting is not allowed in this forum' });
      }

      // Load moderation settings
      const moderationSettings = await prisma.moderationSettings.findFirst() || {
        requireApproval: false,
        newUserPostCount: 5,
        maxLinksPerPost: 3,
        minPostLength: 10,
        maxPostLength: 10000,
        moderationQueue: true,
        trustedUserPostCount: 50
      };

      const plainText = stripHtml(trimmedContent);
      const linkCount = (trimmedContent.match(/https?:\/\//gi) || []).length;

      // Enforce length limits
      if (moderationSettings.minPostLength && plainText.length < moderationSettings.minPostLength) {
        return res.status(400).json({ error: `Post must be at least ${moderationSettings.minPostLength} characters` });
      }

      if (moderationSettings.maxPostLength && plainText.length > moderationSettings.maxPostLength) {
        return res.status(400).json({ error: `Post must be under ${moderationSettings.maxPostLength} characters` });
      }

      // Enforce link limits
      if (moderationSettings.maxLinksPerPost && linkCount > moderationSettings.maxLinksPerPost) {
        return res.status(400).json({ error: `Post exceeds maximum links (${moderationSettings.maxLinksPerPost})` });
      }

      // Apply profanity filter to content
      const contentFilter = await filterHtmlContent(trimmedContent);
      if (!contentFilter.allowed) {
        return res.status(400).json({ error: contentFilter.reason || 'Content contains prohibited content' });
      }

      // Use filtered content
      const filteredContent = contentFilter.text;
      const requiresApproval = contentFilter.flagged ||
        moderationSettings.requireApproval ||
        (moderationSettings.moderationQueue && user.postCount < moderationSettings.trustedUserPostCount);

      // Create post and update counters in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the post
        const post = await prisma.post.create({
          data: {
            content: filteredContent,
            threadId: Number.parseInt(threadId, 10),
            userId: user.id,
            replyToId: replyToId ? Number.parseInt(replyToId, 10) : null,
            approved: !requiresApproval,
          },
        });

        // Update thread counters and last post info
        await prisma.thread.update({
          where: { id: thread.id },
          data: {
            postCount: { increment: 1 },
            replyCount: { increment: 1 },
            lastPostAt: new Date(),
            lastPostUserId: user.id
          }
        });

        // Update subject post count
        await prisma.subject.update({
          where: { id: thread.subjectId },
          data: {
            postCount: { increment: 1 }
          }
        });

        // Update user post count
        await prisma.user.update({
          where: { id: user.id },
          data: {
            postCount: { increment: 1 }
          }
        });

        return post;
      });

      // Associate any images in the content with this post
      await associateImagesWithPost(result.id, trimmedContent);

      // Fire notifications (thread owner, subscribers, mentions). Fail-soft to avoid blocking post creation.
      try {
        const mentions = extractMentions(trimmedContent);
        await Promise.all([
          notifyThreadReply(Number.parseInt(threadId, 10), result.id, user.id),
          mentions.length ? notifyMentions(result.id, mentions, user.id) : null
        ].filter(Boolean));
      } catch (notifyError) {
        console.error('Error sending notifications for post:', notifyError);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Creating post failed' });
    }
  } else {
    res.status(405).end();
  }
}
