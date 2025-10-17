import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

async function checkOct20() {
  console.log('📋 Checking Oct 20 Meeting Status\n');

  const oct20Start = new Date('2025-10-20T00:00:00');
  const oct20End = new Date('2025-10-20T23:59:59');

  const meetings = await prisma.schedule.findMany({
    where: {
      interviewType: 'DSA',
      startTime: {
        gte: oct20Start,
        lte: oct20End,
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  console.log(`Found ${meetings.length} DSA meetings on Oct 20:\n`);

  for (const m of meetings) {
    console.log(`  ${format(m.startTime, 'h:mm a')} - ${m.title}`);
    console.log(`    Status: ${m.status}`);
    console.log(`    ID: ${m.id}\n`);
  }

  await prisma.$disconnect();
}

checkOct20();

