import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Handle POST - Create new user
    if (req.method === 'POST') {
      const { username, email, password, role = 'USER', sendWelcomeEmail = false } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      // Validate username length
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ message: 'Username must be between 3 and 30 characters' });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      // Validate role
      if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        if (existingUser.username === username) {
          return res.status(400).json({ message: 'Username already taken' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          username,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          banned: false
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      // TODO: Send welcome email if sendWelcomeEmail is true
      // This would require email service integration

      return res.status(201).json({
        message: 'User created successfully',
        user: newUser
      });
    }

    // Handle GET - List users
    // Get query parameters
    const { limit = 10, page = 1, search = '', sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    let orderBy = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name_asc':
        orderBy = { username: 'asc' };
        break;
      case 'name_desc':
        orderBy = { username: 'desc' };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              threads: true,
              posts: true
            }
          }
        },
        orderBy,
        take: parseInt(limit),
        skip
      }),
      prisma.user.count({ where })
    ]);

    // Format response
    const formattedUsers = users.map(user => ({
      ...user,
      threadCount: user._count.threads,
      postCount: user._count.posts,
      _count: undefined // Remove the _count field
    }));

    res.status(200).json({
      status: 'success',
      data: formattedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};


