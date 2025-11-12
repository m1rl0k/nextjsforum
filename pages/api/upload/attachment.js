import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../lib/auth';

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
      maxFileSize: 3 * 1024 * 1024, // 3MB limit for message attachments
      keepExtensions: true,
      filter: ({ mimetype }) => {
        // Allow only images (JPG/PNG/GIF), PDF, ZIP, and TXT files
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
          'application/zip',
          'application/x-zip-compressed'
        ];
        return mimetype && allowedTypes.includes(mimetype);
      }
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Allowed: JPG, PNG, TXT, and ZIP files only.'
      });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalFilename || '');
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // Local storage upload
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'attachments');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, uniqueFilename);
    
    try {
      // Move file to uploads directory
      fs.copyFileSync(file.filepath, localFilePath);
      fs.unlinkSync(file.filepath); // Clean up temp file

      const fileUrl = `/uploads/attachments/${uniqueFilename}`;

      console.log('File uploaded:', fileUrl);

      // Return the file information
      res.status(200).json({
        success: true,
        url: fileUrl,
        filename: uniqueFilename,
        originalName: file.originalFilename,
        size: file.size,
        type: file.mimetype
      });

    } catch (localError) {
      console.error('Local upload failed:', localError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle file size errors
    if (error.code === 'LIMIT_FILE_SIZE' || error.message?.includes('maxFileSize')) {
      return res.status(400).json({ error: 'File size must be less than 3MB' });
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
}

