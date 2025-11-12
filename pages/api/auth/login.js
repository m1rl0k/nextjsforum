import { comparePassword, generateToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { loginSchema, validate } from '../../../lib/validation';
import { authRateLimit } from '../../../lib/rateLimit';
import { isProduction } from '../../../lib/env';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
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
    const validation = validate(loginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is banned
    if (user.isBanned) {
      const banMessage = user.banExpiresAt
        ? `Your account is banned until ${new Date(user.banExpiresAt).toLocaleDateString()}`
        : 'Your account has been permanently banned';
      return res.status(403).json({ error: banMessage });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login and IP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastActivity: new Date(),
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie with token
    const cookieOptions = [
      `token=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=604800', // 7 days
      isProduction() ? 'Secure' : '' // Only use Secure flag in production
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
