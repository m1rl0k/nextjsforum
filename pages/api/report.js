import prisma from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { createReportSchema, validate } from '../../lib/validation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Validate input
    const validation = validate(createReportSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { type, targetId, reason, description } = validation.data;

    // Check if target exists
    let targetExists = false;
    const reportData = {
      reportedById: user.id,
      reason,
      description: description || null,
      status: 'PENDING'
    };

    switch (type) {
      case 'thread':
        const thread = await prisma.thread.findUnique({
          where: { id: parseInt(targetId) }
        });
        if (thread) {
          reportData.threadId = parseInt(targetId);
          targetExists = true;
        }
        break;

      case 'post':
        const post = await prisma.post.findUnique({
          where: { id: parseInt(targetId) }
        });
        if (post) {
          reportData.postId = parseInt(targetId);
          targetExists = true;
        }
        break;

      case 'user':
        const reportedUser = await prisma.user.findUnique({
          where: { id: parseInt(targetId) }
        });
        if (reportedUser) {
          reportData.userId = parseInt(targetId);
          targetExists = true;
        }
        break;
    }

    if (!targetExists) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Check if user has already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reportedById: user.id,
        ...(type === 'thread' && { threadId: parseInt(targetId) }),
        ...(type === 'post' && { postId: parseInt(targetId) }),
        ...(type === 'user' && { userId: parseInt(targetId) }),
        status: 'PENDING'
      }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this content' });
    }

    // Create the report
    const report = await prisma.report.create({
      data: reportData,
      include: {
        reportedBy: { select: { username: true } },
        thread: { select: { title: true } },
        post: { select: { content: true } },
        user: { select: { username: true } }
      }
    });

    res.status(201).json({ 
      message: 'Report submitted successfully',
      report
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Failed to submit report' });
  }
}
