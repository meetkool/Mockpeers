import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

async function createWeeklySchedule() {
  try {
    // First, get the admin user
    const admin = await prisma.admin.findFirst();
    
    if (!admin) {
      throw new Error('No admin user found. Please create an admin user first using npm run create-admin');
    }

    // Create a JWT token for admin
    const token = sign(
      { 
        id: admin.id,
        email: admin.email,
        role: 'ADMIN'
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Make the API call with admin token
    const response = await fetch('http://localhost:3000/api/admin/schedule/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': `next-auth.session-token=${token}`
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create schedules');
    }

    console.log('✅ Successfully created weekly schedule');
    console.log(`Created ${data.schedules.length} interview slots`);
  } catch (error) {
    console.error('Failed to create weekly schedule:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createWeeklySchedule();
