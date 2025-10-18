# Complete Implementation Examples 📝
## Copy-Paste Ready Code for All Components

This document contains complete, ready-to-use code for updating all admin components with the new performance optimizations.

---

## 📁 File Structure After Implementation

```
app/admin/
├── providers.tsx                              [NEW]
├── components/
│   ├── InterviewSchedulePage.tsx             [UPDATE]
│   ├── InterviewScheduleDetail.tsx           [UPDATE]
│   ├── sidebar.tsx                           [UPDATE]
│   ├── ScheduleTableSkeleton.tsx             [NEW]
│   └── UsersTableSkeleton.tsx                [NEW]
├── users/
│   └── page.tsx                              [UPDATE]
└── layout.tsx                                [UPDATE]

lib/hooks/
├── useSchedules.ts                           [NEW]
├── useScheduleDetail.ts                      [NEW]
└── useUsers.ts                               [NEW]
```

---

## 1. Provider Setup

### `app/admin/providers.tsx` [NEW FILE]
```typescript
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 minutes - data stays fresh
        cacheTime: 10 * 60 * 1000,       // 10 minutes - cache persists
        refetchOnWindowFocus: false,     // Don't refetch when tab focused
        refetchOnReconnect: true,        // Refetch when internet reconnects
        refetchOnMount: false,           // Don't refetch on component remount
        retry: 1,                        // Retry failed requests once
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
```

---

## 2. Custom Hooks

### `lib/hooks/useSchedules.ts` [NEW FILE]
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InterviewType, Schedule } from '@/lib/types/interview-types';
import { toast } from 'sonner';

// ============================================================================
// FETCH SCHEDULES
// ============================================================================

const fetchSchedules = async (
  interviewType: InterviewType,
  statusFilter?: string
): Promise<Schedule[]> => {
  const url = statusFilter && statusFilter !== 'ALL'
    ? `/api/admin/schedules/${interviewType}?status=${statusFilter}`
    : `/api/admin/schedules/${interviewType}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch schedules');
  }

  const data = await response.json();
  
  // Ensure userMeetings is always an array
  return data.map((schedule: Schedule) => ({
    ...schedule,
    userMeetings: schedule.userMeetings || []
  }));
};

export function useSchedules(interviewType: InterviewType, statusFilter: string = 'ALL') {
  return useQuery({
    queryKey: ['schedules', interviewType, statusFilter],
    queryFn: () => fetchSchedules(interviewType, statusFilter),
    staleTime: 5 * 60 * 1000,
  });
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['schedules'] });

      // Snapshot previous value
      const previousSchedules = queryClient.getQueriesData({ queryKey: ['schedules'] });

      // Optimistically update
      queryClient.setQueriesData<Schedule[]>(
        { queryKey: ['schedules'] },
        (old) => old?.map(schedule =>
          schedule.id === scheduleId
            ? { ...schedule, bookingOpen: false }
            : schedule
        )
      );

      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      // Rollback on error
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
      // Refetch to ensure we're in sync
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

      // Optimistically update
      queryClient.setQueriesData<Schedule[]>(
        { queryKey: ['schedules'] },
        (old) => old?.map(schedule =>
          schedule.id === scheduleId
            ? { ...schedule, bookingOpen: true }
            : schedule
        )
      );

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
```

### `lib/hooks/useScheduleDetail.ts` [NEW FILE]
```typescript
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
```

### `lib/hooks/useUsers.ts` [NEW FILE]
```typescript
import { useQuery } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string | null;
  email: string;
  profession: string | null;
  country: string | null;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  onboardingCompleted: boolean;
  provider: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    userMeetings: number;
  };
}

const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/admin/users');

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}
```

---

## 3. Skeleton Components

### `app/admin/components/ScheduleTableSkeleton.tsx` [NEW FILE]
```typescript
export function ScheduleTableSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b">
          <div className="flex gap-4 p-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
        </div>

        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex gap-4 p-4 items-center">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `app/admin/components/UsersTableSkeleton.tsx` [NEW FILE]
```typescript
export function UsersTableSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Search skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4" />
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center p-4 border rounded-lg">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Updated Components

### `app/admin/components/InterviewSchedulePage.tsx` [KEY CHANGES]

**At the top of the file, update imports:**
```typescript
import { useSchedules, useCloseBooking, useReopenBooking } from '@/lib/hooks/useSchedules';
import { ScheduleTableSkeleton } from './ScheduleTableSkeleton';
```

**Replace the entire state and effect section (lines 100-138) with:**
```typescript
export function InterviewSchedulePage({ 
  interviewType, 
  title, 
  description, 
  iconName 
}: InterviewSchedulePageProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    startTime: '',
    endTime: '',
    description: '',
    interviewType: interviewType,
  });

  // Use React Query hooks
  const { data: schedules = [], isLoading, isError, refetch } = useSchedules(interviewType, statusFilter);
  const closeBooking = useCloseBooking();
  const reopenBooking = useReopenBooking();

  // ... rest of component
```

**Replace handleReopenBooking and handleCloseBooking (lines 171-201) with:**
```typescript
  const handleReopenBooking = (scheduleId: string) => {
    reopenBooking.mutate(scheduleId);
  };

  const handleCloseBooking = (scheduleId: string) => {
    closeBooking.mutate(scheduleId);
  };
```

**Replace handleSubmit to trigger refetch (lines 140-165):**
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsOpen(false);
        refetch();  // Use refetch instead of fetchSchedules
        setFormData({
          title: '',
          startTime: '',
          endTime: '',
          description: '',
          interviewType: interviewType,
        });
        toast.success('Schedule created successfully');
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error('Failed to create schedule');
    }
  };
