import { prisma } from "@/lib/prisma";

async function cleanupHistoricalMeetings() {
  try {
    const now = new Date();

    console.log("Starting historical cleanup...");

    // 1. Update all past completed meetings
    const completedUpdates = await prisma.schedule.updateMany({
      where: {
        endTime: {
          lt: now
        },
        status: {
          not: "COMPLETED"
        }
      },
      data: {
        status: "COMPLETED"
      }
    });

    console.log(`Updated ${completedUpdates.count} completed meetings`);

    // 2. Update all meetings with 2+ participants to BOOKED
    const bookedUpdates = await prisma.schedule.updateMany({
      where: {
        counting: {
          gte: 2
        },
        status: "PENDING"
      },
      data: {
        status: "BOOKED"
      }
    });

    console.log(`Updated ${bookedUpdates.count} booked meetings`);

    // 3. Cancel all past no-shows
    const pastSchedules = await prisma.schedule.findMany({
      where: {
        startTime: {
          lt: now
        }
      },
      include: {
        UserMeeting: true
      }
    });

    let cancelledMeetings = 0;
    for (const schedule of pastSchedules) {
      const updateResult = await prisma.userMeeting.updateMany({
        where: {
          scheduleId: schedule.id,
          status: "JOINED",
          leftAt: null
        },
        data: {
          status: "CANCELLED",
          leftAt: schedule.endTime
        }
      });
      cancelledMeetings += updateResult.count;
    }

    console.log(`Cancelled ${cancelledMeetings} user meetings`);
    console.log("Historical cleanup completed successfully");

  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupHistoricalMeetings();