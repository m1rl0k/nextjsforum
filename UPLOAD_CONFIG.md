# Upload Configuration

## Current Setup: Local Uploads Only

All image uploads are stored locally in the `public/uploads/images/` directory.

## Local Upload Configuration

- **Storage Location**: `public/uploads/images/`
- **URL Path**: `/uploads/images/filename.ext`
- **File Size Limit**: 10MB
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **No additional configuration required**

## Features

✅ **Automatic Directory Creation** - Upload directory is created automatically if it doesn't exist
✅ **Unique Filenames** - Uses UUID to prevent filename conflicts
✅ **File Type Validation** - Only allows image files
✅ **Size Limits** - 10MB maximum file size
✅ **Secure Upload** - Requires authentication
✅ **Cleanup** - Temporary files are automatically cleaned up

## File Structure

```
public/
└── uploads/
    └── images/
        ├── uuid1.png
        ├── uuid2.jpg
        └── uuid3.gif
```

## Adding S3 Support (Future Enhancement)

If you want to add S3 support in the future:

1. Install AWS SDK v3:
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. Add environment variables:
   ```bash
   USE_S3_UPLOAD=true
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   ```

3. Update the upload handler to include S3 functionality

## Troubleshooting

- **Upload fails**: Check that the `public/uploads/images/` directory is writable
- **Images not displaying**: Ensure the Next.js static file serving is working correctly
- **File too large**: Increase the `maxFileSize` in the upload handler if needed

## Testing

1. Navigate to any thread reply page (e.g., `http://localhost:3000/threads/[id]/reply`)
2. Use the image upload button in the WYSIWYG editor
3. Images will be uploaded locally to `/uploads/images/`
4. Check the server logs to confirm "Image uploaded locally" messages 