import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { associateImagesWithPost } from '../../lib/imageUtils';

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

      // Validate content
      if (!content || content.trim().length < 1) {
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

      // Check if subject allows replies
      if (!thread.subject.canReply) {
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

      // Create post and update counters in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the post
        const post = await prisma.post.create({
          data: {
            content: content.trim(),
            threadId: Number.parseInt(threadId, 10),
            userId: user.id,
            replyToId: replyToId ? Number.parseInt(replyToId, 10) : null,
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
      await associateImagesWithPost(result.id, content);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Creating post failed' });
    }
  } else {
    res.status(405).end();
  }
}
