import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, startTime, endTime, description, meetingUrl } = body;

    // Calculate duration in minutes
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    const schedule = await prisma.schedule.create({
      data: {
        title,
        startTime: start,
        endTime: end,
        description,
        meetingUrl,
        duration: durationInMinutes,
        // counting will default to 0
        // TODO: Implement counting logic when interview booking system is built
        // counting will increment when a user books this slot
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json([], { status: 500 }); // Return empty array on error
  }
}
