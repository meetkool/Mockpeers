import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { runLifecycleChecks } from '@/lib/meeting-lifecycle';

// Valid interview types
const VALID_INTERVIEW_TYPES = ['DSA', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'SQL', 'DATA_SCIENCE', 'FRONTEND'] as const;
type InterviewType = typeof VALID_INTERVIEW_TYPES[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { type } = await params;
    
    // Validate interview type
    if (!VALID_INTERVIEW_TYPES.includes(type as InterviewType)) {
      return NextResponse.json({ 
        error: 'Invalid interview type. Valid types: DSA, SYSTEM_DESIGN, BEHAVIORAL, SQL, DATA_SCIENCE, FRONTEND' 
      }, { status: 400 });
    }

    // Run lifecycle checks to update statuses
    await runLifecycleChecks().catch(err => console.error('Lifecycle check failed:', err));

    // Fetch all schedules for the specific interview type (no filtering by status or time)
    const schedules = await prisma.schedule.findMany({
      where: {
        interviewType: type as InterviewType,
      },
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
    console.error('Failed to fetch admin schedules by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
