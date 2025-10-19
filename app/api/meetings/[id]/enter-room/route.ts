import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

/**
 * API endpoint to track when a user enters the meeting room
 * Updates UserMeeting status from JOINED to ACTIVE
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: scheduleId } = await params;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the user's meeting record
    const userMeeting = await prisma.userMeeting.findFirst({
      where: {
        scheduleId: scheduleId,
        userId: user.id
      }
    });

    if (!userMeeting) {
      return NextResponse.json(
        { error: "You are not registered for this meeting" },
        { status: 404 }
      );
    }

    // Update status to ACTIVE only if currently JOINED
    if (userMeeting.status === 'JOINED') {
      const updatedMeeting = await prisma.userMeeting.update({
        where: { id: userMeeting.id },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return NextResponse.json({
        message: "Successfully entered the room",
        userMeeting: updatedMeeting
      });
    }

    // If already ACTIVE or other status, just return success
    return NextResponse.json({
      message: "Already in the room",
      userMeeting
    });

  } catch (error) {
    console.error("Error entering room:", error);
    return NextResponse.json(
      { error: "Failed to enter room" },
      { status: 500 }
    );
  }
}

