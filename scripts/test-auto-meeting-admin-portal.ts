import { PrismaClient } from '@prisma/client';
import { addDays, addHours, subHours } from 'date-fns';
import { INTERVIEW_TYPES } from '../lib/types/interview-types';

const prisma = new PrismaClient();

/**
 * Test that creates REAL meetings visible in the admin portal
 * This test will:
 * 1. Create meetings that already ended (in the past)
 * 2. Mark them as DONE/OVER through lifecycle checks
 * 3. Create replacement meetings in the 7-day queue
 * 4. Leave everything in place so you can see it in admin portal
 */
async function testAdminPortalAutoCreation() {
  console.log('🧪 ADMIN PORTAL AUTO-MEETING CREATION TEST\n');
  console.log('This test creates meetings you can see in the admin portal:');
  console.log('http://localhost:3000/admin/schedule/dsa');
  console.log('http://localhost:3000/admin/schedule/system-design');
  console.log('http://localhost:3000/admin/schedule/behavioral');
  console.log('http://localhost:3000/admin/schedule/sql');
  console.log('http://localhost:3000/admin/schedule/data-science');
  console.log('http://localhost:3000/admin/schedule/frontend');
  console.log('\n' + '='.repeat(80) + '\n');

  const testResults: any[] = [];

  // Test each interview type
  for (const interviewType of INTERVIEW_TYPES) {
    console.log(`\n🔍 Testing ${interviewType}`);
    console.log('-'.repeat(80));

    try {
      // 1. Create a meeting that already ended (2 hours ago to 1 hour ago)
      const pastStart = subHours(new Date(), 2);
      const pastEnd = subHours(new Date(), 1);

      console.log(`\n1️⃣  Creating past meeting (should be marked DONE)...`);
      const doneMeeting = await prisma.schedule.create({
        data: {
          title: `[TEST] ${interviewType} - Should be DONE`,
          description: `This meeting ended 1 hour ago - should be marked DONE and spawn replacement +7 days`,
          startTime: pastStart,
          endTime: pastEnd,
          duration: 60,
          waitTime: 15,
          status: 'ACTIVE', // Will be marked DONE by lifecycle
          interviewType: interviewType,
        },
      });

      console.log(`   ✓ Created meeting ID: ${doneMeeting.id}`);
      console.log(`   ✓ Title: ${doneMeeting.title}`);
      console.log(`   ✓ Time: ${pastStart.toLocaleString()} - ${pastEnd.toLocaleString()}`);
      console.log(`   ✓ Status: ${doneMeeting.status}`);

      // 2. Create a PENDING meeting that expired (never started)
      const expiredStart = subHours(new Date(), 3);
      const expiredEnd = subHours(new Date(), 2);

      console.log(`\n2️⃣  Creating expired PENDING meeting (should be marked OVER)...`);
      const overMeeting = await prisma.schedule.create({
        data: {
          title: `[TEST] ${interviewType} - Should be OVER`,
          description: `This meeting expired without starting - should be marked OVER and spawn replacement +7 days`,
          startTime: expiredStart,
          endTime: expiredEnd,
          duration: 60,
          waitTime: 15,
          status: 'PENDING', // Will be marked OVER by lifecycle
          interviewType: interviewType,
        },
      });

      console.log(`   ✓ Created meeting ID: ${overMeeting.id}`);
      console.log(`   ✓ Title: ${overMeeting.title}`);
      console.log(`   ✓ Time: ${expiredStart.toLocaleString()} - ${expiredEnd.toLocaleString()}`);
      console.log(`   ✓ Status: ${overMeeting.status}`);

      testResults.push({
        interviewType,
        doneMeetingId: doneMeeting.id,
        overMeetingId: overMeeting.id,
        created: true,
      });

    } catch (error) {
      console.error(`   ❌ Error creating meetings for ${interviewType}:`, error);
      testResults.push({
        interviewType,
        error: error,
      });
    }
  }

  // 3. Trigger lifecycle checks (this is what runs automatically in production)
  console.log('\n\n' + '='.repeat(80));
  console.log('🔄 Running Lifecycle Checks (marking meetings as DONE/OVER)...\n');
  
  try {
    // Import and run lifecycle checks
    const { runLifecycleChecks } = await import('../lib/meeting-lifecycle');
    const lifecycleResults = await runLifecycleChecks();
    
    console.log('\n✅ Lifecycle checks completed:');
    console.log(`   - Fixed PENDING meetings: ${lifecycleResults.fixed}`);
    console.log(`   - Activated meetings: ${lifecycleResults.activated}`);
    console.log(`   - Completed meetings (DONE): ${lifecycleResults.completed}`);
    console.log(`   - Expired meetings (OVER): ${lifecycleResults.expired}`);
    
  } catch (error) {
    console.error('❌ Error running lifecycle checks:', error);
  }

  // 4. Verify and display results
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 VERIFICATION - Check these in the Admin Portal\n');

  for (const result of testResults) {
    if (result.error) continue;

    console.log(`\n${result.interviewType}:`);
    console.log('-'.repeat(40));

    // Check DONE meeting
    const doneCheck = await prisma.schedule.findUnique({
      where: { id: result.doneMeetingId },
    });

    if (doneCheck) {
      console.log(`\n  DONE Meeting:`);
      console.log(`    ID: ${doneCheck.id}`);
      console.log(`    Title: ${doneCheck.title}`);
      console.log(`    Status: ${doneCheck.status} ${doneCheck.status === 'DONE' ? '✅' : '❌'}`);
      console.log(`    Time: ${doneCheck.startTime.toLocaleString()}`);

      // Check for replacement meeting (+7 days)
      const replacementStart = addDays(doneCheck.startTime, 7);
      const doneReplacement = await prisma.schedule.findFirst({
        where: {
          startTime: replacementStart,
          interviewType: result.interviewType,
          title: doneCheck.title,
        },
      });

      if (doneReplacement) {
        console.log(`\n  ✅ Replacement Meeting Created:`);
        console.log(`    ID: ${doneReplacement.id}`);
        console.log(`    Status: ${doneReplacement.status}`);
        console.log(`    Time: ${doneReplacement.startTime.toLocaleString()} (+7 days)`);
      } else {
        console.log(`\n  ❌ No replacement meeting found for DONE status`);
      }
    }

    // Check OVER meeting
    const overCheck = await prisma.schedule.findUnique({
      where: { id: result.overMeetingId },
    });

    if (overCheck) {
      console.log(`\n  OVER Meeting:`);
      console.log(`    ID: ${overCheck.id}`);
      console.log(`    Title: ${overCheck.title}`);
      console.log(`    Status: ${overCheck.status} ${overCheck.status === 'OVER' ? '✅' : '❌'}`);
      console.log(`    Time: ${overCheck.startTime.toLocaleString()}`);

      // Check for replacement meeting (+7 days)
      const replacementStart = addDays(overCheck.startTime, 7);
      const overReplacement = await prisma.schedule.findFirst({
        where: {
          startTime: replacementStart,
          interviewType: result.interviewType,
          title: overCheck.title,
        },
      });

      if (overReplacement) {
        console.log(`\n  ✅ Replacement Meeting Created:`);
        console.log(`    ID: ${overReplacement.id}`);
        console.log(`    Status: ${overReplacement.status}`);
        console.log(`    Time: ${overReplacement.startTime.toLocaleString()} (+7 days)`);
      } else {
        console.log(`\n  ❌ No replacement meeting found for OVER status`);
      }
    }
  }

  // 5. Display admin portal links
  console.log('\n\n' + '='.repeat(80));
  console.log('🌐 VIEW RESULTS IN ADMIN PORTAL');
  console.log('='.repeat(80));
  console.log('\nOpen these URLs to see the test meetings:\n');
  
  for (const type of INTERVIEW_TYPES) {
    const urlPath = type.toLowerCase().replace('_', '-');
    console.log(`  ${type}:`);
    console.log(`    http://localhost:3000/admin/schedule/${urlPath}`);
  }

  console.log('\n\nLook for meetings with [TEST] in the title:');
  console.log('  - "[TEST] XXX - Should be DONE" - Status should show DONE (gray)');
  console.log('  - "[TEST] XXX - Should be OVER" - Status should show OVER (red)');
  console.log('  - Replacement meetings +7 days ahead with Status PENDING (blue)\n');

  // 6. Count total meetings created
  const totalTest = await prisma.schedule.count({
    where: {
      title: {
        contains: '[TEST]',
      },
    },
  });

  console.log(`\n📈 Total test meetings in database: ${totalTest}`);
  console.log('   (Original meetings marked as DONE/OVER + Replacement meetings)\n');

  // 7. Cleanup instructions
  console.log('='.repeat(80));
  console.log('🧹 CLEANUP');
  console.log('='.repeat(80));
  console.log('\nTo remove all test meetings after verification, run:');
  console.log('  npx tsx scripts/cleanup-test-meetings.ts\n');

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\nThe automatic meeting creation system is working if you see:');
  console.log('  1. Original meetings marked as DONE/OVER');
  console.log('  2. New replacement meetings created +7 days ahead');
  console.log('  3. All visible in the admin portal\n');
}

// Create cleanup script as well
async function createCleanupScript() {
  const cleanupScript = `import { PrismaClient } from '@prisma/client';

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

  console.log(\`✅ Deleted \${result.count} test meetings\`);
  await prisma.$disconnect();
}

cleanup();
`;

  const fs = await import('fs');
  fs.writeFileSync('scripts/cleanup-test-meetings.ts', cleanupScript);
  console.log('✅ Created cleanup script: scripts/cleanup-test-meetings.ts\n');
}

// Run the test
async function main() {
  await createCleanupScript();
  await testAdminPortalAutoCreation();
}

main()
  .then(() => {
    console.log('🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

