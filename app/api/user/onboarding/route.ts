import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Handle skip case
    if (body.skip) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          onboardingCompleted: true
        }
      });
      return NextResponse.json({ success: true });
    }

    const { 
      profession,
      leetcodeUsername,
      interviewLanguages,
      readLanguages,
      questionDifficulties
    } = body;

    // Build update data object
    const updateData: any = {
      onboardingCompleted: true
    };

    // experienceLevel removed - users choose level when booking each meeting
    if (profession) updateData.profession = profession;
    if (leetcodeUsername) updateData.leetcodeUsername = leetcodeUsername;
    if (interviewLanguages) updateData.interviewLanguages = interviewLanguages;
    if (readLanguages) updateData.readLanguages = readLanguages;
    if (questionDifficulties) updateData.questionDifficulties = questionDifficulties;

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}

