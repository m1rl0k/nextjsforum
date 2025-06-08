import { verifyToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Verify admin authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (req.method === 'GET') {
      // Return current upload settings
      const settings = {
        useS3: process.env.USE_S3_UPLOAD === 'true',
        maxFileSize: 10, // Default 10MB
        allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        s3Config: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_REGION || 'us-east-1',
          bucketName: process.env.S3_BUCKET_NAME || ''
        }
      };

      res.status(200).json(settings);

    } else if (req.method === 'POST') {
      // This is a read-only endpoint for now
      // In a production environment, you'd want to update environment variables
      // or store these settings in the database
      
      res.status(200).json({ 
        message: 'Settings received. Note: To change upload settings, update your .env file and restart the server.',
        note: 'Environment variables: USE_S3_UPLOAD, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME'
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling upload settings:', error);
    res.status(500).json({ message: 'Failed to handle upload settings' });
  }
}
