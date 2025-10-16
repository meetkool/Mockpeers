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

    const { preferredMode } = await request.json();

    // Validate mode if provided (null is allowed for skipping)
    if (preferredMode !== null && !['PEER', 'AI', 'FRIEND'].includes(preferredMode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferredMode,
        onboardingCompleted: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  }
}

