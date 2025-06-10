import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import { deleteBackupFile } from '../../../../lib/backupStorage';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'DELETE') {
      try {
        // Validate backup ID
        if (!id || isNaN(parseInt(id))) {
          return res.status(400).json({ message: 'Invalid backup ID' });
        }

        const backupId = parseInt(id);

        // Check if backup exists
        const backup = await prisma.backup.findUnique({
          where: { id: backupId }
        });

        if (!backup) {
          return res.status(404).json({ message: 'Backup not found' });
        }

        // Delete backup file from storage
        if (backup.filename) {
          await deleteBackupFile(backup.filename);
        }

        // Delete backup from database
        await prisma.backup.delete({
          where: { id: backupId }
        });

        res.status(200).json({
          status: 'success',
          message: 'Backup deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to delete backup'
        });
      }
    } else if (req.method === 'GET') {
      try {
        // Validate backup ID
        if (!id || isNaN(parseInt(id))) {
          return res.status(400).json({ message: 'Invalid backup ID' });
        }

        const backupId = parseInt(id);

        // Get backup details from database
        const backup = await prisma.backup.findUnique({
          where: { id: backupId },
          include: {
            creator: {
              select: { id: true, username: true }
            }
          }
        });

        if (!backup) {
          return res.status(404).json({ message: 'Backup not found' });
        }

        res.status(200).json({
          status: 'success',
          backup
        });
      } catch (error) {
        console.error('Error getting backup:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to get backup details'
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in backup operations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
