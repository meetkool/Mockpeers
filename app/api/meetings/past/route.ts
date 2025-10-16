import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { runLifecycleChecks } from '@/lib/meeting-lifecycle';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination params from URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50); // Max 50 per page
    const skip = (page - 1) * limit;

    // Run lifecycle checks to update meeting statuses
    console.log('🔄 Running lifecycle checks before fetching past meetings...');
    await runLifecycleChecks().catch(err => {
      console.error('❌ Lifecycle check failed:', err);
    });

    // Get total count for pagination
    const totalCount = await prisma.userMeeting.count({
      where: {
        userId: session.user.id,
        schedule: {
          status: {
            in: ['DONE', 'OVER', 'CANCELLED']
          }
        }
      }
    });

    // Fetch past meetings
    const pastMeetings = await prisma.userMeeting.findMany({
      where: {
        userId: session.user.id,
        schedule: {
          status: {
            in: ['DONE', 'OVER', 'CANCELLED']
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
            description: true,
          }
        }
      },
      orderBy: {
        schedule: {
          startTime: 'desc' // Most recent first
        }
      },
      skip,
      take: limit,
    });

    console.log(`✅ Found ${pastMeetings.length} past meetings for user ${session.user.id} (page ${page})`);

    return NextResponse.json({
      meetings: pastMeetings,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Failed to fetch past meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch past meetings' }, { status: 500 });
  }
}

