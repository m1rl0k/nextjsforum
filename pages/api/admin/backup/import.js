import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import formidable from 'formidable';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024 // 100MB max
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const uploadedFile = files.file?.[0] || files.file;

    if (!uploadedFile) {
      return res.status(400).json({ message: 'No backup file provided' });
    }

    // Read and parse the backup file
    let backupData;
    try {
      const fileContent = await fs.promises.readFile(uploadedFile.filepath, 'utf8');
      backupData = JSON.parse(fileContent);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    // Validate backup structure
    if (!backupData.metadata) {
      return res.status(400).json({ message: 'Invalid backup file: missing metadata' });
    }

    const results = {
      categories: { imported: 0, skipped: 0 },
      users: { imported: 0, skipped: 0 },
      threads: { imported: 0, skipped: 0 },
      posts: { imported: 0, skipped: 0 },
      settings: { imported: 0, skipped: 0 }
    };

    // Get import options from form fields
    const importCategories = fields.importCategories?.[0] !== 'false';
    const importUsers = fields.importUsers?.[0] !== 'false';
    const importThreads = fields.importThreads?.[0] !== 'false';
    const importPosts = fields.importPosts?.[0] !== 'false';
    const importSettings = fields.importSettings?.[0] !== 'false';
    const overwriteExisting = fields.overwriteExisting?.[0] === 'true';

    // Track ID mappings for foreign key relationships
    const idMappings = {
      categories: {},
      subjects: {},
      users: {},
      threads: {}
    };

    // Import categories and subjects first
    if (importCategories && backupData.categories) {
      for (const category of backupData.categories) {
        try {
          let existingCategory = await prisma.category.findFirst({
            where: { name: category.name }
          });

          if (existingCategory && !overwriteExisting) {
            idMappings.categories[category.id] = existingCategory.id;
            results.categories.skipped++;
          } else if (existingCategory && overwriteExisting) {
            const updatedCategory = await prisma.category.update({
              where: { id: existingCategory.id },
              data: {
                description: category.description,
                order: category.order
              }
            });
            idMappings.categories[category.id] = updatedCategory.id;
            results.categories.imported++;
          } else {
            const newCategory = await prisma.category.create({
              data: {
                name: category.name,
                description: category.description,
                order: category.order || 0
              }
            });
            idMappings.categories[category.id] = newCategory.id;
            results.categories.imported++;
          }

          // Import subjects for this category
          if (category.subjects) {
            for (const subject of category.subjects) {
              try {
                let existingSubject = await prisma.subject.findFirst({
                  where: {
                    name: subject.name,
                    categoryId: idMappings.categories[category.id]
                  }
                });

                if (existingSubject && !overwriteExisting) {
                  idMappings.subjects[subject.id] = existingSubject.id;
                } else if (existingSubject && overwriteExisting) {
                  const updatedSubject = await prisma.subject.update({
                    where: { id: existingSubject.id },
                    data: {
                      description: subject.description,
                      icon: subject.icon,
                      order: subject.order
                    }
                  });
                  idMappings.subjects[subject.id] = updatedSubject.id;
                } else {
                  const newSubject = await prisma.subject.create({
                    data: {
                      name: subject.name,
                      description: subject.description,
                      icon: subject.icon,
                      order: subject.order || 0,
                      categoryId: idMappings.categories[category.id]
                    }
                  });
                  idMappings.subjects[subject.id] = newSubject.id;
                }
              } catch (error) {
                console.error('Error importing subject:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error importing category:', error);
        }
      }
    }

    // Import users
    if (importUsers && backupData.users) {
      for (const backupUser of backupData.users) {
        try {
          // Skip the current admin user
          if (backupUser.id === user.id) {
            idMappings.users[backupUser.id] = user.id;
            results.users.skipped++;
            continue;
          }

          let existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: backupUser.email },
                { username: backupUser.username }
              ]
            }
          });

          if (existingUser && !overwriteExisting) {
            idMappings.users[backupUser.id] = existingUser.id;
            results.users.skipped++;
          } else if (existingUser && overwriteExisting) {
            // Update existing user (but not password for security)
            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                bio: backupUser.bio,
                location: backupUser.location,
                signature: backupUser.signature,
                avatar: backupUser.avatar
              }
            });
            idMappings.users[backupUser.id] = updatedUser.id;
            results.users.imported++;
          } else {
            // Create new user with temporary password
            const tempPassword = await bcrypt.hash(`temp_${Date.now()}`, 10);
            const newUser = await prisma.user.create({
              data: {
                username: backupUser.username,
                email: backupUser.email,
                password: tempPassword,
                role: backupUser.role || 'USER',
                bio: backupUser.bio,
                location: backupUser.location,
                signature: backupUser.signature,
                avatar: backupUser.avatar,
                isActive: backupUser.isActive !== false,
                emailVerified: true
              }
            });
            idMappings.users[backupUser.id] = newUser.id;
            results.users.imported++;
          }
        } catch (error) {
          console.error('Error importing user:', error);
        }
      }
    }

    // Import threads
    if (importThreads && backupData.threads) {
      for (const thread of backupData.threads) {
        try {
          const subjectId = idMappings.subjects[thread.subjectId] || thread.subjectId;
          const userId = idMappings.users[thread.userId] || user.id;

          // Check if subject exists
          const subjectExists = await prisma.subject.findUnique({
            where: { id: subjectId }
          });

          if (!subjectExists) {
            results.threads.skipped++;
            continue;
          }

          let existingThread = await prisma.thread.findFirst({
            where: {
              title: thread.title,
              subjectId: subjectId
            }
          });

          if (existingThread && !overwriteExisting) {
            idMappings.threads[thread.id] = existingThread.id;
            results.threads.skipped++;
          } else if (existingThread && overwriteExisting) {
            const updatedThread = await prisma.thread.update({
              where: { id: existingThread.id },
              data: {
                content: thread.content,
                isLocked: thread.isLocked,
                isSticky: thread.isSticky
              }
            });
            idMappings.threads[thread.id] = updatedThread.id;
            results.threads.imported++;
          } else {
            const newThread = await prisma.thread.create({
              data: {
                title: thread.title,
                content: thread.content,
                userId: userId,
                subjectId: subjectId,
                isLocked: thread.isLocked || false,
                isSticky: thread.isSticky || false,
                viewCount: thread.viewCount || 0,
                postCount: 0,
                replyCount: 0
              }
            });
            idMappings.threads[thread.id] = newThread.id;
            results.threads.imported++;
          }
        } catch (error) {
          console.error('Error importing thread:', error);
        }
      }
    }

    // Import posts
    if (importPosts && backupData.posts) {
      for (const post of backupData.posts) {
        try {
          const threadId = idMappings.threads[post.threadId] || post.threadId;
          const userId = idMappings.users[post.userId] || user.id;

          // Check if thread exists
          const threadExists = await prisma.thread.findUnique({
            where: { id: threadId }
          });

          if (!threadExists) {
            results.posts.skipped++;
            continue;
          }

          // Create new post (skip if exists with same content and thread)
          const existingPost = await prisma.post.findFirst({
            where: {
              threadId: threadId,
              content: post.content
            }
          });

          if (existingPost) {
            results.posts.skipped++;
          } else {
            await prisma.post.create({
              data: {
                content: post.content,
                userId: userId,
                threadId: threadId
              }
            });

            // Update thread post count
            await prisma.thread.update({
              where: { id: threadId },
              data: {
                postCount: { increment: 1 },
                replyCount: { increment: 1 }
              }
            });

            results.posts.imported++;
          }
        } catch (error) {
          console.error('Error importing post:', error);
        }
      }
    }

    // Clean up uploaded file
    try {
      await fs.promises.unlink(uploadedFile.filepath);
    } catch (error) {
      // Ignore cleanup errors
    }

    res.status(200).json({
      status: 'success',
      message: 'Backup imported successfully',
      results
    });
  } catch (error) {
    console.error('Error importing backup:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to import backup'
    });
  }
}
