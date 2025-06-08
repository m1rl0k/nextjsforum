import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
      bio: 'I am the administrator of this forum',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
      location: 'Forum HQ',
      signature: 'Administrator - Always here to help!',
    },
  });

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'testuser',
      password: await hashPassword('user123'),
      role: 'USER',
      bio: 'Just a regular forum user',
      avatar: 'https://ui-avatars.com/api/?name=Test+User&background=random',
      location: 'Somewhere',
      signature: 'Happy to be here!',
    },
  });

  // Create categories
  const category1 = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'General Discussion',
      description: 'General discussions about anything and everything',
    },
  });

  const category2 = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Help & Support',
      description: 'Get help with any issues or questions you have',
    },
  });

  // Create subjects
  const subject1 = await prisma.subject.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Introductions',
      description: 'Introduce yourself to the community',
      categoryId: category1.id,
    },
  });

  const subject2 = await prisma.subject.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Announcements',
      description: 'Important announcements and updates',
      categoryId: category1.id,
    },
  });

  // Create a sample thread
  const thread = await prisma.thread.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Welcome to our forum!',
      content: 'Welcome everyone to our new forum! Feel free to introduce yourselves.',
      userId: admin.id,
      subjectId: subject1.id,
      sticky: false,
      locked: false,
      posts: {
        create: [
          {
            content: 'This is the first post in our forum. Welcome!',
            userId: admin.id,
            postNumber: 1,
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
  console.log({ admin, testUser, category1, category2, subject1, subject2, thread });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
