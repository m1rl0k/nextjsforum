import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

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

    const { id } = req.query;
    const { toEmail, fromName, fromEmail, subject, message, includeLink } = req.body;

    // Validate required fields
    if (!toEmail || !subject) {
      return res.status(400).json({ message: 'To email and subject are required' });
    }

    // Get thread details
    const thread = await prisma.thread.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { username: true } },
        subject: { 
          select: { 
            name: true,
            category: { select: { name: true } }
          } 
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Build email content
    const threadUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/threads/${thread.id}`;
    
    let emailContent = `Hello,

${fromName || user.username} thought you might be interested in this forum thread:

Thread: ${thread.title}
Forum: ${thread.subject.category.name} → ${thread.subject.name}
Started by: ${thread.user.username}
Date: ${new Date(thread.createdAt).toLocaleDateString()}`;

    if (message) {
      emailContent += `\n\nPersonal message from ${fromName || user.username}:\n${message}`;
    }

    if (includeLink) {
      emailContent += `\n\nView the thread here: ${threadUrl}`;
    }

    emailContent += `\n\n---
This email was sent from NextJS Forum
${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`;

    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, we'll simulate sending the email
    console.log('Email would be sent:', {
      to: toEmail,
      from: fromEmail || user.email,
      subject: subject,
      content: emailContent
    });

    // Log the email activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivity: new Date() }
    });

    // In a real implementation, you might want to log email sends
    // await prisma.emailLog.create({
    //   data: {
    //     fromUserId: user.id,
    //     toEmail: toEmail,
    //     subject: subject,
    //     threadId: thread.id,
    //     sentAt: new Date()
    //   }
    // });

    res.status(200).json({ 
      message: 'Email sent successfully!',
      // In development, return the email content for debugging
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          to: toEmail,
          subject: subject,
          content: emailContent
        }
      })
    });

  } catch (error) {
    console.error('Error sending thread email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
}
