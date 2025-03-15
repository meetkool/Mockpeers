
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

async function resetMigrations() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Starting migration reset process...');

    // First backup the database
    console.log('📦 Creating database backup...');
    execSync('npm run db:backup', { stdio: 'inherit' });

    // Read and execute the consolidated migration SQL
    console.log('🔨 Applying consolidated migration...');
    const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', 'consolidated_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the SQL directly using Prisma
    await prisma.$executeRawUnsafe(migrationSQL);

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npm run db:generate', { stdio: 'inherit' });

    // Deploy migrations
    console.log('📤 Deploying migrations...');
    execSync('npm run db:deploy', { stdio: 'inherit' });

    console.log('✅ Migration reset completed successfully!');

  } catch (error) {
    console.error('❌ Migration reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetMigrations();
