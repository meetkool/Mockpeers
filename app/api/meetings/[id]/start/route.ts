import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    const updatedMeeting = await prisma.schedule.update({
      where: { id: id },
      data: {
        status: "ACTIVE",
        startedAt: new Date()
      }
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Error starting meeting:", error);
    return NextResponse.json(
      { error: "Failed to start meeting" },
      { status: 500 }
    );
  }
}