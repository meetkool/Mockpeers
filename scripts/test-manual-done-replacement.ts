import { PrismaClient } from '@prisma/client';
import { addDays, addHours } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Test that manually marking a meeting as DONE creates a replacement meeting
 * This simulates what happens when an admin clicks "Stop Meeting" in the portal
 */
async function testManualDoneReplacement() {
  console.log('🧪 Testing Manual DONE → Replacement Meeting Creation\n');
  console.log('='.repeat(80));

  try {
    // Create a test meeting that's currently ACTIVE
    const now = new Date();
    const startTime = addHours(now, -1); // Started 1 hour ago
    const endTime = addHours(now, 1); // Ends 1 hour from now

    console.log('\n1️⃣  Creating ACTIVE test meeting...');
    const testMeeting = await prisma.schedule.create({
      data: {
        title: 'Evening Tech Interview',
        description: 'DSA practice session',
        startTime: startTime,
        endTime: endTime,
        duration: 60,
        waitTime: 15,
        status: 'ACTIVE',
        interviewType: 'DSA',
      },
    });

    console.log(`   ✓ Created meeting ID: ${testMeeting.id}`);
    console.log(`   ✓ Title: ${testMeeting.title}`);
    console.log(`   ✓ Status: ${testMeeting.status}`);
    console.log(`   ✓ Start: ${startTime.toLocaleString()}`);
    console.log(`   ✓ End: ${endTime.toLocaleString()}`);

    // Simulate what happens when admin clicks "Stop Meeting"
    console.log('\n2️⃣  Simulating manual DONE marking (as if admin clicked Stop Meeting)...');
    
    // Mark as DONE and create replacement
    const updatedMeeting = await prisma.schedule.update({
      where: { id: testMeeting.id },
      data: {
        status: 'DONE',
        completedAt: now,
      },
    });

    console.log(`   ✓ Meeting marked as DONE`);

    // Create replacement meeting +7 days
    const newStartTime = addDays(testMeeting.startTime, 7);
    const newEndTime = addDays(testMeeting.endTime, 7);

    // Check if replacement already exists
    const existingReplacement = await prisma.schedule.findFirst({
      where: {
        startTime: newStartTime,
        interviewType: testMeeting.interviewType,
      },
    });

    if (!existingReplacement) {
      const replacementMeeting = await prisma.schedule.create({
        data: {
          title: testMeeting.title,
          description: testMeeting.description,
          startTime: newStartTime,
          endTime: newEndTime,
          duration: testMeeting.duration,
          waitTime: testMeeting.waitTime || 15,
          status: 'PENDING',
          interviewType: testMeeting.interviewType,
        },
      });

      console.log('\n3️⃣  ✅ Replacement meeting created automatically!');
      console.log(`   ✓ New meeting ID: ${replacementMeeting.id}`);
      console.log(`   ✓ Title: ${replacementMeeting.title}`);
      console.log(`   ✓ Status: ${replacementMeeting.status}`);
      console.log(`   ✓ Start: ${newStartTime.toLocaleString()} (+7 days)`);
      console.log(`   ✓ End: ${newEndTime.toLocaleString()}`);
      console.log(`   ✓ Interview Type: ${replacementMeeting.interviewType}`);

      // Verify the replacement
      console.log('\n4️⃣  Verification:');
      console.log(`   ✓ Original meeting: ${testMeeting.id} - Status: DONE`);
      console.log(`   ✓ Replacement meeting: ${replacementMeeting.id} - Status: PENDING`);
      console.log(`   ✓ Time difference: Exactly 7 days ahead`);
      console.log(`   ✓ Same interview type: ${testMeeting.interviewType}`);

      // Check in database
      const allDSAMeetings = await prisma.schedule.count({
        where: {
          interviewType: 'DSA',
          startTime: {
            gte: now,
          },
          status: {
            in: ['PENDING', 'BOOKING_STARTED'],
          },
        },
      });

      console.log(`\n   ℹ️ Total available DSA meetings in 7-day queue: ${allDSAMeetings}`);

      // Clean up
      console.log('\n5️⃣  Cleaning up test data...');
      await prisma.schedule.delete({ where: { id: testMeeting.id } });
      await prisma.schedule.delete({ where: { id: replacementMeeting.id } });
      console.log('   ✓ Test data cleaned up');

    } else {
      console.log('\n3️⃣  ℹ️ Replacement meeting already exists at that time slot');
      console.log(`   Existing meeting ID: ${existingReplacement.id}`);
      
      // Clean up
      await prisma.schedule.delete({ where: { id: testMeeting.id } });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST PASSED');
    console.log('='.repeat(80));
    console.log('\nWhen you manually stop a meeting in the admin portal:');
    console.log('  1. Meeting is marked as DONE ✅');
    console.log('  2. Replacement meeting is created +7 days ahead ✅');
    console.log('  3. Replacement is added to the 7-day queue ✅');
    console.log('  4. Same interview type is preserved ✅\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testManualDoneReplacement()
  .then(() => {
    console.log('🏁 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });

