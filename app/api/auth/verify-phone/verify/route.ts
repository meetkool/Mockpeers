import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        isPhoneVerified: true, 
        phoneNumber: true,
        verificationCode: true,
        verificationCodeExpiry: true
      }
    });

    if (!user?.phoneNumber) {
      return NextResponse.json(
        { error: "Phone number not found" },
        { status: 400 }
      );
    }

    if (!user.verificationCode || !user.verificationCodeExpiry) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (new Date() > user.verificationCodeExpiry) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Verify the code
    if (user.verificationCode === code) {
      // Update user's phone verification status and clear the code
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          isPhoneVerified: true,
          verificationCode: null,
          verificationCodeExpiry: null
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error verifying phone:", error);
    return NextResponse.json(
      { error: "Failed to verify phone number" },
      { status: 500 }
    );
  }
}