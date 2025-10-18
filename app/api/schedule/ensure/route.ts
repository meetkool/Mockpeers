import { NextResponse } from 'next/server';
import { ensureSchedules, cleanupOldSchedules } from '@/lib/auto-schedule';

/**
 * API endpoint to manually trigger schedule creation
 * GET /api/schedule/ensure
 */
export async function GET() {
  try {
    const result = await ensureSchedules();
    await cleanupOldSchedules();
    
    return NextResponse.json({
      success: true,
      message: `Ensured interview schedules are available`,
      ...result,
    });
  } catch (error) {
    console.error('Failed to ensure schedules:', error);
    return NextResponse.json(
      { error: 'Failed to ensure schedules' },
      { status: 500 }
    );
  }
}






