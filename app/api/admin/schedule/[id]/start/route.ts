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

    // Only allow starting PENDING or BOOKING_STARTED meetings
    if (schedule.status !== 'PENDING' && schedule.status !== 'BOOKING_STARTED') {
      return NextResponse.json(
        { error: "Only pending or booking started meetings can be manually started" },
        { status: 400 }
      );
    }

    // Update the schedule to ACTIVE status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Meeting started successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Failed to start meeting:", error);
    return NextResponse.json(
      { error: "Failed to start meeting" },
      { status: 500 }
    );
  }
}

