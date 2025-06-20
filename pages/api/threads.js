import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { associateImagesWithThread, associateImagesWithPost } from '../../lib/imageUtils';
import { generateUniqueThreadSlug } from '../../lib/slugUtils';

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

      const { title, content, subjectId } = req.body;

      // Validate input
      if (!title || !content || !subjectId) {
        return res.status(400).json({ error: 'Title, content, and subject are required' });
      }

      if (title.trim().length < 3) {
        return res.status(400).json({ error: 'Title must be at least 3 characters' });
      }

      if (content.trim().length < 10) {
        return res.status(400).json({ error: 'Content must be at least 10 characters' });
      }

      // Check if subject exists
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId) }
      });

      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      // Generate unique slug for the thread
      const slug = await generateUniqueThreadSlug(title);

      // Create the thread and initial post in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the thread
        const thread = await prisma.thread.create({
          data: {
            title: title.trim(),
            content: content.trim(),
            userId: user.id,
            subjectId: parseInt(subjectId),
            lastPostAt: new Date(),
            lastPostUserId: user.id,
            viewCount: 0,
            sticky: false,
            locked: false,
            slug: slug
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
            content: content.trim(),
            userId: user.id,
            threadId: thread.id,
            isFirstPost: true
          }
        });

        return { thread, firstPost };
      });

      // Update subject thread count
      await prisma.subject.update({
        where: { id: parseInt(subjectId) },
        data: {
          threadCount: {
            increment: 1
          }
        }
      });

      // Update user post count (thread creation counts as a post)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          postCount: {
            increment: 1
          }
        }
      });

      // Associate any images in the content with both thread and post
      await associateImagesWithThread(result.thread.id, content);
      await associateImagesWithPost(result.firstPost.id, content);

      res.status(201).json(result.thread);
    } catch (error) {
      console.error('Error creating thread:', error);
      res.status(500).json({ error: 'Failed to create thread' });
    }
  } else {
    res.status(405).end();
  }
}