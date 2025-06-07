import { hashPassword, generateToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Please provide email, username, and password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

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
    res.setHeader(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` // 7 days
    );

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
