const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Inline slug utilities for CommonJS compatibility
function generateSlug(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function generateUniqueThreadSlug(title, threadId = null) {
  let baseSlug = generateSlug(title);

  if (!baseSlug) {
    baseSlug = 'thread';
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingThread = await prisma.thread.findFirst({
      where: {
        slug: slug,
        ...(threadId && { id: { not: threadId } })
      }
    });

    if (!existingThread) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function updateThreadSlug(threadId, title) {
  const slug = await generateUniqueThreadSlug(title, threadId);

  await prisma.thread.update({
    where: { id: threadId },
    data: { slug }
  });

  return slug;
}

async function batchUpdateThreadSlugs(limit = 100) {
  const threadsWithoutSlugs = await prisma.thread.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    },
    select: {
      id: true,
      title: true
    },
    take: limit
  });

  let updatedCount = 0;

  for (const thread of threadsWithoutSlugs) {
    try {
      await updateThreadSlug(thread.id, thread.title);
      updatedCount++;
    } catch (error) {
      console.error(`Failed to update slug for thread ${thread.id}:`, error);
    }
  }

  return updatedCount;
}

async function main() {
  console.log('🔄 Starting slug migration...');
  
  try {
    // Get total count of threads without slugs
    const totalWithoutSlugs = await prisma.thread.count({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    });
    
    console.log(`📊 Found ${totalWithoutSlugs} threads without slugs`);
    
    if (totalWithoutSlugs === 0) {
      console.log('✅ All threads already have slugs!');
      return;
    }
    
    let totalUpdated = 0;
    let batchSize = 50;
    
    while (true) {
      const updated = await batchUpdateThreadSlugs(batchSize);
      totalUpdated += updated;
      
      console.log(`✅ Updated ${updated} thread slugs (${totalUpdated}/${totalWithoutSlugs} total)`);
      
      if (updated < batchSize) {
        // We've processed all remaining threads
        break;
      }
    }
    
    console.log(`🎉 Migration complete! Updated ${totalUpdated} thread slugs.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
