import { prisma } from '../lib/prisma';

async function checkDatabaseSize() {
  try {
    // Total schedules
    const totalSchedules = await prisma.schedule.count();
    console.log('📊 Database Statistics:');
    console.log('=====================');
    console.log(`Total schedules: ${totalSchedules}`);
    console.log('');

    // By interview type
    console.log('By Interview Type:');
    const byType = await prisma.schedule.groupBy({
      by: ['interviewType'],
      _count: {
        id: true
      }
    });
    byType.forEach(item => {
      console.log(`  ${item.interviewType}: ${item._count.id} schedules`);
    });
    console.log('');

    // By status
    console.log('By Status:');
    const byStatus = await prisma.schedule.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    byStatus.forEach(item => {
      console.log(`  ${item.status}: ${item._count.id} schedules`);
    });
    console.log('');

    // Average user meetings per schedule
    const schedulesWithCounts = await prisma.schedule.findMany({
      select: {
        _count: {
          select: {
            userMeetings: true
          }
        }
      }
    });
    const avgUserMeetings = schedulesWithCounts.reduce((sum, s) => sum + s._count.userMeetings, 0) / totalSchedules;
    console.log(`Average participants per schedule: ${avgUserMeetings.toFixed(2)}`);
    
    // Total user meetings
    const totalUserMeetings = await prisma.userMeeting.count();
    console.log(`Total user meetings: ${totalUserMeetings}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSize();


