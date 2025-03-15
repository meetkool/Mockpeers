import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { verify } from 'jsonwebtoken';

const TIME_SLOTS = [
  { hour: 0, minute: 30 },  // 12:30 AM
  { hour: 6, minute: 30 },  // 6:30 AM
  { hour: 14, minute: 30 }, // 2:30 PM
  { hour: 20, minute: 30 }, // 8:30 PM
];

const DURATION_HOURS = 2;

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    // If no session, check for token in header
    if (!session?.user?.role === 'ADMIN') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
        if (decoded.role !== 'ADMIN') {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    const schedules = [];
    const today = new Date();
    
    // Generate schedules for the next 7 days
    for (let day = 0; day < 7; day++) {
      for (const slot of TIME_SLOTS) {
        const startTime = new Date(today);
        startTime.setDate(today.getDate() + day);
        startTime.setHours(slot.hour, slot.minute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + DURATION_HOURS);

        // Skip if start time is in the past
        if (startTime < new Date()) continue;

        const schedule = await prisma.schedule.create({
          data: {
            title: `Interview Slot - ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}`,
            startTime,
            endTime,
            duration: DURATION_HOURS * 60, // Duration in minutes
            description: "Regular interview slot",
            status: "PENDING",
          },
        });

        schedules.push(schedule);
      }
    }

    return NextResponse.json({
      message: `Created ${schedules.length} schedule slots`,
      schedules
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create bulk schedules:", error);
    return NextResponse.json(
      { error: "Failed to create bulk schedules" },
      { status: 500 }
    );
  }
}
