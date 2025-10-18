# Tab Switching Error Fix - Complete Rewrite (V2)

## Problem
When switching between Schedule Management tabs, React Query v5 threw:
```
TypeError: Cannot read properties of undefined (reading 'length')
    at getNextPageParam (infiniteQueryBehavior.js:106:27)
```

## Root Cause
React Query v5's `useInfiniteQuery` was trying to compute pagination state (specifically `hasNextPage`) before data was initialized. Internally, it accessed `pages.length` where `pages` was undefined during the observer creation.

## Solution: Complete Rewrite

### 1. **Rewrote `lib/hooks/useSchedules.ts`**

Key changes:
- Simplified the hook structure
- Added proper TypeScript generics with tuple query key type
- Wrapped the query result to provide safe defaults:
  ```typescript
  return {
    ...query,
    data: query.data ?? { pages: [], pageParams: [] },
    hasNextPage: query.hasNextPage ?? false,
  };
  ```
- Added `getPreviousPageParam` for complete pagination config
- Used `placeholderData` to maintain data during tab switches
- Simplified `getNextPageParam` to a clean one-liner

### 2. **Updated `app/admin/providers.tsx`**

Changed QueryClient config:
```typescript
refetchOnMount: true,  // Changed from false to true
notifyOnChangeProps: ['data', 'error'],  // Prevent undefined access
```

### 3. **Updated `app/admin/components/InterviewSchedulePage.tsx`**

Added defensive programming:
```typescript
const {
  hasNextPage = false,  // Default value
  ...rest
} = useSchedules(interviewType, statusFilter);

// Safer data access
const schedules: Schedule[] = data?.pages?.flatMap(
  (page: { items: Schedule[] }) => page?.items || []
) ?? [];
```

## Complete Hook Implementation

```typescript
export function useSchedules(
  interviewType: InterviewType,
  statusFilter: string = 'ALL'
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse>, Error> {
  const query = useInfiniteQuery<
    PaginatedResponse,
    Error,
    InfiniteData<PaginatedResponse>,
    [string, InterviewType, string],
    string | undefined
  >({
    queryKey: ['schedules', interviewType, statusFilter],
    
    queryFn: async ({ pageParam }) => {
      return fetchSchedulesPage(interviewType, statusFilter, pageParam ?? null);
    },
    
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      return lastPage.pagination.hasMore 
        ? (lastPage.pagination.nextCursor ?? undefined) 
        : undefined;
    },
    
    getPreviousPageParam: () => undefined,
    initialPageParam: undefined,
    placeholderData: (previousData) => previousData,
    
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Critical: Return with safe defaults to prevent undefined access
  return {
    ...query,
    data: query.data ?? { pages: [], pageParams: [] } as InfiniteData<PaginatedResponse>,
    hasNextPage: query.hasNextPage ?? false,
  } as UseInfiniteQueryResult<InfiniteData<PaginatedResponse>, Error>;
}
```

## Why This Works

1. **Wrapper with Safe Defaults**: The hook now wraps the query result and ensures `data.pages` is always an array (never undefined)

2. **Proper Type Parameters**: Using explicit type parameters with tuple query key prevents type inference issues

3. **PlaceholderData**: Keeps previous data visible during transitions, preventing undefined state

4. **QueryClient Config**: `refetchOnMount: true` ensures fresh data on tab switches instead of relying on stale state

5. **Defensive Component Code**: The component now has default values and safe navigation operators

## Files Changed

1. ✅ `lib/hooks/useSchedules.ts` - Complete rewrite
2. ✅ `app/admin/providers.tsx` - QueryClient config updated
3. ✅ `app/admin/components/InterviewSchedulePage.tsx` - Added type safety

## Testing

1. Start the dev server: `npm run dev`
2. Navigate to Admin → Schedule Management
3. Rapidly switch between tabs: DSA → System Design → Behavioral → etc.
4. Error should no longer occur
5. Data should load smoothly with loading states

## Notes

- This fix uses a wrapper pattern to ensure data is never undefined
- The approach is React Query v5 compliant
- All TypeScript types are properly defined
- The solution handles both initial load and tab switching scenarios

## Version
- React Query: ^5.90.5
- Fix Version: V2 (Complete Rewrite)
- Date: October 18, 2025

