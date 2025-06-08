import prisma from './prisma';
import fs from 'fs';
import path from 'path';

/**
 * Extract image URLs from HTML content
 * @param {string} content - HTML content to parse
 * @returns {string[]} - Array of image URLs found in the content
 */
export function extractImageUrls(content) {
  if (!content) return [];
  
  // Regular expression to match img tags with src attributes
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const urls = [];
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    const url = match[1];
    // Only include URLs that match our upload pattern
    if (url.startsWith('/uploads/images/')) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Get image filename from URL
 * @param {string} url - Image URL
 * @returns {string|null} - Filename or null if not a valid upload URL
 */
export function getFilenameFromUrl(url) {
  if (!url || !url.startsWith('/uploads/images/')) {
    return null;
  }
  
  const parts = url.split('/');
  return parts[parts.length - 1];
}

/**
 * Associate images with a post
 * @param {number} postId - Post ID
 * @param {string} content - Post content containing images
 */
export async function associateImagesWithPost(postId, content) {
  try {
    const imageUrls = extractImageUrls(content);
    
    if (imageUrls.length === 0) {
      return;
    }
    
    console.log(`Found ${imageUrls.length} images in post content:`, imageUrls);
    
    // Get image records from database
    const filenames = imageUrls.map(getFilenameFromUrl).filter(Boolean);
    
    if (filenames.length === 0) {
      return;
    }
    
    const images = await prisma.image.findMany({
      where: {
        filename: {
          in: filenames
        }
      }
    });
    
    console.log(`Found ${images.length} image records in database`);
    
    // Create PostImage associations
    const postImageData = images.map(image => ({
      postId: postId,
      imageId: image.id
    }));
    
    if (postImageData.length > 0) {
      await prisma.postImage.createMany({
        data: postImageData,
        skipDuplicates: true
      });
      
      // Mark images as no longer orphaned
      await prisma.image.updateMany({
        where: {
          id: {
            in: images.map(img => img.id)
          }
        },
        data: {
          isOrphaned: false
        }
      });
      
      console.log(`Associated ${postImageData.length} images with post ${postId}`);
    }
    
  } catch (error) {
    console.error('Error associating images with post:', error);
    // Don't throw error to avoid breaking post creation
  }
}

/**
 * Associate images with a thread
 * @param {number} threadId - Thread ID
 * @param {string} content - Thread content containing images
 */
export async function associateImagesWithThread(threadId, content) {
  try {
    const imageUrls = extractImageUrls(content);
    
    if (imageUrls.length === 0) {
      return;
    }
    
    console.log(`Found ${imageUrls.length} images in thread content:`, imageUrls);
    
    // Get image records from database
    const filenames = imageUrls.map(getFilenameFromUrl).filter(Boolean);
    
    if (filenames.length === 0) {
      return;
    }
    
    const images = await prisma.image.findMany({
      where: {
        filename: {
          in: filenames
        }
      }
    });
    
    console.log(`Found ${images.length} image records in database`);
    
    // Create ThreadImage associations
    const threadImageData = images.map(image => ({
      threadId: threadId,
      imageId: image.id
    }));
    
    if (threadImageData.length > 0) {
      await prisma.threadImage.createMany({
        data: threadImageData,
        skipDuplicates: true
      });
      
      // Mark images as no longer orphaned
      await prisma.image.updateMany({
        where: {
          id: {
            in: images.map(img => img.id)
          }
        },
        data: {
          isOrphaned: false
        }
      });
      
      console.log(`Associated ${threadImageData.length} images with thread ${threadId}`);
    }
    
  } catch (error) {
    console.error('Error associating images with thread:', error);
    // Don't throw error to avoid breaking thread creation
  }
}

/**
 * Clean up orphaned images older than specified hours
 * @param {number} hoursOld - How many hours old orphaned images should be before cleanup
 */
export async function cleanupOrphanedImages(hoursOld = 24) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);
    
    const orphanedImages = await prisma.image.findMany({
      where: {
        isOrphaned: true,
        uploadedAt: {
          lt: cutoffDate
        }
      }
    });
    
    console.log(`Found ${orphanedImages.length} orphaned images to clean up`);
    
    // Delete files from filesystem
    for (const image of orphanedImages) {
      try {
        const filePath = path.join(process.cwd(), 'public', image.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileError) {
        console.error(`Error deleting file ${image.url}:`, fileError);
      }
    }
    
    // Delete database records
    if (orphanedImages.length > 0) {
      await prisma.image.deleteMany({
        where: {
          id: {
            in: orphanedImages.map(img => img.id)
          }
        }
      });
      
      console.log(`Cleaned up ${orphanedImages.length} orphaned images`);
    }
    
    return orphanedImages.length;
    
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
    return 0;
  }
}
