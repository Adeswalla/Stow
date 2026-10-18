/**
 * Custom hooks for API data fetching with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

/**
 * Generic fetch function with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

/**
 * Hook for fetching savings list
 */
export function useSavings(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.savings.list(filters),
    queryFn: () => fetchApi('/savings', {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    }),
  });
}

/**
 * Hook for fetching savings detail
 */
export function useSavingsDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.savings.detail(id),
    queryFn: () => fetchApi(`/savings/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook for fetching savings stats
 */
export function useSavingsStats() {
  return useQuery({
    queryKey: queryKeys.savings.stats(),
    queryFn: () => fetchApi('/savings/stats'),
  });
}

/**
 * Hook for fetching activity list
 */
export function useActivity(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.activity.list(filters),
    queryFn: () => fetchApi('/activity', {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    }),
  });
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => fetchApi('/notifications', {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    }),
  });
}

/**
 * Hook for fetching unread notification count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => fetchApi('/notifications/unread-count'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook for fetching user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.settings.profile(),
    queryFn: () => fetchApi('/auth/profile'),
  });
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) =>
      fetchApi('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.profile() });
    },
  });
}

/**
 * Hook for marking notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Hook for creating a savings goal
 */
export function useCreateSavings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) =>
      fetchApi('/savings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate savings list
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.all });
    },
  });
}
