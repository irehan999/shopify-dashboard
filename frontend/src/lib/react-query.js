import { QueryClient } from '@tanstack/react-query'

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // Stores
  stores: {
    all: ['stores'],
    list: (filters) => ['stores', 'list', filters],
    detail: (id) => ['stores', 'detail', id],
  },
  
  // Products
  products: {
    all: ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    byStore: (storeId) => ['products', 'byStore', storeId],
  },
  
  // Orders
  orders: {
    all: ['orders'],
    list: (filters) => ['orders', 'list', filters],
    detail: (id) => ['orders', 'detail', id],
    byStore: (storeId) => ['orders', 'byStore', storeId],
  },
  
  // Analytics
  analytics: {
    dashboard: (dateRange) => ['analytics', 'dashboard', dateRange],
    revenue: (filters) => ['analytics', 'revenue', filters],
    products: (filters) => ['analytics', 'products', filters],
  },
}

// Common query options
export const commonQueryOptions = {
  // For real-time data that changes frequently
  realtime: {
    staleTime: 1000 * 30, // 30 seconds
    cacheTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60, // 1 minute
  },
  
  // For data that rarely changes
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  },
  
  // For user-specific data
  user: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  },
}
