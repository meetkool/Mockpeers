import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId, isAdmin } = await req.json();

    // Verify admin status if joining as admin
    if (isAdmin && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;

    // For admins, look up in Admin table and create/find corresponding User record
    if (session.user.role === "ADMIN") {
      const admin = await prisma.admin.findUnique({
        where: { email: session.user.email! }
      });

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      // Check if admin has a corresponding User record (for joining meetings)
      let adminUser = await prisma.user.findUnique({
        where: { email: session.user.email! }
      });

      // Create a User record for the admin if it doesn't exist (for joining meetings only)
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: session.user.email!,
            name: admin.name,
            provider: 'EMAIL',
            isPhoneVerified: true, // Admins don't need phone verification
          }
        });
      }

      userId = adminUser.id;
    } else {
      // For regular users
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = user.id;
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const schedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
        include: { userMeetings: true }
      });

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Only check time restrictions for non-admin users
      if (!isAdmin && session.user.role !== "ADMIN") {
        const now = new Date();
        const meetingStartTime = new Date(schedule.startTime);
        const meetingEndTime = new Date(schedule.endTime);

        // Check if the meeting has ended
        if (now > meetingEndTime) {
          throw new Error("Meeting has already ended");
        }

        // For regular users, prevent joining after start time
        if (now > meetingStartTime) {
          throw new Error("Cannot join after meeting has started");
        }
      }

      const existingMeeting = await tx.userMeeting.findFirst({
        where: {
          AND: [
            { userId: userId },
            { scheduleId: scheduleId }
          ]
        }
      });

      if (existingMeeting) {
        throw new Error("Already joined this schedule");
      }

      // Create UserMeeting with role
      const userMeeting = await tx.userMeeting.create({
        data: {
          user: { connect: { id: userId } },
          schedule: { connect: { id: scheduleId } },
          role: isAdmin ? "ADMIN" : "PARTICIPANT"
        }
      });

      // Update schedule counting (only for non-admin joins)
      const updatedSchedule = await tx.schedule.update({
        where: { id: scheduleId },
        data: { 
          counting: isAdmin ? undefined : { increment: 1 } 
        }
      });

      return { userMeeting, schedule: updatedSchedule };
    });

    // After successful join, check if we need to update status to BOOKING_STARTED
    if (!isAdmin && result.schedule.counting >= 1) {
      await prisma.schedule.update({
        where: { id: result.schedule.id },
        data: { status: "BOOKING_STARTED" }
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to join meeting" },
      { status: 400 }
    );
  }
}
