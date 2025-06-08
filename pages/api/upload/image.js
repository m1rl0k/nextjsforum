import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Parse the form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
      filter: ({ mimetype }) => {
        // Only allow image files
        return mimetype && mimetype.startsWith('image/');
      }
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalFilename || '');
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // Local storage upload
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, uniqueFilename);
    
    try {
      // Move file to uploads directory
      fs.copyFileSync(file.filepath, localFilePath);
      fs.unlinkSync(file.filepath); // Clean up temp file

      const imageUrl = `/uploads/images/${uniqueFilename}`;

      console.log('Image uploaded locally:', imageUrl);

      // Create database record for the uploaded image
      const imageRecord = await prisma.image.create({
        data: {
          filename: uniqueFilename,
          originalName: file.originalFilename,
          url: imageUrl,
          size: file.size,
          mimeType: file.mimetype,
          uploadedBy: decoded.userId,
          isOrphaned: true // Will be set to false when attached to a post/thread
        }
      });

      console.log('Image record created in database:', imageRecord.id);

      // Return the image URL and database ID
      res.status(200).json({
        success: true,
        imageUrl,
        imageId: imageRecord.id,
        filename: uniqueFilename,
        originalName: file.originalFilename,
        size: file.size,
        type: file.mimetype
      });

    } catch (localError) {
      console.error('Local upload failed:', localError);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}
