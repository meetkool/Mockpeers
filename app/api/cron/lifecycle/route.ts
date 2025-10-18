import { NextRequest, NextResponse } from 'next/server';
import { runLifecycleChecks } from '@/lib/meeting-lifecycle';

/**
 * Cron endpoint to run lifecycle checks periodically
 * This should be called by a cron service (e.g., Vercel Cron, external cron job)
 * 
 * For security, you can:
 * 1. Use Vercel Cron (automatically secured)
 * 2. Add a secret token check: ?token=YOUR_SECRET_TOKEN
 * 3. Use vercel.json cron configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add secret token validation for external cron services
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron job: Starting lifecycle checks...');
    const startTime = Date.now();
    
    const results = await runLifecycleChecks();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cron job: Lifecycle checks completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      results,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job: Lifecycle check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST method as well for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}


