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

    if (!params?.id) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    const updatedMeeting = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Error ending meeting:", error);
    return NextResponse.json(
      { error: "Failed to end meeting" },
      { status: 500 }
    );
  }
}