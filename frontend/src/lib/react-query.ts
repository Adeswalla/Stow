/**
 * React Query configuration and utilities
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default query client configuration
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests up to 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
};

/**
 * Create a new query client instance
 */
export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}

/**
 * Query keys factory for consistent key management
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  // Savings
  savings: {
    all: ['savings'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.savings.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.savings.all, 'detail', id] as const,
    stats: () => [...queryKeys.savings.all, 'stats'] as const,
  },
  // Activity
  activity: {
    all: ['activity'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.activity.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.activity.all, 'detail', id] as const,
  },
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.notifications.all, 'list', filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    savings: (timeRange?: string) => 
      [...queryKeys.analytics.all, 'savings', timeRange] as const,
  },
  // Settings
  settings: {
    all: ['settings'] as const,
    profile: () => [...queryKeys.settings.all, 'profile'] as const,
    preferences: () => [...queryKeys.settings.all, 'preferences'] as const,
  },
} as const;
