import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { associateImagesWithThread, associateImagesWithPost } from '../../lib/imageUtils';
import { generateUniqueThreadSlug } from '../../lib/slugUtils';
import { notifyMentions, extractMentions } from '../../lib/notifications';
import { filterHtmlContent, filterContent, stripHtml } from '../../lib/profanityFilter';
import { getUserPermissions } from '../../lib/permissions';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const threads = await prisma.thread.findMany({
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: true,
        subject: true,
        posts: true,
      },
    });

    const totalThreads = await prisma.thread.count();

    res.status(200).json({
      threads,
      totalPages: Math.ceil(totalThreads / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } else if (req.method === 'POST') {
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

      const { title, content, subjectId, poll: pollData } = req.body;
      const trimmedTitle = title?.trim();
      const trimmedContent = content?.trim();
      const isPollThread = pollData && pollData.question && pollData.options?.length >= 2;

      // Validate input
      if (!trimmedTitle || !trimmedContent || !subjectId) {
        return res.status(400).json({ error: 'Title, content, and subject are required' });
      }

      if (trimmedTitle.length < 3) {
        return res.status(400).json({ error: 'Title must be at least 3 characters' });
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

      if (moderationSettings.minPostLength && plainText.length < moderationSettings.minPostLength) {
        return res.status(400).json({ error: `Post must be at least ${moderationSettings.minPostLength} characters` });
      }

      if (moderationSettings.maxPostLength && plainText.length > moderationSettings.maxPostLength) {
        return res.status(400).json({ error: `Post must be under ${moderationSettings.maxPostLength} characters` });
      }

      if (moderationSettings.maxLinksPerPost && linkCount > moderationSettings.maxLinksPerPost) {
        return res.status(400).json({ error: `Post exceeds maximum links (${moderationSettings.maxLinksPerPost})` });
      }

      // Check if subject exists and verify posting permissions
      const subject = await prisma.subject.findUnique({
        where: { id: Number.parseInt(subjectId, 10) }
      });

      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      if (!subject.isActive) {
        return res.status(403).json({ error: 'This forum is not active' });
      }

      // Check ACLs
      const perms = await getUserPermissions(user.id, subject.id, user.role);
      if (!subject.canPost || !perms.canPost) {
        return res.status(403).json({ error: 'Creating threads is not allowed in this forum' });
      }

      // Check if guest posting is allowed (for future use)
      if (!subject.guestPosting && user.role === 'GUEST') {
        return res.status(403).json({ error: 'Guest posting is not allowed in this forum' });
      }

      // Apply profanity filter to title
      const titleFilter = await filterContent(trimmedTitle);
      if (!titleFilter.allowed) {
        return res.status(400).json({ error: titleFilter.reason || 'Title contains prohibited content' });
      }

      // Apply profanity filter to content
      const contentFilter = await filterHtmlContent(trimmedContent);
      if (!contentFilter.allowed) {
        return res.status(400).json({ error: contentFilter.reason || 'Content contains prohibited content' });
      }

      // Use filtered content
      const filteredTitle = titleFilter.text;
      const filteredContent = contentFilter.text;
      const requiresApproval = titleFilter.flagged ||
        contentFilter.flagged ||
        moderationSettings.requireApproval ||
        (moderationSettings.moderationQueue && user.postCount < moderationSettings.trustedUserPostCount);

      // Generate unique slug for the thread
      const slug = await generateUniqueThreadSlug(trimmedTitle);

      // Create the thread and initial post in a transaction with counter updates
      const result = await prisma.$transaction(async (prisma) => {
        // Create the thread
        const thread = await prisma.thread.create({
          data: {
            title: filteredTitle,
            content: filteredContent,
            userId: user.id,
            subjectId: Number.parseInt(subjectId, 10),
            lastPostAt: new Date(),
            lastPostUserId: user.id,
            viewCount: 0,
            replyCount: 0,
            postCount: 1, // Initial post counts as 1
            isSticky: false,
            isLocked: false,
            approved: !requiresApproval, // Require approval if flagged
            slug: slug,
            threadType: isPollThread ? 'POLL' : 'NORMAL'
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true
              }
            },
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Create the initial post (first post of the thread)
        const firstPost = await prisma.post.create({
          data: {
            content: filteredContent,
            userId: user.id,
            threadId: thread.id,
            isFirstPost: true,
            approved: !requiresApproval
          }
        });

        // Update subject counters
        await prisma.subject.update({
          where: { id: Number.parseInt(subjectId, 10) },
          data: {
            threadCount: { increment: 1 },
            postCount: { increment: 1 }
          }
        });

        // Update user post count (thread creation counts as a post)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            postCount: { increment: 1 }
          }
        });

        // Create poll if this is a poll thread
        let poll = null;
        if (isPollThread) {
          poll = await prisma.poll.create({
            data: {
              threadId: thread.id,
              question: pollData.question.trim(),
              allowMultiple: pollData.allowMultiple || false,
              showResults: pollData.showResults !== false,
              endsAt: pollData.endsAt ? new Date(pollData.endsAt) : null,
              options: {
                create: pollData.options
                  .filter(opt => opt.trim().length > 0)
                  .map((text, index) => ({
                    text: text.trim(),
                    order: index
                  }))
              }
            }
          });
        }

        return { thread, firstPost, poll };
      });

      // Associate any images in the content with both thread and post
      await associateImagesWithThread(result.thread.id, trimmedContent);
      await associateImagesWithPost(result.firstPost.id, trimmedContent);

      // Notify any mentioned users in the first post (fail-soft)
      try {
        const mentions = extractMentions(trimmedContent);
        if (mentions.length) {
          await notifyMentions(result.firstPost.id, mentions, user.id);
        }
      } catch (notifyError) {
        console.error('Error sending notifications for new thread:', notifyError);
      }

      res.status(201).json({
        ...result.thread,
        poll: result.poll ? { id: result.poll.id } : null
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      res.status(500).json({ error: 'Failed to create thread' });
    }
  } else {
    res.status(405).end();
  }
}
