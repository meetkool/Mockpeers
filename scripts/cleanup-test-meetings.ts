import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up test meetings...');
  
  const result = await prisma.schedule.deleteMany({
    where: {
      title: {
        contains: '[TEST]',
      },
    },
  });

  console.log(`✅ Deleted ${result.count} test meetings`);
  await prisma.$disconnect();
}

cleanup();
