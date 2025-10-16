import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { id: scheduleId } = await params;

    // Get the schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Only allow reopening for PENDING or BOOKING_STARTED meetings
    if (schedule.status !== 'PENDING' && schedule.status !== 'BOOKING_STARTED') {
      return NextResponse.json({ 
        error: 'Can only reopen PENDING or BOOKING_STARTED meetings' 
      }, { status: 400 });
    }

    // Simply set bookingOpen to true (don't change meeting time)
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        bookingOpen: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking reopened manually by admin',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Failed to reopen booking:', error);
    return NextResponse.json(
      { error: 'Failed to reopen booking' },
      { status: 500 }
    );
  }
}

