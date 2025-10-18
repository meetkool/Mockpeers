import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Schedule } from '@/lib/types/interview-types';
import { toast } from 'sonner';

// Fetch single schedule
const fetchSchedule = async (scheduleId: string): Promise<Schedule> => {
  const response = await fetch(`/api/admin/schedule/${scheduleId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch schedule');
  }

  return response.json();
};

export function useScheduleDetail(scheduleId: string) {
  return useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => fetchSchedule(scheduleId),
    staleTime: 2 * 60 * 1000,  // 2 minutes for detail page
  });
}

// Add user to schedule
export function useAddUserToSchedule(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      experienceLevel 
    }: { 
      userId: string; 
      experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' 
    }) => {
      const response = await fetch(`/api/admin/schedule/${scheduleId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, experienceLevel }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('User added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Remove user from schedule
export function useRemoveUserFromSchedule(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userMeetingId: string) => {
      const response = await fetch(`/api/admin/schedule/${scheduleId}/users/${userMeetingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('User removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove user');
    },
  });
}


