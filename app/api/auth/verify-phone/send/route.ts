import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../authOptions";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFICATION_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber, country } = await request.json();
    
    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if phone number is already verified by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber,
        isPhoneVerified: true,
        NOT: { id: session.user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Send verification code using Twilio Verify
    const verification = await client.verify.v2
      .services(VERIFICATION_SERVICE_SID!)
      .verifications.create({
        to: phoneNumber,
        channel: "whatsapp" // or "sms" if you prefer
      });

    // Update user's phone number and country
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        phoneNumber,
        country
      }
    });

    return NextResponse.json({ 
      success: true,
      status: verification.status 
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}


