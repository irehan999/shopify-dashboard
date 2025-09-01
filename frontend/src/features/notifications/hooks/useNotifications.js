import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../api/notificationAPI.js';
import useNotificationStore from '../../../stores/notificationStore.js';
import useAuthStore from '../../../stores/authStore.js';
import { toast } from 'react-hot-toast';

// Get notifications hook
export const useNotifications = (params = {}) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationAPI.getNotifications(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get unread count hook
export const useUnreadCount = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationAPI.getUnreadCount,
    enabled: isAuthenticated,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Mark as read hook
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { markAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: (data, notificationId) => {
      markAsRead(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark as read';
      toast.error(message);
    },
  });
};

// Mark all as read hook
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark all as read';
      toast.error(message);
    },
  });
};

// Delete notification hook
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { removeNotification } = useNotificationStore();

  return useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onSuccess: (data, notificationId) => {
      removeNotification(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete notification';
      toast.error(message);
    },
  });
};

// Get notification preferences hook
export const useNotificationPreferences = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: notificationAPI.getPreferences,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update notification preferences hook
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update preferences';
      toast.error(message);
    },
  });
};
