import { verifyToken } from '../../lib/auth';
import { associateImagesWithPost, extractImageUrls } from '../../lib/imageUtils';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Extract image URLs from content
    const imageUrls = extractImageUrls(content);
    
    // Create a test post
    const testPost = await prisma.post.create({
      data: {
        content: content,
        threadId: 1, // Use existing thread
        userId: user.id,
      },
    });

    // Associate images with the post
    await associateImagesWithPost(testPost.id, content);

    // Get the post with associated images
    const postWithImages = await prisma.post.findUnique({
      where: { id: testPost.id },
      include: {
        images: {
          include: {
            image: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      post: postWithImages,
      extractedUrls: imageUrls,
      message: 'Test post created and images associated successfully'
    });

  } catch (error) {
    console.error('Error in test image association:', error);
    res.status(500).json({ error: 'Failed to test image association' });
  }
}
