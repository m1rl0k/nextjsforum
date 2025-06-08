// Upload configuration
export const uploadConfig = {
  // Maximum file size in bytes (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Allowed image types
  allowedImageTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  
  // Local upload settings
  local: {
    uploadsDir: 'public/uploads/images',
    urlPrefix: '/uploads/images'
  },
  
  // S3 upload settings
  s3: {
    enabled: process.env.USE_S3_UPLOAD === 'true',
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    keyPrefix: 'forum-images/'
  }
};

// Helper function to check if S3 is properly configured
export function isS3Configured() {
  return uploadConfig.s3.enabled && 
         uploadConfig.s3.bucket && 
         uploadConfig.s3.accessKeyId && 
         uploadConfig.s3.secretAccessKey;
}

// Helper function to get upload method
export function getUploadMethod() {
  return isS3Configured() ? 's3' : 'local';
}

// Helper function to validate file type
export function isValidImageType(mimetype) {
  return uploadConfig.allowedImageTypes.includes(mimetype);
}

// Helper function to validate file size
export function isValidFileSize(size) {
  return size <= uploadConfig.maxFileSize;
}
