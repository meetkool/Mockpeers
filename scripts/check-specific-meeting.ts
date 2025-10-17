import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function checkSpecificMeeting() {
  console.log('🔍 Checking Specific Meeting for Replacement\n');
  console.log('='.repeat(80));

  // The meeting you're asking about
  const meetingId = 'cmguhlcl10000ors8ur5pfzjj';
  
  console.log(`\nLooking for meeting ID: ${meetingId}\n`);

  const meeting = await prisma.schedule.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) {
    console.log('❌ Meeting not found!');
    return;
  }

  console.log('📋 Original Meeting:');
  console.log(`   Title: ${meeting.title}`);
  console.log(`   Start: ${format(meeting.startTime, 'MMM dd, yyyy h:mm a')}`);
  console.log(`   End: ${format(meeting.endTime, 'MMM dd, yyyy h:mm a')}`);
  console.log(`   Status: ${meeting.status}`);
  console.log(`   Type: ${meeting.interviewType}`);
  console.log(`   ID: ${meeting.id}`);

  // Calculate expected replacement time (+7 days)
  const expectedReplacementStart = addDays(meeting.startTime, 7);
  const expectedReplacementEnd = addDays(meeting.endTime, 7);

  console.log('\n📅 Expected Replacement:');
  console.log(`   Should be at: ${format(expectedReplacementStart, 'MMM dd, yyyy h:mm a')}`);
  console.log(`   (Exactly +7 days from original)`);

  // Search for replacement
  console.log('\n🔎 Searching for replacement meeting...\n');

  const replacement = await prisma.schedule.findFirst({
    where: {
      startTime: expectedReplacementStart,
      interviewType: meeting.interviewType,
    },
  });

  if (replacement) {
    console.log('✅ REPLACEMENT FOUND!');
    console.log('   --------------------------------');
    console.log(`   Title: ${replacement.title}`);
    console.log(`   Start: ${format(replacement.startTime, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   End: ${format(replacement.endTime, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   Status: ${replacement.status}`);
    console.log(`   Type: ${replacement.interviewType}`);
    console.log(`   ID: ${replacement.id}`);
    console.log('   --------------------------------');
  } else {
    console.log('❌ NO REPLACEMENT FOUND');
    console.log(`   Expected at: ${format(expectedReplacementStart, 'MMM dd, yyyy h:mm a')}`);
    console.log(`   But no meeting exists at that time for ${meeting.interviewType}`);
  }

  // Also show all meetings around that time
  console.log('\n📊 All DSA Meetings Around Oct 25, 8:30 AM:');
  console.log('   --------------------------------');
  
  const startRange = addDays(meeting.startTime, 6); // Oct 24
  const endRange = addDays(meeting.startTime, 8); // Oct 26
  
  const nearbyMeetings = await prisma.schedule.findMany({
    where: {
      interviewType: meeting.interviewType,
      startTime: {
        gte: startRange,
        lte: endRange,
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  for (const m of nearbyMeetings) {
    const icon = m.id === replacement?.id ? '👉' : '  ';
    console.log(`${icon} ${format(m.startTime, 'MMM dd, h:mm a')} - ${m.title} (${m.status}) - ID: ${m.id}`);
  }

  console.log('\n' + '='.repeat(80));
  
  if (meeting.status === 'PENDING') {
    console.log('ℹ️  NOTE: This meeting is still PENDING (not yet completed)');
    console.log('   Replacement meetings are only created when status becomes DONE or OVER');
    console.log('   Current status: PENDING → No replacement needed yet\n');
  } else if (meeting.status === 'DONE' || meeting.status === 'OVER') {
    if (replacement) {
      console.log('✅ SUCCESS: Meeting completed and replacement was created!');
    } else {
      console.log('⚠️  WARNING: Meeting completed but replacement is missing!');
      console.log('   You may need to run: GET /api/schedule/status-update');
    }
  }

  console.log('='.repeat(80));
}

checkSpecificMeeting()
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

