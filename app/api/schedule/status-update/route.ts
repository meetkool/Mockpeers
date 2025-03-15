import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
          not: "COMPLETED"
        }
      },
      data: {
        status: "COMPLETED"
      }
    });

    // 2. Update schedules to BOOKED when count >= 2
    const bookedUpdates = await prisma.schedule.updateMany({
      where: {
        counting: {
          gte: 2
        },
        status: "PENDING",
        startTime: {
          gte: thirtyDaysAgo // Only update entries from last 30 days
        }
      },
      data: {
        status: "BOOKED"
      }
    });

    // 3. Cancel status for users who didn't join past meetings
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
        UserMeeting: true
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
      message: "Status updates completed successfully",
      updates: {
        completedMeetings: completedUpdates.count,
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