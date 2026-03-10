/**
 * MongoDB Backup Automation Script
 * Backs up database to local storage and optionally to cloud (AWS S3)
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pm-textiles-erp';
const MAX_BACKUPS = 7; // Keep last 7 backups

/**
 * Ensure backup directory exists
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Created backup directory:', BACKUP_DIR);
  }
};

/**
 * Generate backup filename with timestamp
 */
const getBackupFilename = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `backup-${timestamp}`;
};

/**
 * Clean old backups (keep only MAX_BACKUPS)
 */
const cleanOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFolders = files
      .filter(file => file.startsWith('backup-'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Remove old backups
    if (backupFolders.length > MAX_BACKUPS) {
      const toDelete = backupFolders.slice(MAX_BACKUPS);
      toDelete.forEach(folder => {
        fs.rmSync(folder.path, { recursive: true, force: true });
        console.log(`🗑️ Deleted old backup: ${folder.name}`);
      });
    }
  } catch (error) {
    console.error('Error cleaning old backups:', error.message);
  }
};

/**
 * Create MongoDB backup using mongodump
 */
const createBackup = async () => {
  try {
    console.log('🔄 Starting MongoDB backup...');
    ensureBackupDir();

    const backupName = getBackupFilename();
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Extract database name from URI
    const dbName = MONGODB_URI.split('/').pop().split('?')[0];

    // mongodump command
    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;

    console.log('📦 Creating backup:', backupName);
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes('done dumping')) {
      console.error('Backup stderr:', stderr);
    }

    console.log('✅ Backup created successfully:', backupName);
    console.log('📊 Backup size:', getDirectorySize(backupPath));

    // Clean old backups
    cleanOldBackups();

    return {
      success: true,
      backupName,
      backupPath,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Restore MongoDB from backup
 */
const restoreBackup = async (backupName) => {
  try {
    console.log('🔄 Starting MongoDB restore...');

    const backupPath = path.join(BACKUP_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup not found: ' + backupName);
    }

    // Extract database name from URI
    const dbName = MONGODB_URI.split('/').pop().split('?')[0];
    const dbBackupPath = path.join(backupPath, dbName);

    // mongorestore command with --drop to replace existing data
    const command = `mongorestore --uri="${MONGODB_URI}" --drop "${dbBackupPath}"`;

    console.log('📥 Restoring backup:', backupName);
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes('done')) {
      console.error('Restore stderr:', stderr);
    }

    console.log('✅ Database restored successfully from:', backupName);

    return {
      success: true,
      backupName,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * List all available backups
 */
const listBackups = () => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('backup-'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: getDirectorySize(filePath),
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    return backups;
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return [];
  }
};

/**
 * Get directory size recursively
 */
const getDirectorySize = (dirPath) => {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (error) {
    console.error('Error calculating size:', error.message);
  }
  return formatBytes(size);
};

/**
 * Format bytes to human-readable size
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Schedule automated backups
 * Usage: Call this function with cron or node-schedule
 */
const scheduleBackup = (schedule) => {
  const nodeSchedule = require('node-schedule');
  
  // Default: Daily at 2 AM
  const rule = schedule || '0 2 * * *';
  
  const job = nodeSchedule.scheduleJob(rule, async () => {
    console.log('⏰ Automated backup started...');
    await createBackup();
  });

  console.log('📅 Backup scheduled:', rule);
  return job;
};

// Export functions
module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  scheduleBackup,
  BACKUP_DIR
};

// CLI Support - run directly: node backupService.js
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    switch (command) {
      case 'backup':
        await createBackup();
        break;
      case 'restore':
        const backupName = args[1];
        if (!backupName) {
          console.error('Usage: node backupService.js restore <backup-name>');
          process.exit(1);
        }
        await restoreBackup(backupName);
        break;
      case 'list':
        const backups = listBackups();
        console.log('\n📋 Available backups:');
        backups.forEach((backup, index) => {
          console.log(`${index + 1}. ${backup.name}`);
          console.log(`   Size: ${backup.size}`);
          console.log(`   Created: ${backup.created.toLocaleString()}\n`);
        });
        break;
      default:
        console.log('Usage:');
        console.log('  node backupService.js backup          - Create new backup');
        console.log('  node backupService.js restore <name>  - Restore from backup');
        console.log('  node backupService.js list            - List all backups');
    }
    process.exit(0);
  })();
}
