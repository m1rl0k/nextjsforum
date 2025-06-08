import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { verifyToken } from '../../../lib/auth';

// Configure AWS S3 (if using S3)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

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
    
    let imageUrl;
    let uploadSuccess = false;

    // Try S3 upload first (if configured)
    if (process.env.USE_S3_UPLOAD === 'true' && 
        process.env.AWS_ACCESS_KEY_ID && 
        process.env.AWS_SECRET_ACCESS_KEY && 
        process.env.S3_BUCKET_NAME) {
      
      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `forum-images/${uniqueFilename}`,
          Body: fileBuffer,
          ContentType: file.mimetype,
          ACL: 'public-read'
        };

        const result = await s3.upload(uploadParams).promise();
        imageUrl = result.Location;
        uploadSuccess = true;
        
        // Clean up temp file
        fs.unlinkSync(file.filepath);
        
        console.log('Image uploaded to S3:', imageUrl);
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error);
        // Fall back to local storage
      }
    }

    // Local storage fallback (or primary if S3 not configured)
    if (!uploadSuccess) {
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
        
        imageUrl = `/uploads/images/${uniqueFilename}`;
        uploadSuccess = true;
        
        console.log('Image uploaded locally:', imageUrl);
      } catch (localError) {
        console.error('Local upload failed:', localError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    if (!uploadSuccess) {
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Return the image URL
    res.status(200).json({
      success: true,
      imageUrl,
      filename: uniqueFilename,
      originalName: file.originalFilename,
      size: file.size,
      type: file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}
