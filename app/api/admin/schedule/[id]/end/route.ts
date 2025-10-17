import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { addDays } from "date-fns";

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

    // Create replacement meeting +7 days ahead
    console.log(`📅 Creating replacement meeting for manually ended meeting: ${schedule.title}`);
    const newStartTime = addDays(schedule.startTime, 7);
    const newEndTime = addDays(schedule.endTime, 7);

    // Check if a meeting already exists at this exact time and type
    const existingMeeting = await prisma.schedule.findFirst({
      where: {
        startTime: newStartTime,
        interviewType: schedule.interviewType,
      },
    });

    if (!existingMeeting) {
      const replacementMeeting = await prisma.schedule.create({
        data: {
          title: schedule.title,
          description: schedule.description,
          startTime: newStartTime,
          endTime: newEndTime,
          duration: schedule.duration,
          waitTime: schedule.waitTime || 15,
          status: 'PENDING',
          interviewType: schedule.interviewType,
        },
      });
      console.log(`✅ Replacement meeting created: ${replacementMeeting.id} at ${newStartTime.toISOString()}`);
    } else {
      console.log(`ℹ️ Meeting already exists at ${newStartTime.toISOString()}, skipping creation`);
    }

    return NextResponse.json({
      success: true,
      message: "Meeting ended successfully and replacement meeting created",
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
