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


