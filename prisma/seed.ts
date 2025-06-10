import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if database is already seeded
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (existingAdmin) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }

  console.log('📝 Creating fresh seed data...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
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

  // Create moderator user
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@example.com',
      username: 'moderator',
      password: await hashPassword('mod123'),
      role: 'MODERATOR',
      bio: 'I help keep the forum safe and friendly',
      avatar: 'https://ui-avatars.com/api/?name=Moderator+User&background=random',
      location: 'Moderation Station',
      signature: 'Moderator - Keeping things civil!',
    },
  });

  // Create test user
  const testUser = await prisma.user.create({
    data: {
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
  const category1 = await prisma.category.create({
    data: {
      name: 'General Discussion',
      description: 'General discussions about anything and everything',
    },
  });

  const category2 = await prisma.category.create({
    data: {
      name: 'Help & Support',
      description: 'Get help with any issues or questions you have',
    },
  });

  // Create subjects
  const subject1 = await prisma.subject.create({
    data: {
      name: 'Introductions',
      description: 'Introduce yourself to the community',
      categoryId: category1.id,
    },
  });

  const subject2 = await prisma.subject.create({
    data: {
      name: 'Announcements',
      description: 'Important announcements and updates',
      categoryId: category1.id,
    },
  });

  // Create a sample thread
  const thread = await prisma.thread.create({
    data: {
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
          },
          {
            content: 'Thanks for setting up this forum! Looking forward to great discussions.',
            userId: moderator.id,
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📋 Test Accounts Created:');
  console.log('👑 Admin: admin@example.com / admin123');
  console.log('🛡️  Moderator: moderator@example.com / mod123');
  console.log('👤 User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
