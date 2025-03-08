import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

async function restoreDatabase() {
  const prisma = new PrismaClient();

  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Get list of backup files
    const backups = readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse();

    if (backups.length === 0) {
      throw new Error('No backup files found');
    }

    // Use latest backup by default
    const backupFile = path.join(backupDir, backups[0]);
    const backup = JSON.parse(readFileSync(backupFile, 'utf-8'));

    // Start transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Restore users
      if (backup.users?.length) {
        await tx.user.deleteMany({});
        for (const user of backup.users) {
          await tx.user.create({
            data: user
          });
        }
      }

      // Restore admin
      if (backup.admin?.length) {
        await tx.admin.deleteMany({});
        for (const admin of backup.admin) {
          await tx.admin.create({
            data: admin
          });
        }
      }

      // Restore schedule
      if (backup.schedule?.length) {
        await tx.schedule.deleteMany({});
        for (const schedule of backup.schedule) {
          await tx.schedule.create({
            data: schedule
          });
        }
      }
    });

    console.log('✅ Database restored from:', backupFile);

  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
