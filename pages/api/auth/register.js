import { hashPassword, generateToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { registerSchema, validate } from '../../../lib/validation';
import { authRateLimit } from '../../../lib/rateLimit';
import { isProduction } from '../../../lib/env';

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
    const validation = validate(registerSchema, req.body);
    if (!validation.success) {
      console.error('Validation failed:', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { email, username, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bio: true,
        avatar: true,
        location: true,
        signature: true,
        postCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

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

    res.status(201).json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
