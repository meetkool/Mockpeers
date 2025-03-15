import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const body = await request.json();
    const { title, startTime, endTime, description, meetingUrl } = body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return NextResponse.json({ 
        error: "Missing required fields: title, startTime, endTime" 
      }, { status: 400 });
    }

    // Calculate duration in minutes
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    // Validate duration is positive
    if (durationInMinutes <= 0) {
      return NextResponse.json({ 
        error: "End time must be after start time" 
      }, { status: 400 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        title,
        startTime: start,
        endTime: end,
        description,
        meetingUrl,
        duration: durationInMinutes,
        waitTime: 15, // Default wait time
        status: "PENDING",
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        UserMeeting: {
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
      where: {
        startTime: {
          gte: new Date(), // Only future schedules
        },
        status: "PENDING",
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
