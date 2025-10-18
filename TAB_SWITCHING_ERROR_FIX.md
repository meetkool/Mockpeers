# Tab Switching Error Fix - React Query Infinite Query

## Problem
When switching between Schedule Management tabs (DSA, System Design, Behavioral, etc.), the following error occurred:

```
TypeError: Cannot read properties of undefined (reading 'length')
    at getNextPageParam (infiniteQueryBehavior.js:106:27)
    at hasNextPage (infiniteQueryBehavior.js:119:10)
    at InfiniteQueryObserver.createResult (infiniteQueryObserver.js:58:90)
```

## Root Cause
The error was happening **inside React Query's internal code**, not in our application code. When initializing an infinite query (especially during tab switches), React Query v5 was trying to compute pagination state before any data was fetched. Specifically, it was trying to access `pages.length` on an undefined `pages` array.

## Solution Applied

### File: `lib/hooks/useSchedules.ts`

#### 1. **Added Proper Type Parameters**
```typescript
useInfiniteQuery<PaginatedResponse, Error, InfiniteData<PaginatedResponse>, string[], string | undefined>({
  // ...
})
```

#### 2. **Changed Page Param Type**
- Changed from `initialPageParam: null` to `initialPageParam: undefined`
- React Query v5 expects `undefined` for "no more pages"

#### 3. **Added Comprehensive Guards in `getNextPageParam`**
```typescript
getNextPageParam: (lastPage, allPages) => {
  try {
    // Check if allPages exists and is valid array
    if (!allPages || !Array.isArray(allPages) || allPages.length === 0) {
      return undefined;
    }
    
    // Check if lastPage exists
    if (!lastPage) {
      return undefined;
    }
    
    // Check pagination object
    if (!lastPage.pagination) {
      return undefined;
    }
    
    // Get next cursor
    const { hasMore, nextCursor } = lastPage.pagination;
    
    // Return undefined (not null) when no more pages
    if (!hasMore || !nextCursor) {
      return undefined;
    }
    
    return nextCursor;
  } catch (error) {
    console.error('[USE_SCHEDULES] Error in getNextPageParam:', error);
    return undefined;
  }
}
```

#### 4. **Most Important: Provided Initial Data Structure** ⭐
```typescript
initialData: { pages: [], pageParams: [] }
```

This is the **critical fix** that prevents React Query from trying to access `undefined.length`. By providing an empty array structure, React Query can safely compute `[].length = 0` during initialization.

#### 5. **Added Other Safety Options**
```typescript
enabled: !!interviewType,
refetchOnMount: true,
refetchOnWindowFocus: false,
```

## Why This Works

When you switch tabs:
1. The query key changes: `['schedules', 'DSA', 'ALL']` → `['schedules', 'SYSTEM_DESIGN', 'ALL']`
2. React Query unmounts the old query and creates a new observer
3. During initialization, React Query tries to compute `hasNextPage` 
4. Without initial data, it would access `undefined.pages.length` → **ERROR**
5. With initial data `{ pages: [], pageParams: [] }`, it accesses `[].length = 0` → **SUCCESS**

## Testing
To verify the fix:
1. Navigate to Admin → Schedule Management
2. Switch between different interview type tabs rapidly
3. The error should no longer occur
4. Data should load smoothly for each tab

## Additional Notes
- This is a known edge case in React Query v5 when using `useInfiniteQuery`
- The fix ensures backward compatibility with existing code
- All safety guards are wrapped in try-catch for extra protection
- Console logs are included for debugging during development

## Version
- React Query Version: ^5.90.5
- Fix Applied: October 18, 2025
- Hook Version: v2.4

