import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixScheduleCountingAndStatus() {
  console.log('🔧 Starting to fix schedule counting and status...\n');

  try {
    // Get all schedules
    const schedules = await prisma.schedule.findMany({
      include: {
        userMeetings: true,
      },
    });

    let fixedCount = 0;
    let statusChangedCount = 0;

    for (const schedule of schedules) {
      const actualCount = schedule.userMeetings.length;
      const currentCount = schedule.counting;
      const currentStatus = schedule.status;

      // Determine correct status
      let correctStatus = currentStatus;
      if (actualCount > 0 && currentStatus === 'PENDING') {
        correctStatus = 'BOOKING_STARTED';
      } else if (actualCount === 0 && currentStatus === 'BOOKING_STARTED') {
        correctStatus = 'PENDING';
      }

      // Update if needed
      if (currentCount !== actualCount || currentStatus !== correctStatus) {
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            counting: actualCount,
            status: correctStatus,
          },
        });

        console.log(`✅ Fixed: ${schedule.title}`);
        console.log(`   Counting: ${currentCount} → ${actualCount}`);
        console.log(`   Status: ${currentStatus} → ${correctStatus}`);
        console.log(`   Participants: ${actualCount}\n`);

        fixedCount++;
        if (currentStatus !== correctStatus) {
          statusChangedCount++;
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Fixed ${fixedCount} schedules`);
    console.log(`📊 Status changed for ${statusChangedCount} schedules`);
    console.log(`📝 Total schedules checked: ${schedules.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error fixing schedules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixScheduleCountingAndStatus()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

