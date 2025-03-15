import { prisma } from "./prisma";

export async function updateScheduleStatuses() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/status-update`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update schedule statuses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating schedule statuses:', error);
    throw error;
  }
}