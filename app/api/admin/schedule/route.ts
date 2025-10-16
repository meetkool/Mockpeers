import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { runLifecycleChecks } from '@/lib/meeting-lifecycle';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Run lifecycle checks to update statuses
    await runLifecycleChecks().catch(err => console.error('Lifecycle check failed:', err));

    // Fetch all schedules (no filtering by status or time)
    const schedules = await prisma.schedule.findMany({
      include: {
        userMeetings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc', // Upcoming meetings first (chronological order)
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Failed to fetch admin schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

