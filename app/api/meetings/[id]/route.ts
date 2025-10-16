import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;

  try {
    if (!id) {
      return NextResponse.json(
        { error: "Meeting ID is required" }, 
        { status: 400 }
      );
    }

    const meeting = await prisma.schedule.findUnique({
      where: { id },
      include: {
        userMeetings: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const params = await context.params;
    const meetingId = params.id;

    if (!meetingId) {
      return NextResponse.json(
        { error: "Meeting ID is required" }, 
        { status: 400 }
      );
    }

    // Find the UserMeeting to verify it exists and belongs to the user
    const userMeeting = await prisma.userMeeting.findFirst({
      where: {
        id: meetingId,
        userId: session.user.id
      },
      include: {
        schedule: true
      }
    });

    if (!userMeeting) {
      return NextResponse.json(
        { error: "Meeting not found or you don't have permission to cancel it" }, 
        { status: 404 }
      );
    }

    // Check if the meeting has already started or ended
    const now = new Date();
    if (userMeeting.schedule.startTime <= now) {
      return NextResponse.json(
        { error: "Cannot cancel a meeting that has already started or ended" }, 
        { status: 400 }
      );
    }

    // Delete the UserMeeting
    await prisma.userMeeting.delete({
      where: {
        id: meetingId
      }
    });

    // Update schedule counting and status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: userMeeting.scheduleId },
      data: {
        counting: {
          decrement: 1
        }
      }
    });

    // If counting is now 0, revert status to PENDING
    if (updatedSchedule.counting === 0 && updatedSchedule.status === 'BOOKING_STARTED') {
      await prisma.schedule.update({
        where: { id: userMeeting.scheduleId },
        data: {
          status: 'PENDING'
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Meeting cancelled successfully" 
    });
  } catch (error) {
    console.error('Error canceling meeting:', error);
    return NextResponse.json(
      { error: "Failed to cancel meeting" }, 
      { status: 500 }
    );
  }
}