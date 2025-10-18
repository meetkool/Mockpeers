"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 minutes - data stays fresh
        gcTime: 10 * 60 * 1000,          // 10 minutes - cache persists (renamed from cacheTime in v5)
        refetchOnWindowFocus: false,     // Don't refetch when tab focused
        refetchOnReconnect: true,        // Refetch when internet reconnects
        refetchOnMount: true,            // Refetch on component mount (changed to true for tab switching)
        retry: 1,                        // Retry failed requests once
        // Prevent undefined access errors during initialization
        notifyOnChangeProps: ['data', 'error'],
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


