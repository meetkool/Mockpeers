import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

async function safeMigrate() {
  try {
    // Create migrations directory if it doesn't exist
    const migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!existsSync(migrationDir)) {
      mkdirSync(migrationDir, { recursive: true });
    }

    // Create safe SQL migration
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const migrationName = `migration_${timestamp}`;
    const migrationPath = path.join(migrationDir, `${migrationName}.sql`);

    // Execute prisma format to get schema changes
    execSync('npx prisma format', { stdio: 'inherit' });

    // Create empty migration file
    writeFileSync(migrationPath, '-- Safe migration file\n');

    console.log('✅ Safe migration file created:', migrationPath);
    console.log('📝 Please add your safe SQL commands to this file');
    console.log('⚡ Then run: npm run db:deploy');

  } catch (error) {
    console.error('❌ Migration creation failed:', error);
    process.exit(1);
  }
}

safeMigrate();