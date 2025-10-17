import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSchedules } from "@/lib/auto-schedule";

export async function GET() {
  try {
    // First, ensure schedules are created automatically
    console.log('🔄 Running automatic schedule creation...');
    const scheduleResult = await ensureSchedules();
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

    // 1. Update completed meetings (past end time)
    const completedUpdates = await prisma.schedule.updateMany({
      where: {
        endTime: {
          lt: now,
          gte: thirtyDaysAgo // Only update entries from last 30 days
        },
        status: {
          not: "DONE"
        }
      },
      data: {
        status: "DONE"
      }
    });

    // 2. Fix BOOKING_STARTED schedules with 0 participants - reset to PENDING
    const fixEmptyBookings = await prisma.schedule.updateMany({
      where: {
        counting: 0,
        status: "BOOKING_STARTED"
      },
      data: {
        status: "PENDING"
      }
    });

    // 3. Update schedules to BOOKING_STARTED when count >= 1 (has participants)
    const bookedUpdates = await prisma.schedule.updateMany({
      where: {
        counting: {
          gte: 1
        },
        status: "PENDING",
        startTime: {
          gte: thirtyDaysAgo // Only update entries from last 30 days
        }
      },
      data: {
        status: "BOOKING_STARTED"
      }
    });

    // 4. Cancel status for users who didn't join past meetings
    const pastSchedules = await prisma.schedule.findMany({
      where: {
        startTime: {
          lt: now,
          gte: thirtyDaysAgo // Only update entries from last 30 days
        },
        status: {
          not: "CANCELLED"
        }
      },
      include: {
        userMeetings: true
      }
    });

    let cancelledMeetings = 0;
    // Update user statuses for those who didn't join
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

    return NextResponse.json({
      message: "Status updates and schedule creation completed successfully",
      scheduleCreation: {
        created: scheduleResult.created,
        total: scheduleResult.total
      },
      updates: {
        completedMeetings: completedUpdates.count,
        fixedEmptyBookings: fixEmptyBookings.count,
        bookedMeetings: bookedUpdates.count,
        cancelledUserMeetings: cancelledMeetings
      }
    });

  } catch (error) {
    console.error("Failed to update statuses:", error);
    return NextResponse.json(
      { error: "Failed to update statuses" },
      { status: 500 }
    );
  }
}