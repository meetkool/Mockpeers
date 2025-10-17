import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';
import { INTERVIEW_TYPES } from '../lib/types/interview-types';

const prisma = new PrismaClient();

/**
 * Check EXISTING meetings and verify if replacement meetings are created
 * This analyzes your actual production data, not fake test data
 */
async function checkExistingMeetingsReplacement() {
  console.log('🔍 CHECKING EXISTING MEETINGS FOR AUTOMATIC REPLACEMENT\n');
  console.log('This checks your REAL scheduled meetings, not test data');
  console.log('='.repeat(80) + '\n');

  for (const interviewType of INTERVIEW_TYPES) {
    console.log(`\n📋 ${interviewType} Meetings`);
    console.log('-'.repeat(80));

    // Get all DONE and OVER meetings for this type
    const completedMeetings = await prisma.schedule.findMany({
      where: {
        interviewType: interviewType,
        status: {
          in: ['DONE', 'OVER'],
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10, // Check last 10 completed meetings
    });

    if (completedMeetings.length === 0) {
      console.log('  ℹ️  No DONE/OVER meetings found yet');
      continue;
    }

    console.log(`\n  Found ${completedMeetings.length} completed meetings (DONE/OVER)`);
    console.log('  Checking if replacements were created...\n');

    let replacementCount = 0;
    let missingCount = 0;

    for (const meeting of completedMeetings) {
      const expectedReplacementTime = addDays(meeting.startTime, 7);
      
      // Check if replacement exists
      const replacement = await prisma.schedule.findFirst({
        where: {
          startTime: expectedReplacementTime,
          interviewType: interviewType,
        },
      });

      const statusIcon = meeting.status === 'DONE' ? '✅' : '⚠️';
      const timeStr = format(meeting.startTime, 'MMM dd, yyyy h:mm a');
      const replacementTimeStr = format(expectedReplacementTime, 'MMM dd, yyyy h:mm a');

      if (replacement) {
        console.log(`  ${statusIcon} ${meeting.status} | ${timeStr}`);
        console.log(`     → Replacement: ✅ EXISTS at ${replacementTimeStr} (${replacement.status})`);
        console.log(`     → Meeting ID: ${meeting.id}`);
        console.log(`     → Replacement ID: ${replacement.id}\n`);
        replacementCount++;
      } else {
        console.log(`  ${statusIcon} ${meeting.status} | ${timeStr}`);
        console.log(`     → Replacement: ❌ MISSING at ${replacementTimeStr}`);
        console.log(`     → Meeting ID: ${meeting.id}\n`);
        missingCount++;
      }
    }

    // Summary
    console.log('  ' + '-'.repeat(40));
    console.log(`  Summary: ${replacementCount} have replacements, ${missingCount} missing`);
    
    if (missingCount > 0) {
      console.log(`  ⚠️  ${missingCount} meetings need replacements created!`);
    } else {
      console.log(`  ✅ All completed meetings have replacements!`);
    }
  }

  // Overall statistics
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 OVERALL STATISTICS');
  console.log('='.repeat(80) + '\n');

  for (const interviewType of INTERVIEW_TYPES) {
    const total = await prisma.schedule.count({
      where: { interviewType },
    });

    const pending = await prisma.schedule.count({
      where: { interviewType, status: 'PENDING' },
    });

    const active = await prisma.schedule.count({
      where: { interviewType, status: 'ACTIVE' },
    });

    const bookingStarted = await prisma.schedule.count({
      where: { interviewType, status: 'BOOKING_STARTED' },
    });

    const done = await prisma.schedule.count({
      where: { interviewType, status: 'DONE' },
    });

    const over = await prisma.schedule.count({
      where: { interviewType, status: 'OVER' },
    });

    const futureAvailable = await prisma.schedule.count({
      where: {
        interviewType,
        status: { in: ['PENDING', 'BOOKING_STARTED'] },
        startTime: { gte: new Date() },
      },
    });

    console.log(`${interviewType}:`);
    console.log(`  Total: ${total} | Available: ${futureAvailable} | PENDING: ${pending} | BOOKING_STARTED: ${bookingStarted}`);
    console.log(`  ACTIVE: ${active} | DONE: ${done} | OVER: ${over}\n`);
  }

  // Check 7-day queue health
  console.log('='.repeat(80));
  console.log('🗓️  7-DAY QUEUE HEALTH CHECK');
  console.log('='.repeat(80) + '\n');

  const now = new Date();
  const sevenDaysLater = addDays(now, 7);

  for (const interviewType of INTERVIEW_TYPES) {
    const queueCount = await prisma.schedule.count({
      where: {
        interviewType,
        status: { in: ['PENDING', 'BOOKING_STARTED'] },
        startTime: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
    });

    const health = queueCount >= 5 ? '✅' : queueCount >= 3 ? '⚠️' : '❌';
    console.log(`  ${health} ${interviewType}: ${queueCount} available meetings in next 7 days`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');

  console.log('If you see MISSING replacements:');
  console.log('  1. Run lifecycle checks: GET /api/schedule/status-update');
  console.log('  2. Or wait for automatic periodic check to run');
  console.log('  3. Fix is already deployed in: app/api/admin/schedule/[id]/end/route.ts\n');

  console.log('To manually trigger replacement creation:');
  console.log('  - Open your browser: http://localhost:3000/api/schedule/status-update');
  console.log('  - Or run: curl http://localhost:3000/api/schedule/status-update\n');

  console.log('View meetings in admin portal:');
  for (const type of INTERVIEW_TYPES) {
    const urlPath = type.toLowerCase().replace('_', '-');
    console.log(`  - ${type}: http://localhost:3000/admin/schedule/${urlPath}`);
  }

  console.log('\n' + '='.repeat(80));
}

// Run the check
checkExistingMeetingsReplacement()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

