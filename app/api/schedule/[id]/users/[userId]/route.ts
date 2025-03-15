import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: scheduleId, userId } = params;

    await prisma.userMeeting.deleteMany({
      where: {
        scheduleId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove user from meeting:", error);
    return NextResponse.json(
      { error: "Failed to remove user from meeting" },
      { status: 500 }
    );
  }
}