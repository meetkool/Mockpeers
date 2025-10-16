import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewType, practiceType, experienceLevel } = await request.json();
    const { id: scheduleId } = await params;

    // Validate experience level if provided
    if (experienceLevel && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(experienceLevel)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 });
    }

    // Check if schedule exists and is available
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        userMeetings: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Only allow booking for PENDING or BOOKING_STARTED meetings
    if (schedule.status !== 'PENDING' && schedule.status !== 'BOOKING_STARTED') {
      return NextResponse.json({ error: 'Schedule is not available for booking' }, { status: 400 });
    }

    // Check if booking is open (admin control)
    if (!schedule.bookingOpen) {
      return NextResponse.json({ error: 'Booking has been closed by admin' }, { status: 400 });
    }

    // Check if user already booked this schedule
    const existingBooking = await prisma.userMeeting.findFirst({
      where: {
        userId: session.user.id,
        scheduleId: scheduleId
      }
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'You have already booked this interview' }, { status: 400 });
    }

    // Create user meeting with experience level
    const userMeeting = await prisma.userMeeting.create({
      data: {
        userId: session.user.id,
        scheduleId: scheduleId,
        role: 'PARTICIPANT',
        status: 'JOINED',
        experienceLevel: experienceLevel || null, // Save chosen level for THIS meeting
      },
      include: {
        schedule: true
      }
    });

    // Update schedule counting and status
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        counting: {
          increment: 1
        },
        // Update status to BOOKING_STARTED when first participant joins
        status: 'BOOKING_STARTED'
      }
    });

    return NextResponse.json(userMeeting, { status: 201 });
  } catch (error) {
    console.error('Failed to book interview:', error);
    return NextResponse.json({ error: 'Failed to book interview' }, { status: 500 });
  }
}

