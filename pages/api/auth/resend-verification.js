import prisma from '../../../lib/prisma';
import { generateVerificationToken, generateTokenExpiry } from '../../../lib/verification';
import { sendVerificationEmail } from '../../../lib/email';
import { authRateLimit } from '../../../lib/rateLimit';

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Don't reveal if user exists or not (security)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = generateTokenExpiry();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, user.username);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
}
