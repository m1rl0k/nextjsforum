import { comparePassword, generateToken } from '../../../lib/auth';
import prisma from '../../../lib/db';
import { UnauthorizedError, ValidationError } from '../../../lib/apiError';
import { errorHandler } from '../../../lib/apiError';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Please provide email and password');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });

    // Check if user exists and password is correct
    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie with token
    res.setHeader(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` // 7 days
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
}
