import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const id = params.id;

  try {
    if (!id) {
      return NextResponse.json(
        { error: "Meeting ID is required" }, 
        { status: 400 }
      );
    }

    const meeting = await prisma.schedule.findUnique({
      where: { id },
      include: {
        UserMeeting: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}