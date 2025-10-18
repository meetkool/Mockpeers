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


