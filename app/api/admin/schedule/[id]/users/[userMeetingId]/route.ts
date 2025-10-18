import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userMeetingId: string }> }
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

    const { id: scheduleId, userMeetingId } = await params;

    // Check if user meeting exists
    const userMeeting = await prisma.userMeeting.findUnique({
      where: { id: userMeetingId },
    });

    if (!userMeeting) {
      return NextResponse.json(
        { error: 'User meeting not found' },
        { status: 404 }
      );
    }

    // Verify that the user meeting belongs to the specified schedule
    if (userMeeting.scheduleId !== scheduleId) {
      return NextResponse.json(
        { error: 'User meeting does not belong to this schedule' },
        { status: 400 }
      );
    }

    // Delete the user meeting
    await prisma.userMeeting.delete({
      where: { id: userMeetingId },
    });

    return NextResponse.json(
      { message: 'User removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to remove user from schedule:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from schedule' },
      { status: 500 }
    );
  }
}

