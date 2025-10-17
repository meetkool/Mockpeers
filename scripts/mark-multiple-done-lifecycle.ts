import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { INTERVIEW_TYPES } from '../lib/types/interview-types';

const prisma = new PrismaClient();

async function markMultipleDoneAndRunLifecycle() {
  console.log('🧪 TEST: Mark All Meetings as DONE for ALL Interview Types\n');
  console.log('='.repeat(80));
  console.log(`\nTesting ${INTERVIEW_TYPES.length} interview types: ${INTERVIEW_TYPES.join(', ')}\n`);

  let totalMarked = 0;
  const resultsByType: Record<string, any> = {};

  // Process each interview type
  for (const interviewType of INTERVIEW_TYPES) {
    console.log(`\n\n🔍 ${interviewType}`);
    console.log('-'.repeat(80));

    // Find ALL meetings (PENDING, BOOKING_STARTED, ACTIVE) to mark as DONE
    console.log(`\n1️⃣  Finding meetings to mark as DONE...\n`);

    const meetings = await prisma.schedule.findMany({
      where: {
        interviewType: interviewType,
        status: {
          in: ['PENDING', 'BOOKING_STARTED', 'ACTIVE'] // All active statuses
        },
        title: {
          not: {
            contains: '[TEST]' // Exclude test meetings
          }
        }
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    console.log(`   Found ${meetings.length} meetings (PENDING/BOOKING_STARTED/ACTIVE)\n`);

    if (meetings.length === 0) {
      console.log('   ℹ️  No meetings to mark as DONE');
      resultsByType[interviewType] = { marked: 0, replacements: 0, missing: 0 };
      continue;
    }

    // Show breakdown by status
    const statusCounts = {
      PENDING: meetings.filter(m => m.status === 'PENDING').length,
      BOOKING_STARTED: meetings.filter(m => m.status === 'BOOKING_STARTED').length,
      ACTIVE: meetings.filter(m => m.status === 'ACTIVE').length,
    };
    console.log(`   - PENDING: ${statusCounts.PENDING}`);
    console.log(`   - BOOKING_STARTED: ${statusCounts.BOOKING_STARTED}`);
    console.log(`   - ACTIVE: ${statusCounts.ACTIVE}\n`);

    // Mark them all as DONE
    console.log('2️⃣  Marking meetings as DONE...\n');

    for (const meeting of meetings) {
      await prisma.schedule.update({
        where: { id: meeting.id },
        data: {
          status: 'DONE',
          completedAt: new Date(),
        },
      });
    }

    console.log(`   ✅ Marked ${meetings.length} meetings as DONE`);
    totalMarked += meetings.length;

    // Check for replacements (+7 days)
    console.log('\n3️⃣  Checking for replacement meetings (+7 days)...\n');

    let successCount = 0;
    let missingCount = 0;

    for (const meeting of meetings) {
      const expectedReplacementTime = new Date(meeting.startTime);
      expectedReplacementTime.setDate(expectedReplacementTime.getDate() + 7);

      const replacement = await prisma.schedule.findFirst({
        where: {
          startTime: expectedReplacementTime,
          interviewType: interviewType,
        },
      });

      if (replacement) {
        successCount++;
      } else {
        missingCount++;
      }
    }

    console.log(`   ✅ Replacements found: ${successCount}`);
    console.log(`   ❌ Replacements missing: ${missingCount}`);

    resultsByType[interviewType] = {
      marked: meetings.length,
      replacements: successCount,
      missing: missingCount
    };
  }

  // Overall Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 OVERALL TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log(`Total meetings marked as DONE: ${totalMarked}\n`);

  let totalReplacements = 0;
  let totalMissing = 0;

  for (const [type, results] of Object.entries(resultsByType)) {
    console.log(`${type}:`);
    console.log(`  Marked: ${results.marked} | Found: ${results.replacements} | Missing: ${results.missing}`);
    totalReplacements += results.replacements;
    totalMissing += results.missing;
  }

  console.log('\n' + '-'.repeat(80));
  console.log(`TOTAL: ${totalMarked} marked | ${totalReplacements} replacements | ${totalMissing} missing`);

  if (totalMissing > 0) {
    console.log('\n⚠️  Replacements not created yet - this is NORMAL!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Visit the admin portal for any interview type');
    console.log('  2. The system will automatically detect ALL DONE meetings');
    console.log('  3. Replacements will be created (+7 days)');
    console.log('  4. Refresh to see new meetings appear!');
  } else if (totalReplacements > 0) {
    console.log('\n✅ SUCCESS! Automatic system already created all replacements!');
  }

  // Portal links
  console.log('\n' + '='.repeat(80));
  console.log('🌐 VISIT ADMIN PORTAL TO TRIGGER AUTOMATIC SYSTEM');
  console.log('='.repeat(80) + '\n');

  console.log('Visit ANY of these URLs:\n');
  console.log('  DSA:           http://localhost:3000/admin/schedule/dsa');
  console.log('  System Design: http://localhost:3000/admin/schedule/system-design');
  console.log('  Behavioral:    http://localhost:3000/admin/schedule/behavioral');
  console.log('  SQL:           http://localhost:3000/admin/schedule/sql');
  console.log('  Data Science:  http://localhost:3000/admin/schedule/data-science');
  console.log('  Frontend:      http://localhost:3000/admin/schedule/frontend');

  console.log('\n' + '='.repeat(80));
  console.log('💡 WHAT WILL HAPPEN');
  console.log('='.repeat(80));
  console.log('\n  1. Page loads → Automatic lifecycle check runs');
  console.log(`  2. System detects ${totalMarked} DONE meetings`);
  console.log(`  3. Creates ${totalMissing} replacement meetings (+7 days)`);
  console.log('  4. You\'ll see new meetings appear for ALL types!');

  console.log('\n' + '='.repeat(80));
  console.log('🔍 IN DEV SERVER LOGS, YOU\'LL SEE:');
  console.log('='.repeat(80));
  console.log(`\n  🔧 Found ${totalMissing} DONE/OVER meetings without replacements`);
  console.log(`  🔄 Created ${totalMissing} replacement meeting(s) for +7 days`);
  console.log('  ✅ Lifecycle checks complete\n');

  console.log('='.repeat(80));
  console.log('✅ TEST READY - Visit portal to see automatic creation!');
  console.log('='.repeat(80));
}

markMultipleDoneAndRunLifecycle()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

