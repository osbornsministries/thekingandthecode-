import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db/db';
import { users, tickets, transactions } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

export class BackupService {
  
  static async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;
      
      // 1. Fetch All Data
      const allUsers = await db.select().from(users);
      const allTickets = await db.select().from(tickets);
      const allTransactions = await db.select().from(transactions);

      const backupData = {
        metadata: {
          timestamp: new Date(),
          version: '1.0',
          counts: {
            users: allUsers.length,
            tickets: allTickets.length,
            transactions: allTransactions.length
          }
        },
        data: {
          users: allUsers,
          tickets: allTickets,
          transactions: allTransactions
        }
      };

      // 2. Determine Storage Path (Local 'backups' folder for now)
      // In production (Vercel/AWS), you would upload this to S3/Blob Storage instead of fs
      const backupDir = path.join(process.cwd(), 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const filePath = path.join(backupDir, filename);

      // 3. Write File
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      console.log(`✅ Backup created: ${filename}`);
      return { success: true, filename, stats: backupData.metadata.counts };

    } catch (error) {
      console.error('❌ Backup failed:', error);
      return { success: false, error: 'Backup generation failed' };
    }
  }

  static async listBackups() {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
    
    // Return file details
    return files.map(file => {
      const stats = fs.statSync(path.join(backupDir, file));
      return {
        name: file,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        date: stats.birthtime
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first
  }
}