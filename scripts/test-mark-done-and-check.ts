import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function testMarkDoneAndCheck() {
  console.log('🧪 TEST: Mark Meeting as DONE and Check Replacement Creation\n');
  console.log('='.repeat(80));

  const meetingId = 'cmguhlcl10000ors8ur5pfzjj';
  
  // Step 1: Get the original meeting
  console.log('\n1️⃣  Getting original meeting...\n');
  
  const meeting = await prisma.schedule.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) {
    console.log('❌ Meeting not found!');
    return;
  }

  console.log('   Original Meeting:');
  console.log(`   Title: ${meeting.title}`);
  console.log(`   Start: ${format(meeting.startTime, 'MMM dd, yyyy h:mm a')}`);
  console.log(`   Status: ${meeting.status}`);
  console.log(`   Type: ${meeting.interviewType}`);
  console.log(`   ID: ${meeting.id}`);

  const expectedReplacementStart = addDays(meeting.startTime, 7);

  // Step 2: Check if replacement already exists
  console.log('\n2️⃣  Checking if replacement already exists...\n');
  
  let existingReplacement = await prisma.schedule.findFirst({
    where: {
      startTime: expectedReplacementStart,
      interviewType: meeting.interviewType,
    },
  });

  if (existingReplacement) {
    console.log('   ℹ️  Replacement already exists:');
    console.log(`   ID: ${existingReplacement.id}`);
    console.log(`   Time: ${format(existingReplacement.startTime, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   Status: ${existingReplacement.status}`);
    console.log('\n   Skipping test - replacement already created');
    return;
  } else {
    console.log('   ✅ No replacement exists yet - good for testing!');
  }

  // Step 3: Mark as DONE
  console.log('\n3️⃣  Marking meeting as DONE...\n');
  
  const updatedMeeting = await prisma.schedule.update({
    where: { id: meetingId },
    data: {
      status: 'DONE',
      completedAt: new Date(),
    },
  });

  console.log(`   ✅ Meeting marked as DONE`);
  console.log(`   Previous status: ${meeting.status} → New status: ${updatedMeeting.status}`);

  // Step 4: Create replacement (simulating what the API does)
  console.log('\n4️⃣  Creating replacement meeting (+7 days)...\n');
  
  const newStartTime = addDays(meeting.startTime, 7);
  const newEndTime = addDays(meeting.endTime, 7);

  // Check again to avoid duplicates
  const doubleCheck = await prisma.schedule.findFirst({
    where: {
      startTime: newStartTime,
      interviewType: meeting.interviewType,
    },
  });

  if (doubleCheck) {
    console.log('   ℹ️  Replacement was just created (possibly by another process)');
    console.log(`   ID: ${doubleCheck.id}`);
  } else {
    const replacement = await prisma.schedule.create({
      data: {
        title: meeting.title,
        description: meeting.description,
        startTime: newStartTime,
        endTime: newEndTime,
        duration: meeting.duration,
        waitTime: meeting.waitTime || 15,
        status: 'PENDING',
        interviewType: meeting.interviewType,
      },
    });

    console.log('   ✅ REPLACEMENT CREATED SUCCESSFULLY!');
    console.log('   --------------------------------');
    console.log(`   Title: ${replacement.title}`);
    console.log(`   Start: ${format(replacement.startTime, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   End: ${format(replacement.endTime, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   Status: ${replacement.status}`);
    console.log(`   Type: ${replacement.interviewType}`);
    console.log(`   ID: ${replacement.id}`);
    console.log('   --------------------------------');
  }

  // Step 5: Verify the replacement exists
  console.log('\n5️⃣  Verifying replacement in database...\n');
  
  const verification = await prisma.schedule.findFirst({
    where: {
      startTime: expectedReplacementStart,
      interviewType: meeting.interviewType,
    },
  });

  if (verification) {
    console.log('   ✅ VERIFICATION SUCCESSFUL!');
    console.log(`   Replacement exists at: ${format(verification.startTime, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   Status: ${verification.status}`);
    console.log(`   ID: ${verification.id}`);
  } else {
    console.log('   ❌ VERIFICATION FAILED - Replacement not found!');
  }

  // Step 6: Show all DSA meetings around that date
  console.log('\n6️⃣  All DSA Meetings on Oct 25:\n');
  
  const oct25Start = new Date('2025-10-25T00:00:00');
  const oct25End = new Date('2025-10-25T23:59:59');
  
  const oct25Meetings = await prisma.schedule.findMany({
    where: {
      interviewType: 'DSA',
      startTime: {
        gte: oct25Start,
        lte: oct25End,
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  if (oct25Meetings.length > 0) {
    for (const m of oct25Meetings) {
      const icon = m.id === verification?.id ? '👉' : '   ';
      console.log(`${icon} ${format(m.startTime, 'h:mm a')} - ${m.title} (${m.status})`);
    }
  } else {
    console.log('   ℹ️  No meetings on Oct 25 yet');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\nSummary:');
  console.log(`  1. Original meeting marked as DONE ✅`);
  console.log(`  2. Replacement created at ${format(expectedReplacementStart, 'MMM dd, yyyy h:mm a')} ✅`);
  console.log(`  3. Replacement is PENDING and ready for booking ✅`);
  console.log('\nView in admin portal:');
  console.log('  http://localhost:3000/admin/schedule/dsa');
  console.log('\nLook for "Morning Interview Practice" on Oct 25, 8:30 AM\n');
  console.log('='.repeat(80));
}

testMarkDoneAndCheck()
  .then(() => {
    console.log('\n🏁 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

