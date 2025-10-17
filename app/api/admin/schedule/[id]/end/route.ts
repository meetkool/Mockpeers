import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: scheduleId } = await params;

    // Find the schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Allow ending ACTIVE or BOOKING_STARTED meetings
    if (schedule.status !== 'ACTIVE' && schedule.status !== 'BOOKING_STARTED') {
      return NextResponse.json(
        { error: "Only active or booking started meetings can be stopped" },
        { status: 400 }
      );
    }

    // Update the schedule to DONE status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: 'DONE',
        completedAt: new Date(),
      },
    });

    // Update all user meetings to mark them as left
    await prisma.userMeeting.updateMany({
      where: {
        scheduleId: scheduleId,
        status: 'JOINED',
        leftAt: null,
      },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Meeting ended successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Failed to end meeting:", error);
    return NextResponse.json(
      { error: "Failed to end meeting" },
      { status: 500 }
    );
  }
}
