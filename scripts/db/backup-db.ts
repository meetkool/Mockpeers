import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

async function backupDatabase() {
  const prisma = new PrismaClient();

  try {
    // Create backups directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

    // Get all models data
    const backup: any = {
      users: await prisma.user.findMany(),
      // Add other models here
      admin: await prisma.admin.findMany(),
      schedule: await prisma.schedule.findMany(),
      // Add any other models from your schema
    };

    // Save to file
    writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log('✅ Database backup created:', backupFile);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
