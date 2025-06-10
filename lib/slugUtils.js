import prisma from './prisma';

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug
 */
export function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 100);
}

/**
 * Generate a unique slug for a thread
 * @param {string} title - The thread title
 * @param {number} threadId - Optional thread ID to exclude from uniqueness check
 * @returns {Promise<string>} - The unique slug
 */
export async function generateUniqueThreadSlug(title, threadId = null) {
  let baseSlug = generateSlug(title);
  
  if (!baseSlug) {
    baseSlug = 'thread';
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug already exists
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

/**
 * Update thread slug
 * @param {number} threadId - The thread ID
 * @param {string} title - The thread title
 * @returns {Promise<string>} - The updated slug
 */
export async function updateThreadSlug(threadId, title) {
  const slug = await generateUniqueThreadSlug(title, threadId);
  
  await prisma.thread.update({
    where: { id: threadId },
    data: { slug }
  });
  
  return slug;
}

/**
 * Find thread by slug or ID
 * @param {string|number} identifier - Thread slug or ID
 * @returns {Promise<Object|null>} - The thread object or null
 */
export async function findThreadBySlugOrId(identifier) {
  // Try to parse as number first
  const numericId = parseInt(identifier);
  
  if (!isNaN(numericId)) {
    // If it's a valid number, search by ID first
    const thread = await prisma.thread.findUnique({
      where: { id: numericId },
      include: {
        user: true,
        subject: {
          include: {
            category: true
          }
        }
      }
    });
    
    if (thread) {
      return thread;
    }
  }
  
  // Search by slug
  return await prisma.thread.findFirst({
    where: { slug: identifier },
    include: {
      user: true,
      subject: {
        include: {
          category: true
        }
      }
    }
  });
}

/**
 * Generate thread URL
 * @param {Object} thread - Thread object with id and slug
 * @returns {string} - The thread URL
 */
export function getThreadUrl(thread) {
  if (thread.slug) {
    return `/threads/${thread.slug}`;
  }
  return `/threads/${thread.id}`;
}

/**
 * Batch update slugs for existing threads without slugs
 * @param {number} limit - Number of threads to process at once
 * @returns {Promise<number>} - Number of threads updated
 */
export async function batchUpdateThreadSlugs(limit = 100) {
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
