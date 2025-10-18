import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InterviewType, Schedule } from '@/lib/types/interview-types';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface PaginatedResponse {
  items: Schedule[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
    count: number;
  };
}

// ============================================================================
// FETCH SCHEDULES (WITH PAGINATION) - MANUAL IMPLEMENTATION
// ============================================================================

const fetchSchedulesPage = async (
  interviewType: InterviewType,
  statusFilter: string,
  cursor?: string | null
): Promise<PaginatedResponse> => {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'ALL') {
    params.append('status', statusFilter);
  }
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', '20');

  const url = `/api/admin/schedules/${interviewType}?${params.toString()}`;
  
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.status}`);
    }

    const data: PaginatedResponse = await response.json();
    
    // Validate response structure
    if (!data || !data.items || !Array.isArray(data.items)) {
      console.error('Invalid API response:', data);
      throw new Error('Invalid response structure from API');
    }

    if (!data.pagination) {
      console.error('Missing pagination in response:', data);
      data.pagination = {
        nextCursor: null,
        hasMore: false,
        limit: 20,
        count: data.items.length,
      };
    }
    
    // Ensure userMeetings is always an array
    data.items = data.items.map((schedule: Schedule) => ({
      ...schedule,
      userMeetings: schedule.userMeetings || []
    }));

    return data;
  } catch (error) {
    console.error('Error fetching schedules page:', error);
    throw error;
  }
};

// ============================================================================
// USE SCHEDULES HOOK - MANUAL PAGINATION (NO useInfiniteQuery)
// ============================================================================

export function useSchedules(interviewType: InterviewType, statusFilter: string = 'ALL') {
  // Manual state management for pagination
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [currentKey, setCurrentKey] = useState<string>(`${interviewType}-${statusFilter}`);
  
  // Use regular useQuery instead of useInfiniteQuery
  const query = useQuery({
    queryKey: ['schedules', interviewType, statusFilter, cursor],
    queryFn: () => fetchSchedulesPage(interviewType, statusFilter, cursor),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Update schedules when data changes
  const { data, isLoading, isError, error, refetch: refetchQuery } = query;
  
  // Reset when filters change (BEFORE data processing)
  useEffect(() => {
    const newKey = `${interviewType}-${statusFilter}`;
    if (newKey !== currentKey) {
      console.log('[useSchedules] Filter changed, resetting state', { from: currentKey, to: newKey });
      setAllSchedules([]);
      setCursor(null);
      setHasMore(false);
      setIsFetchingMore(false);
      setCurrentKey(newKey);
    }
  }, [interviewType, statusFilter, currentKey]);
  
  // Handle data updates (AFTER reset check)
  useEffect(() => {
    if (data) {
      console.log('[useSchedules] Data received', { 
        itemsCount: data.items.length, 
        cursor, 
        hasMore: data.pagination.hasMore 
      });
      
      if (cursor === null) {
        // First page - replace all schedules
        setAllSchedules(data.items);
      } else {
        // Subsequent pages - append to existing schedules
        setAllSchedules(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(s => s.id));
          const newItems = data.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setHasMore(data.pagination.hasMore);
      setIsFetchingMore(false);
    }
  }, [data, cursor]);

  // Function to fetch next page
  const fetchNextPage = useCallback(() => {
    if (data?.pagination.nextCursor && !isFetchingMore) {
      console.log('[useSchedules] Fetching next page', { cursor: data.pagination.nextCursor });
      setIsFetchingMore(true);
      setCursor(data.pagination.nextCursor);
    }
  }, [data?.pagination.nextCursor, isFetchingMore]);

  // Custom refetch that resets pagination
  const refetch = useCallback(() => {
    console.log('[useSchedules] Manual refetch triggered');
    setAllSchedules([]);
    setCursor(null);
    setHasMore(false);
    setIsFetchingMore(false);
    return refetchQuery();
  }, [refetchQuery]);

  console.log('[useSchedules] Render', { 
    interviewType, 
    statusFilter, 
    schedulesCount: allSchedules.length,
    isLoading,
    cursor
  });

  return {
    data: { 
      pages: [{ items: allSchedules }],
      pageParams: []
    },
    isLoading: isLoading && allSchedules.length === 0,
    isError,
    error,
    fetchNextPage,
    hasNextPage: hasMore,
    isFetchingNextPage: isFetchingMore,
    refetch,
  };
}

// ============================================================================
// CLOSE BOOKING MUTATION
// ============================================================================

export function useCloseBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch(`/api/admin/schedule/${scheduleId}/close`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to close booking');
      }

      return response.json();
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['schedules'] });
      const previousSchedules = queryClient.getQueriesData({ queryKey: ['schedules'] });
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        context.previousSchedules.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to close booking');
    },
    onSuccess: () => {
      toast.success('Booking closed successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

// ============================================================================
// REOPEN BOOKING MUTATION
// ============================================================================

export function useReopenBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch(`/api/admin/schedule/${scheduleId}/reopen`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reopen booking');
      }

      return response.json();
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['schedules'] });
      const previousSchedules = queryClient.getQueriesData({ queryKey: ['schedules'] });
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        context.previousSchedules.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to reopen booking');
    },
    onSuccess: () => {
      toast.success('Booking reopened successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

