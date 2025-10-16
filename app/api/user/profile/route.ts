import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        profession: true,
        phoneNumber: true,
        country: true,
        isPhoneVerified: true,
        preferredMode: true,
        onboardingCompleted: true,
        // Enhanced profile fields
        leetcodeUsername: true,
        // experienceLevel removed - now per-meeting
        interviewLanguages: true,
        readLanguages: true,
        questionDifficulties: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      profession,
      leetcodeUsername,
      interviewLanguages,
      readLanguages,
      questionDifficulties
    } = body;

    // Build update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (profession !== undefined) updateData.profession = profession;
    if (leetcodeUsername !== undefined) updateData.leetcodeUsername = leetcodeUsername;
    // experienceLevel removed - now chosen per-meeting during booking
    if (interviewLanguages !== undefined) updateData.interviewLanguages = interviewLanguages;
    if (readLanguages !== undefined) updateData.readLanguages = readLanguages;
    if (questionDifficulties !== undefined) updateData.questionDifficulties = questionDifficulties;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        profession: true,
        phoneNumber: true,
        country: true,
        isPhoneVerified: true,
        preferredMode: true,
        onboardingCompleted: true,
        leetcodeUsername: true,
        // experienceLevel removed - now per-meeting
        interviewLanguages: true,
        readLanguages: true,
        questionDifficulties: true,
        createdAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

