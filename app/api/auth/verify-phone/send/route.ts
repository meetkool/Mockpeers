import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../authOptions";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate a random 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('📱 Verification request from user:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('❌ No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber, country } = await request.json();
    console.log('📞 Phone number:', phoneNumber, 'Country:', country);
    
    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      console.log('❌ User not found:', session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('✅ User found:', user.email);

    // Check if phone number is already verified by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber,
        isPhoneVerified: true,
        NOT: { id: session.user.id }
      }
    });

    if (existingUser) {
      console.log('❌ Phone number already registered by another user:', existingUser.email);
      return NextResponse.json(
        { error: "This phone number is already registered with another account. Please use a different phone number." },
        { status: 400 }
      );
    }

    console.log('✅ Phone number available');

    // Generate verification code
    const code = generateVerificationCode();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔢 Generated code:', code);

    // Check if Twilio is enabled via environment variable
    const useTwilio = process.env.USE_TWILIO === 'true';
    console.log('🔧 USE_TWILIO setting:', useTwilio);

    // If Twilio is disabled or not configured, use development mode
    if (!useTwilio || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('⚠️ Twilio disabled or not configured - Development mode activated');
      
      // Save the code without sending SMS
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          phoneNumber,
          country,
          verificationCode: code,
          verificationCodeExpiry: expiryTime
        }
      });

      console.log('✅ User updated with verification code (Development mode)');
      console.log('🔢 VERIFICATION CODE:', code);

      return NextResponse.json({ 
        success: true,
        message: "Development mode: Verification code generated",
        code: code, // Return code to frontend
        developmentMode: true
      });
    }

    // Send SMS using Twilio (only if enabled)
    console.log('📨 Sending SMS via Twilio...');
    try {
      const message = await client.messages.create({
        body: `Your Mockpeers verification code is: ${code}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('✅ SMS sent, status:', message.status);

      // Update user's phone number, country, and verification code
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          phoneNumber,
          country,
          verificationCode: code,
          verificationCodeExpiry: expiryTime
        }
      });

      console.log('✅ User updated with verification code');

      return NextResponse.json({ 
        success: true,
        status: message.status,
        developmentMode: false
      });
    } catch (twilioError: any) {
      // If USE_TWILIO is true, don't fall back - return proper error
      console.error('❌ Twilio SMS failed:', twilioError.message);
      
      // Return error without exposing the code
      return NextResponse.json(
        { 
          error: "Failed to send verification SMS. Please try again or contact support.",
          details: process.env.NODE_ENV === 'development' ? twilioError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Phone verification error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Failed to send verification code",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


