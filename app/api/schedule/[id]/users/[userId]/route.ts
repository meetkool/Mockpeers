import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: scheduleId, userId } = await params;

    // Check if user meeting exists
    const userMeeting = await prisma.userMeeting.findFirst({
      where: {
        scheduleId,
        userId,
      },
    });

    if (!userMeeting) {
      return NextResponse.json(
        { error: "User is not in this meeting" },
        { status: 404 }
      );
    }

    // Delete the user meeting(s)
    await prisma.userMeeting.deleteMany({
      where: {
        scheduleId,
        userId,
      },
    });

    // Get the current schedule to check counting
    const currentSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!currentSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Only decrement if counting is greater than 0 (prevent negative values)
    if (currentSchedule.counting > 0) {
      const updatedSchedule = await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          counting: {
            decrement: 1,
          },
        },
      });

      // If counting is now 0, revert status to PENDING
      if (updatedSchedule.counting === 0 && updatedSchedule.status === 'BOOKING_STARTED') {
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            status: 'PENDING',
          },
        });
      }
    } else {
      // Counting is already 0 or negative, fix it by counting actual UserMeetings
      const actualCount = await prisma.userMeeting.count({
        where: { scheduleId },
      });

      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          counting: actualCount,
          status: actualCount > 0 ? 'BOOKING_STARTED' : 'PENDING',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove user from meeting:", error);
    return NextResponse.json(
      { error: "Failed to remove user from meeting" },
      { status: 500 }
    );
  }
}