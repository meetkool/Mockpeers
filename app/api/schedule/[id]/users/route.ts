import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();
    const { id: scheduleId } = params;

    const userMeeting = await prisma.userMeeting.create({
      data: {
        userId,
        scheduleId,
        role: "PARTICIPANT",
      },
    });

    return NextResponse.json(userMeeting);
  } catch (error) {
    console.error("Failed to add user to meeting:", error);
    return NextResponse.json(
      { error: "Failed to add user to meeting" },
      { status: 500 }
    );
  }
}