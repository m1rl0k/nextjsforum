const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if database is already seeded
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@forum.com' }
  });

  if (existingAdmin) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }

  console.log('📝 Creating fresh seed data...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@forum.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      bio: 'Forum Administrator - keeping things running smoothly!',
      location: 'Forum HQ',
      signature: 'Best regards,\nForum Admin Team',
      postCount: 25,
      isActive: true,
    },
  });

  // Create moderator user
  const moderator = await prisma.user.create({
    data: {
      email: 'mod@forum.com',
      username: 'moderator',
      password: hashedPassword,
      role: 'MODERATOR',
      bio: 'Forum Moderator - here to help and keep discussions civil.',
      location: 'New York, NY',
      signature: 'Keep it friendly!\n- Mod Team',
      postCount: 18,
      isActive: true,
    },
  });

  // Create regular test users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@forum.com` },
      update: {},
      create: {
        email: `user${i}@forum.com`,
        username: `user${i}`,
        password: hashedPassword,
        role: 'USER',
        bio: `I'm user number ${i}. Nice to meet you all!`,
        location: ['California', 'Texas', 'Florida', 'New York', 'Illinois'][i - 1],
        signature: `User ${i} - Forum Member`,
        postCount: Math.floor(Math.random() * 15) + 1,
        isActive: true,
      },
    });
    users.push(user);
  }

  console.log('✅ Users created');

  // Create categories
  const generalCategory = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'General Discussion',
      description: 'Talk about anything and everything here',
      order: 1,
    },
  });

  const techCategory = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Technology',
      description: 'Discuss the latest in technology and programming',
      order: 2,
    },
  });

  const gamingCategory = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Gaming',
      description: 'All things gaming - from retro to modern',
      order: 3,
    },
  });

  console.log('✅ Categories created');

  // Create subjects (forums)
  const introSubject = await prisma.subject.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Introductions',
      description: 'Introduce yourself to the community',
      categoryId: generalCategory.id,
      threadCount: 0,
      postCount: 0,
    },
  });

  const announcementsSubject = await prisma.subject.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Announcements',
      description: 'Important announcements and news',
      categoryId: generalCategory.id,
      threadCount: 0,
      postCount: 0,
    },
  });

  const webDevSubject = await prisma.subject.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Web Development',
      description: 'Frontend, backend, and everything in between',
      categoryId: techCategory.id,
      threadCount: 0,
      postCount: 0,
    },
  });

  const mobileDevSubject = await prisma.subject.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Mobile Development',
      description: 'iOS, Android, and cross-platform development',
      categoryId: techCategory.id,
      threadCount: 0,
      postCount: 0,
    },
  });

  const pcGamingSubject = await prisma.subject.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: 'PC Gaming',
      description: 'Discuss PC games, hardware, and setups',
      categoryId: gamingCategory.id,
      threadCount: 0,
      postCount: 0,
    },
  });

  console.log('✅ Subjects created');

  // Create sample threads
  const welcomeThread = await prisma.thread.create({
    data: {
      title: 'Welcome to our Forum!',
      content: 'Welcome everyone to our new forum! This is a place where we can discuss various topics, share knowledge, and build a great community together.\n\nPlease take a moment to read our rules and introduce yourself in the Introductions section.\n\nHappy posting!',
      userId: admin.id,
      subjectId: announcementsSubject.id,
      sticky: true,
      viewCount: 45,
      lastPostAt: new Date(),
      lastPostUserId: admin.id,
    },
  });

  const introThread = await prisma.thread.create({
    data: {
      title: 'Hello from the Admin Team!',
      content: 'Hi everyone! I\'m the admin of this forum. Looking forward to building an awesome community with all of you.\n\nFeel free to ask me any questions about the forum or just say hello!',
      userId: admin.id,
      subjectId: introSubject.id,
      viewCount: 32,
      lastPostAt: new Date(),
      lastPostUserId: admin.id,
    },
  });

  const techThread = await prisma.thread.create({
    data: {
      title: 'What\'s your favorite JavaScript framework?',
      content: 'I\'m curious to know what JavaScript frameworks everyone is using these days. React? Vue? Angular? Something else?\n\nShare your thoughts and experiences!',
      userId: users[0].id,
      subjectId: webDevSubject.id,
      viewCount: 28,
      lastPostAt: new Date(),
      lastPostUserId: users[0].id,
    },
  });

  console.log('✅ Threads created');

  // Create sample posts (replies)
  await prisma.post.create({
    data: {
      content: 'Thanks for the warm welcome! This forum looks great already.',
      userId: moderator.id,
      threadId: welcomeThread.id,
    },
  });

  await prisma.post.create({
    data: {
      content: 'Hello admin! Thanks for creating this space. I\'m excited to be part of the community.',
      userId: users[1].id,
      threadId: introThread.id,
    },
  });

  await prisma.post.create({
    data: {
      content: 'I\'m a big fan of React! The component-based architecture just makes sense to me. What about you?',
      userId: users[2].id,
      threadId: techThread.id,
    },
  });

  await prisma.post.create({
    data: {
      content: 'Vue.js all the way! It\'s so easy to learn and the documentation is fantastic.',
      userId: moderator.id,
      threadId: techThread.id,
    },
  });

  console.log('✅ Posts created');

  // Update thread and subject counters
  await prisma.subject.update({
    where: { id: announcementsSubject.id },
    data: { threadCount: 1, postCount: 1 },
  });

  await prisma.subject.update({
    where: { id: introSubject.id },
    data: { threadCount: 1, postCount: 1 },
  });

  await prisma.subject.update({
    where: { id: webDevSubject.id },
    data: { threadCount: 1, postCount: 2 },
  });

  console.log('✅ Counters updated');

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Accounts Created:');
  console.log('👑 Admin: admin@forum.com / password123');
  console.log('🛡️  Moderator: mod@forum.com / password123');
  console.log('👤 Users: user1@forum.com to user5@forum.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
