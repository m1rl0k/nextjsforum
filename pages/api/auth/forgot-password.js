import prisma from '../../../lib/prisma';
import { sendPasswordResetEmail } from '../../../lib/email';
import crypto from 'crypto';
import { z } from 'zod';
import { validate } from '../../../lib/validation';
import { authRateLimit } from '../../../lib/rateLimit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    authRateLimit(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    // Validate input
    const validation = validate(forgotPasswordSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { email } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return res.status(200).json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send email
    try {
      await sendPasswordResetEmail(email, resetToken, user.username);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't expose email errors to user
    }

    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
}

