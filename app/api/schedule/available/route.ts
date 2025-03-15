import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentTime = new Date();
    
    const schedules = await prisma.schedule.findMany({
      where: {
        AND: [
          {
            endTime: {
              gte: currentTime,
            },
          },
          {
            startTime: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            },
          },
          {
            status: {
              in: ["PENDING", "BOOKED"]
            },
          }
        ]
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        duration: true,
        status: true,
        UserMeeting: {
          include: {
            user: { 
              select: {
                name: true,
                image: true,
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ data: schedules });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" }, 
      { status: 500 }
    );
  }
}
