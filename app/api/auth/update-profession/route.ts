import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profession } = await request.json();

    if (!profession) {
      return NextResponse.json({ error: 'Profession is required' }, { status: 400 });
    }

    // Update user's profession
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profession },
      select: {
        id: true,
        email: true,
        name: true,
        profession: true,
        provider: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profession updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profession:', error);
    return NextResponse.json(
      { error: 'Failed to update profession' },
      { status: 500 }
    );
  }
}
