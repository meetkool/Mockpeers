import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../authOptions";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPhoneVerified: true, phoneNumber: true }
    });

    if (!user?.phoneNumber) {
      return NextResponse.json(
        { error: "Phone number not found" },
        { status: 400 }
      );
    }

    // Verify code using Twilio Verify
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: user.phoneNumber,
        code
      });

    if (verification.status === "approved") {
      // Update user's phone verification status
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isPhoneVerified: true }
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