import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: scheduleId } = await params;
    const { userId, experienceLevel } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already added to this schedule
    const existingUserMeeting = await prisma.userMeeting.findFirst({
      where: {
        scheduleId: scheduleId,
        userId: userId,
      },
    });

    if (existingUserMeeting) {
      return NextResponse.json(
        { error: 'User is already added to this schedule' },
        { status: 400 }
      );
    }

    // Create user meeting
    const userMeeting = await prisma.userMeeting.create({
      data: {
        scheduleId: scheduleId,
        userId: userId,
        experienceLevel: experienceLevel || 'BEGINNER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update schedule counting
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

    return NextResponse.json(userMeeting, { status: 201 });
  } catch (error) {
    console.error('Failed to add user to schedule:', error);
    return NextResponse.json(
      { error: 'Failed to add user to schedule' },
      { status: 500 }
    );
  }
}

