import { prisma } from './prisma';
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, isBefore, startOfDay } from 'date-fns';
import { runLifecycleChecks } from './meeting-lifecycle';

// Time slots to maintain (24-hour format) - Indian Timings
const TIME_SLOTS = [
  { hour: 8, minute: 30 },   // 8:30 AM
  { hour: 10, minute: 30 },  // 10:30 AM
  { hour: 12, minute: 30 },  // 12:30 PM
  { hour: 14, minute: 30 },  // 2:30 PM
  { hour: 16, minute: 30 },  // 4:30 PM
  { hour: 18, minute: 30 },  // 6:30 PM
  { hour: 20, minute: 30 },  // 8:30 PM
  { hour: 22, minute: 30 },  // 10:30 PM
];

const DAYS_AHEAD = 7; // Maintain schedules for next 7 days
const INTERVIEW_DURATION = 60; // 60 minutes per interview

/**
 * Ensures there are always interview slots available in a rolling 7-day window
 * - Runs lifecycle checks to update meeting statuses
 * - Creates new slots to maintain 7-day availability
 */
export async function ensureSchedules() {
  try {
    console.log('🔄 Checking interview schedules...');
    
    const now = new Date();
    
    // Step 1: Run lifecycle checks (mark OVER, activate, complete meetings)
    // This also creates replacement meetings for DONE/OVER meetings
    await runLifecycleChecks();

    // Step 2: For each time slot, ensure 7 days of availability
    const schedulesToCreate = [];

    for (const slot of TIME_SLOTS) {
      // Get all existing future slots for this specific time (e.g., all 8:30 PM slots)
      const existingSlotsForTime = await prisma.schedule.findMany({
        where: {
          startTime: {
            gte: now,
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        select: {
          startTime: true,
        },
      });

      // Filter to only this time slot (hour:minute)
      const slotsAtThisTime = existingSlotsForTime.filter(s => {
        const slotDate = new Date(s.startTime);
        return slotDate.getHours() === slot.hour && slotDate.getMinutes() === slot.minute;
      });

      // Find the latest slot for this time
      const latestSlotForTime = slotsAtThisTime.length > 0 
        ? slotsAtThisTime[slotsAtThisTime.length - 1]
        : null;

      // Create slots from today up to 7 days ahead
      for (let day = 0; day <= DAYS_AHEAD; day++) {
        const checkDate = addDays(startOfDay(now), day);
        
        let slotTime = setHours(checkDate, slot.hour);
        slotTime = setMinutes(slotTime, slot.minute);
        slotTime = setSeconds(slotTime, 0);
        slotTime = setMilliseconds(slotTime, 0);

        // Skip if in the past
        if (isBefore(slotTime, now)) {
          continue;
        }

        // Check if this exact slot already exists
        const exists = slotsAtThisTime.some(s => 
          s.startTime.getTime() === slotTime.getTime()
        );

        if (!exists) {
          const endTime = new Date(slotTime);
          endTime.setMinutes(endTime.getMinutes() + INTERVIEW_DURATION);

          schedulesToCreate.push({
            title: getInterviewTitle(slot.hour),
            startTime: slotTime,
            endTime: endTime,
            duration: INTERVIEW_DURATION,
            waitTime: 15,
            status: 'PENDING',
            description: `${getInterviewTitle(slot.hour)} - Join and practice with peers`,
          });
        }
      }
    }

    // Bulk create missing schedules
    if (schedulesToCreate.length > 0) {
      await prisma.schedule.createMany({
        data: schedulesToCreate,
        skipDuplicates: true,
      });
      console.log(`✅ Created ${schedulesToCreate.length} new interview slots`);
    } else {
      console.log('✅ All interview slots are up to date');
    }

    // Get total count of available slots (PENDING + BOOKING_STARTED)
    const totalSlots = await prisma.schedule.count({
      where: {
        startTime: {
          gte: now,
        },
        status: {
          in: ['PENDING', 'BOOKING_STARTED'],
        },
      },
    });

    return {
      created: schedulesToCreate.length,
      total: totalSlots,
    };
  } catch (error) {
    console.error('❌ Error ensuring schedules:', error);
    throw error;
  }
}

/**
 * Get interview title based on time of day
 */
function getInterviewTitle(hour: number): string {
  if (hour >= 8 && hour < 12) return 'Morning Interview Practice';
  if (hour >= 12 && hour < 17) return 'Afternoon Mock Interview';
  if (hour >= 17 && hour < 21) return 'Evening Tech Interview';
  return 'Night Coding Session';
}

/**
 * Clean up old completed/cancelled schedules (optional maintenance)
 * Keeps meetings for historical data, only deletes very old ones
 */
export async function cleanupOldSchedules() {
  try {
    const thirtyDaysAgo = addDays(new Date(), -30);
    
    const result = await prisma.schedule.deleteMany({
      where: {
        endTime: {
          lt: thirtyDaysAgo,
        },
        status: {
          in: ['DONE', 'OVER', 'CANCELLED'],
        },
      },
    });

    if (result.count > 0) {
      console.log(`🗑️ Cleaned up ${result.count} old schedules (>30 days)`);
    }
    
    return result.count;
  } catch (error) {
    console.error('❌ Error cleaning up schedules:', error);
    return 0;
  }
}

