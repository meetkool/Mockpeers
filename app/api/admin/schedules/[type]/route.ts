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

    // Get pagination and filter parameters from query
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const cursor = searchParams.get('cursor'); // For cursor-based pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Default 20, max 50

    // Run lifecycle checks in background (non-blocking)
    runLifecycleChecks().catch(err => console.error('Lifecycle check failed:', err));

    // Build where clause with optional status filter
    const whereClause: any = {
      interviewType: type as InterviewType,
    };

    // Add status filter if provided
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    // Fetch schedules with cursor-based pagination
    // OPTIMIZED: Paginated queries - only fetch what's needed!
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        duration: true,
        waitTime: true,
        status: true,
        bookingOpen: true,
        interviewType: true,
        counting: true,
        createdAt: true,
        _count: {
          select: {
            userMeetings: true  // Just count, not fetch all data
          }
        },
        // Only fetch minimal user data for display
        userMeetings: {
          select: {
            id: true,
            experienceLevel: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          take: 10  // Limit to first 10 participants for list view
        }
      },
      orderBy: {
        startTime: 'desc', // Most recent first for admin view
      },
      take: limit + 1,  // Fetch one extra to check if there are more
      ...(cursor && {
        skip: 1,  // Skip the cursor item itself
        cursor: {
          id: cursor,
        },
      }),
    });

    // Check if there are more items
    const hasMore = schedules.length > limit;
    const items = hasMore ? schedules.slice(0, limit) : schedules;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Return paginated response
    return NextResponse.json({
      items,
      pagination: {
        nextCursor,
        hasMore,
        limit,
        count: items.length,
      }
    });
  } catch (error) {
    console.error('Failed to fetch admin schedules by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
