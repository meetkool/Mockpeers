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

    const { userId, experienceLevel } = await request.json();
    const { id: scheduleId } = await params;

    // Validate experience level if provided
    if (experienceLevel && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(experienceLevel)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 });
    }

    // Check if user is already in this meeting
    const existing = await prisma.userMeeting.findFirst({
      where: {
        userId,
        scheduleId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already in this meeting" },
        { status: 400 }
      );
    }

    // Create the user meeting with experience level
    const userMeeting = await prisma.userMeeting.create({
      data: {
        userId,
        scheduleId,
        role: "PARTICIPANT",
        experienceLevel: experienceLevel || null,
      },
    });

    // Update schedule counting and status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        counting: {
          increment: 1,
        },
      },
    });

    // If this is the first participant, change status from PENDING to BOOKING_STARTED
    if (updatedSchedule.counting === 1 && updatedSchedule.status === 'PENDING') {
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: 'BOOKING_STARTED',
        },
      });
    }

    return NextResponse.json(userMeeting);
  } catch (error) {
    console.error("Failed to add user to meeting:", error);
    
    // Handle unique constraint violation (duplicate user)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "User is already in this meeting" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add user to meeting" },
      { status: 500 }
    );
  }
}