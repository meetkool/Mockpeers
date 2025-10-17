import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Valid interview types
const VALID_INTERVIEW_TYPES = ['DSA', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'SQL', 'DATA_SCIENCE', 'FRONTEND'] as const;
type InterviewType = typeof VALID_INTERVIEW_TYPES[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    
    // Validate interview type
    if (!VALID_INTERVIEW_TYPES.includes(type as InterviewType)) {
      return NextResponse.json({ 
        error: 'Invalid interview type. Valid types: DSA, SYSTEM_DESIGN, BEHAVIORAL, SQL, DATA_SCIENCE, FRONTEND' 
      }, { status: 400 });
    }
    
    const now = new Date();

    // Fetch schedules for the specific interview type
    const schedules = await prisma.schedule.findMany({
      where: {
        interviewType: type as InterviewType,
        startTime: { gte: now }, // Must be in the future
        status: { in: ['PENDING', 'BOOKING_STARTED'] }, // Show both pending and booking started
        bookingOpen: true, // Only show if admin hasn't manually closed bookings
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
        startTime: 'asc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Failed to fetch schedules by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

