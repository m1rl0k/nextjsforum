import { hashPassword } from '../../lib/auth';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, username } = req.body;

    const hashedPassword = await hashPassword(password);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
        },
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'User registration failed' });
    }
  } else {
    res.status(405).end();
  }
}
