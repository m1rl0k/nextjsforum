import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const saveBackupFile = async (filename, data) => {
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    const jsonData = JSON.stringify(data, null, 2);
    
    await fs.promises.writeFile(filePath, jsonData, 'utf8');
    
    return {
      filePath,
      size: Buffer.byteLength(jsonData, 'utf8')
    };
  } catch (error) {
    console.error('Error saving backup file:', error);
    throw new Error('Failed to save backup file');
  }
};

export const getBackupFile = async (filename) => {
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }
    
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading backup file:', error);
    throw new Error('Failed to read backup file');
  }
};

export const deleteBackupFile = async (filename) => {
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting backup file:', error);
    // Don't throw error for file deletion failures
  }
};

export const getBackupFileStream = (filename) => {
  const filePath = path.join(BACKUP_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }
  
  return fs.createReadStream(filePath);
};
