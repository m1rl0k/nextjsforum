const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupAndReseed() {
  try {
    console.log('🧹 Starting cleanup and reseed process...');

    // 1. Clean up uploaded images from filesystem
    console.log('📁 Cleaning up uploaded images...');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`  ✅ Deleted: ${file}`);
        }
      }
      console.log(`📁 Cleaned up ${files.length} image files`);
    } else {
      console.log('📁 No uploads directory found');
    }

    // 2. Clean up database tables in correct order (respecting foreign key constraints)
    console.log('🗄️ Cleaning up database...');
    
    // Delete in order of dependencies
    await prisma.postImage.deleteMany();
    console.log('  ✅ Deleted all post images');
    
    await prisma.threadImage.deleteMany();
    console.log('  ✅ Deleted all thread images');
    
    await prisma.image.deleteMany();
    console.log('  ✅ Deleted all images');
    
    await prisma.post.deleteMany();
    console.log('  ✅ Deleted all posts');
    
    await prisma.thread.deleteMany();
    console.log('  ✅ Deleted all threads');
    
    // Reset thread and post counts
    await prisma.subject.updateMany({
      data: {
        threadCount: 0,
        postCount: 0,
        lastPost: null,
        lastPostUserId: null,
        lastThreadId: null
      }
    });
    console.log('  ✅ Reset subject counts');
    
    await prisma.user.updateMany({
      data: {
        postCount: 0
      }
    });
    console.log('  ✅ Reset user post counts');

    // 3. Create sample data
    console.log('🌱 Creating sample data...');
    
    // Get existing users
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed script first.');
      return;
    }
    
    const admin = users.find(u => u.role === 'ADMIN') || users[0];
    const regularUser = users.find(u => u.role === 'USER') || users[1] || users[0];
    
    // Get existing subjects
    const subjects = await prisma.subject.findMany();
    if (subjects.length === 0) {
      console.log('❌ No subjects found. Please run the main seed script first.');
      return;
    }

    // Create sample threads with initial posts
    const thread1 = await prisma.$transaction(async (prisma) => {
      const thread = await prisma.thread.create({
        data: {
          title: 'Welcome to the Forum!',
          content: '<p>Welcome everyone to our forum! This is a place for great discussions and sharing knowledge.</p><p>Feel free to introduce yourselves and start new topics.</p>',
          userId: admin.id,
          subjectId: subjects[0].id,
          sticky: true,
          lastPostAt: new Date(),
          lastPostUserId: admin.id,
        }
      });

      await prisma.post.create({
        data: {
          content: '<p>Welcome everyone to our forum! This is a place for great discussions and sharing knowledge.</p><p>Feel free to introduce yourselves and start new topics.</p>',
          userId: admin.id,
          threadId: thread.id,
          isFirstPost: true
        }
      });

      return thread;
    });

    const thread2 = await prisma.$transaction(async (prisma) => {
      const thread = await prisma.thread.create({
        data: {
          title: 'Forum Rules and Guidelines',
          content: '<p><strong>Please read and follow these important forum rules:</strong></p><ul><li>Be respectful to all members</li><li>No spam or self-promotion</li><li>Stay on topic in discussions</li><li>Use appropriate language</li><li>Report any issues to moderators</li></ul><p>Thank you for helping us maintain a friendly community!</p>',
          userId: admin.id,
          subjectId: subjects[0].id,
          sticky: true,
          lastPostAt: new Date(),
          lastPostUserId: admin.id,
        }
      });

      await prisma.post.create({
        data: {
          content: '<p><strong>Please read and follow these important forum rules:</strong></p><ul><li>Be respectful to all members</li><li>No spam or self-promotion</li><li>Stay on topic in discussions</li><li>Use appropriate language</li><li>Report any issues to moderators</li></ul><p>Thank you for helping us maintain a friendly community!</p>',
          userId: admin.id,
          threadId: thread.id,
          isFirstPost: true
        }
      });

      return thread;
    });

    if (subjects.length > 1) {
      const thread3 = await prisma.$transaction(async (prisma) => {
        const thread = await prisma.thread.create({
          data: {
            title: 'General Discussion Thread',
            content: '<p>This is a general discussion thread for any topics that don\'t fit elsewhere.</p><p>What\'s on your mind today?</p>',
            userId: regularUser.id,
            subjectId: subjects[1].id,
            lastPostAt: new Date(),
            lastPostUserId: regularUser.id,
          }
        });

        await prisma.post.create({
          data: {
            content: '<p>This is a general discussion thread for any topics that don\'t fit elsewhere.</p><p>What\'s on your mind today?</p>',
            userId: regularUser.id,
            threadId: thread.id,
            isFirstPost: true
          }
        });

        return thread;
      });

      // Add a reply to the general discussion
      await prisma.post.create({
        data: {
          content: '<p>Great idea for a general discussion thread! I\'m excited to see what topics come up.</p>',
          userId: admin.id,
          threadId: thread3.id,
        }
      });
    }

    // Update subject counts
    for (const subject of subjects) {
      const threadCount = await prisma.thread.count({
        where: { subjectId: subject.id }
      });
      
      const postCount = await prisma.post.count({
        where: { thread: { subjectId: subject.id } }
      });

      const lastThread = await prisma.thread.findFirst({
        where: { subjectId: subject.id },
        orderBy: { lastPostAt: 'desc' }
      });

      await prisma.subject.update({
        where: { id: subject.id },
        data: {
          threadCount,
          postCount,
          lastPost: lastThread?.lastPostAt,
          lastPostUserId: lastThread?.lastPostUserId,
          lastThreadId: lastThread?.id
        }
      });
    }

    // Update user post counts
    for (const user of users) {
      const postCount = await prisma.post.count({
        where: { userId: user.id }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { postCount }
      });
    }

    console.log('✅ Sample threads and posts created');
    console.log('✅ Counts updated');
    console.log('🎉 Cleanup and reseed completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup and reseed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndReseed();
