import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

/**
 * Check and activate meetings where start time has arrived
 * Status: BOOKING_STARTED/PENDING -> ACTIVE
 * ALL meetings become ACTIVE when start time arrives (even with 0 participants for admin access)
 */
export async function checkAndActivateMeetings() {
  try {
    const now = new Date();

    // Find meetings where Start Time has arrived
    // Activate ALL meetings (even with 0 participants so admins can join)
    const meetingsToActivate = await prisma.schedule.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gt: now }, // Not ended yet
        status: {
          in: ['BOOKING_STARTED', 'PENDING']
        },
      },
    });

    if (meetingsToActivate.length > 0) {
      // Update each to ACTIVE
      const updatePromises = meetingsToActivate.map(meeting =>
        prisma.schedule.update({
          where: { id: meeting.id },
          data: { status: 'ACTIVE', startedAt: new Date() },
        })
      );

      await Promise.all(updatePromises);
      console.log(`🟢 Activated ${meetingsToActivate.length} meeting(s) (including empty rooms for admin access)`);
    }

    return meetingsToActivate.length;
  } catch (error) {
    console.error('Error activating meetings:', error);
    throw error;
  }
}

/**
 * Check and complete meetings where end time has passed
 * Status: ACTIVE -> DONE
 * Triggers creation of new meeting +7 days
 */
export async function checkAndCompleteMeetings() {
  try {
    const now = new Date();

    // Find meetings where End Time has passed and status is ACTIVE
    const meetingsToComplete = await prisma.schedule.findMany({
      where: {
        endTime: { lte: now },
        status: 'ACTIVE',
      },
    });

    if (meetingsToComplete.length > 0) {
      // Update each to DONE
      const updatePromises = meetingsToComplete.map(meeting =>
        prisma.schedule.update({
          where: { id: meeting.id },
          data: { status: 'DONE', completedAt: new Date() },
        })
      );

      await Promise.all(updatePromises);
      console.log(`✅ Completed ${meetingsToComplete.length} meeting(s)`);

      // Create replacement meetings +7 days
      await createReplacementMeetings(meetingsToComplete);
    }

    return meetingsToComplete.length;
  } catch (error) {
    console.error('Error completing meetings:', error);
    throw error;
  }
}

/**
 * Fix PENDING meetings that have participants
 * Status: PENDING (with participants) -> BOOKING_STARTED
 */
export async function fixPendingWithParticipants() {
  try {
    // Find PENDING meetings that have participants
    const pendingWithParticipants = await prisma.schedule.findMany({
      where: {
        status: 'PENDING',
        counting: {
          gt: 0
        }
      }
    });

    if (pendingWithParticipants.length > 0) {
      // Update them to BOOKING_STARTED
      const updatePromises = pendingWithParticipants.map(meeting =>
        prisma.schedule.update({
          where: { id: meeting.id },
          data: { status: 'BOOKING_STARTED' },
        })
      );

      await Promise.all(updatePromises);
      console.log(`🔧 Fixed ${pendingWithParticipants.length} PENDING meeting(s) with participants -> BOOKING_STARTED`);
    }

    return pendingWithParticipants.length;
  } catch (error) {
    console.error('Error fixing pending meetings:', error);
    throw error;
  }
}

/**
 * Check and mark expired meetings that never got activated as OVER
 * This only applies to very old meetings that somehow got stuck
 */
export async function checkAndMarkExpiredMeetings() {
  try {
    const now = new Date();

    // Find meetings where END time has passed and they're still PENDING/BOOKING_STARTED
    // These are meetings that should have been activated but weren't
    const expiredMeetings = await prisma.schedule.findMany({
      where: {
        endTime: { lte: now },
        status: {
          in: ['PENDING', 'BOOKING_STARTED']
        },
      },
    });

    if (expiredMeetings.length > 0) {
      // Update each to OVER
      const updatePromises = expiredMeetings.map(meeting =>
        prisma.schedule.update({
          where: { id: meeting.id },
          data: { status: 'OVER' },
        })
      );

      await Promise.all(updatePromises);
      console.log(`⚠️ Marked ${expiredMeetings.length} expired meeting(s) as OVER`);

      // Create replacement meetings +7 days
      await createReplacementMeetings(expiredMeetings);
    }

    return expiredMeetings.length;
  } catch (error) {
    console.error('Error marking expired meetings:', error);
    throw error;
  }
}

/**
 * Create replacement meetings +7 days for completed/over meetings
 */
async function createReplacementMeetings(completedMeetings: any[]) {
  try {
    const meetingsToCreate = [];

    for (const meeting of completedMeetings) {
      // Calculate new slot time (+7 days)
      const newStartTime = addDays(meeting.startTime, 7);
      const newEndTime = addDays(meeting.endTime, 7);

      // Check if a meeting already exists at this exact time
      const existingMeeting = await prisma.schedule.findFirst({
        where: {
          startTime: newStartTime,
        },
      });

      if (!existingMeeting) {
        meetingsToCreate.push({
          title: meeting.title,
          description: meeting.description,
          startTime: newStartTime,
          endTime: newEndTime,
          duration: meeting.duration,
          waitTime: meeting.waitTime || 15,
          status: 'PENDING',
          interviewType: meeting.interviewType, // Preserve the interview type
        });
      }
    }

    if (meetingsToCreate.length > 0) {
      await prisma.schedule.createMany({
        data: meetingsToCreate,
        skipDuplicates: true,
      });
      console.log(`🔄 Created ${meetingsToCreate.length} replacement meeting(s) for +7 days`);
    }

    return meetingsToCreate.length;
  } catch (error) {
    console.error('Error creating replacement meetings:', error);
    throw error;
  }
}

/**
 * Run all lifecycle checks in sequence
 */
export async function runLifecycleChecks() {
  console.log('🔄 Running meeting lifecycle checks...');
  
  const results = {
    fixed: 0,
    expired: 0,
    activated: 0,
    completed: 0,
  };

  try {
    // FIRST: Fix any PENDING meetings that have participants
    results.fixed = await fixPendingWithParticipants();
    
    // THEN: Activate meetings that have started (even with 0 participants)
    results.activated = await checkAndActivateMeetings();
    
    // Complete meetings that have ended
    results.completed = await checkAndCompleteMeetings();

    // Finally: Mark very old expired meetings as OVER
    results.expired = await checkAndMarkExpiredMeetings();

    console.log('✅ Lifecycle checks complete:', results);
    return results;
  } catch (error) {
    console.error('❌ Error during lifecycle checks:', error);
    throw error;
  }
}