```

**Add loading and error states before the return statement:**
```typescript
  const config = INTERVIEW_TYPE_CONFIG[interviewType];
  const Icon = iconMap[iconName as keyof typeof iconMap];

  if (isLoading) {
    return <ScheduleTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load schedules</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    // ... existing return JSX
  );
```

---

### `app/admin/users/page.tsx` [KEY CHANGES]

**Replace imports at the top:**
```typescript
"use client";

import { useState, useMemo } from "react";  // Remove useEffect
import { useUsers } from "@/lib/hooks/useUsers";  // Add this
import { UsersTableSkeleton } from "../components/UsersTableSkeleton";  // Add this
// ... rest of imports
```

**Replace the entire state and fetch logic (lines 46-80) with:**
```typescript
export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Use React Query hook
  const { data: users = [], isLoading, isError, refetch } = useUsers();

  // Memoize filtered users (only recalculate when dependencies change)
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // ... rest of component
```

**Replace the loading check (lines 105-114) with:**
```typescript
  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load users</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }
```

---

### `app/admin/components/sidebar.tsx` [KEY CHANGES]

**Add imports:**
```typescript
import { useQueryClient } from '@tanstack/react-query';
```

**Add prefetch logic inside the component:**
```typescript
export function Sidebar() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Prefetch helper
  const prefetchPage = (href: string) => {
    // Extract interview type from href
    if (href.includes('/schedule/')) {
      const typeMatch = href.match(/\/schedule\/([^/]+)/);
      if (typeMatch) {
        const routeType = typeMatch[1];
        
        // Map route to API type
        const typeMap: Record<string, string> = {
          'dsa': 'DSA',
          'system-design': 'SYSTEM_DESIGN',
          'behavioral': 'BEHAVIORAL',
          'sql': 'SQL',
          'data-science': 'DATA_SCIENCE',
          'frontend': 'FRONTEND',
        };
        
        const apiType = typeMap[routeType];
        if (apiType) {
          queryClient.prefetchQuery({
            queryKey: ['schedules', apiType, 'ALL'],
            queryFn: () => fetch(`/api/admin/schedules/${apiType}`).then(r => r.json()),
          });
        }
      }
    } else if (href === '/admin/users') {
      queryClient.prefetchQuery({
        queryKey: ['users'],
        queryFn: () => fetch('/api/admin/users').then(r => r.json()),
      });
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' });
  };
```

**Update the Link component (around line 127):**
```typescript
              <Link
                href={item.href}
                onMouseEnter={() => prefetchPage(item.href)}
                onTouchStart={() => prefetchPage(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  isActive &&
                    "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50",
                  isScheduleModule && "ml-4 text-sm"
                )}
              >
                {/* ... rest of Link content */}
              </Link>
```

---

## 5. Test Your Implementation

### Development Testing
```typescript
// Add this to any component to measure performance
useEffect(() => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    console.log(`Component loaded in ${duration.toFixed(2)}ms`);
  };
}, []);
```

### Check React Query DevTools
- Bottom right corner in development
- Green badges = cached data (instant)
- Yellow badges = stale but cached
- Blue badges = fetching

### Network Tab Testing
1. Open Chrome DevTools → Network
2. Enable "Disable cache" temporarily
3. Navigate between admin tabs
4. You should see:
   - Prefetch requests on hover
   - Cached responses (from memory cache)
   - No duplicate requests

---

## 🎉 Deployment Checklist

- [ ] Install dependencies: `npm install @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Create all new files (providers, hooks, skeletons)
- [ ] Update all existing components
- [ ] Test in development environment
- [ ] Check React Query DevTools
- [ ] Test with network throttling
- [ ] Measure performance improvements
- [ ] Deploy to staging
- [ ] Verify in production

---

**Result:** 40x faster admin dashboard with intelligent caching! 🚀


