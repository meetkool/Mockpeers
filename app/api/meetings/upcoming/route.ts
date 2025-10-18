import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { runLifecycleChecks } from '@/lib/meeting-lifecycle';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run lifecycle checks in background (non-blocking)
    console.log('🔄 Running lifecycle checks in background...');
    runLifecycleChecks().catch(err => {
      console.error('❌ Lifecycle check failed:', err);
    });

    const upcomingMeetings = await prisma.userMeeting.findMany({
      where: {
        userId: session.user.id,
        schedule: {
          endTime: {
            gte: new Date(), // Show meetings that haven't ended yet (includes ongoing)
          },
          // Only show confirmed or active meetings (user has actually booked them)
          status: {
            in: ['BOOKING_STARTED', 'ACTIVE']
          }
        }
      },
      include: {
        schedule: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            duration: true,
            status: true,
            counting: true,
            interviewType: true,
          }
        }
      },
      orderBy: {
        schedule: {
          startTime: 'asc'
        }
      }
    });

    console.log(`✅ Found ${upcomingMeetings.length} upcoming meetings for user ${session.user.id}`);
    upcomingMeetings.forEach(m => {
      console.log(`  - ${m.schedule.title} | Status: ${m.schedule.status} | Start: ${m.schedule.startTime} | End: ${m.schedule.endTime}`);
    });

    return NextResponse.json(upcomingMeetings);
  } catch (error) {
    console.error('Failed to fetch upcoming meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

