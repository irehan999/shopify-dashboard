import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Notification Store
 * 
 * Handles all backend interactions and real-time updates
 * Follows the same pattern as your e-commerce app for consistency
 * 
 * Backend Integration:
 * - Fetches notifications from /api/notifications
 * - Real-time updates via Socket.IO
 * - Optimistic UI updates with backend sync
 * - Handles read/unread status properly
 * 
 * Features:
 * - Auto-sync on login
 * - Real-time socket events
 * - Optimistic updates
 * - Pagination support
 * - Browser notifications
 * 
 * Usage:
 * ```javascript
 * const { 
 *   notifications, 
 *   unreadCount, 
 *   fetchNotifications,
 *   markAsRead,
 *   syncWithBackend 
 * } = useNotificationStore();
 * ```
 */

const useNotificationStore = create(
  persist(
    subscribeWithSelector((set, get) => ({
      // STATE
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastSynced: null,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      isConnected: false,

      // ACTIONS

      /**
       * Fetches notifications from backend with pagination
       * Used for initial load and pagination
       */
      fetchNotifications: async ({ page = 1, limit = 10, append = false } = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          // Import API function dynamically to avoid circular dependency
          const { notificationAPI } = await import('../features/notifications/api/notificationAPI.js');
          
          const response = await notificationAPI.getUserNotifications({ page, limit });
          const notifications = response.data.notifications || [];
          const totalPages = response.data.totalPages || 1;
          
          // Calculate unread count
          const unreadCount = notifications.filter(n => !n.read).length;

          if (append) {
            set(state => ({
              notifications: [...state.notifications, ...notifications],
              currentPage: page,
              totalPages,
              hasMore: page < totalPages,
              isLoading: false
            }));
          } else {
            set({
              notifications,
              unreadCount,
              currentPage: page,
              totalPages,
              hasMore: page < totalPages,
              lastSynced: new Date().toISOString(),
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({ 
            error: 'Failed to load notifications',
            isLoading: false 
          });
        }
      },

      /**
       * Called on login - syncs notifications from backend
       * Backend is the source of truth for authenticated users
       */
      syncWithBackend: async () => {
        console.log('=== NOTIFICATION SYNC WITH BACKEND ===');
        
        // Check if user is authenticated (import dynamically)
        const { default: useAuthStore } = await import('./authStore.js');
        if (!useAuthStore.getState().isAuthenticated) {
          console.log('User not authenticated, skipping notification sync');
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const { notificationAPI } = await import('../features/notifications/api/notificationAPI.js');
          
          // Fetch notifications and unread count in parallel
          const [notificationsResponse, unreadResponse] = await Promise.all([
            notificationAPI.getUserNotifications({ page: 1, limit: 20 }),
            notificationAPI.getUnreadCount()
          ]);

          const notifications = notificationsResponse.data.notifications || [];
          const unreadCount = unreadResponse.data.count || 0;
          const totalPages = notificationsResponse.data.totalPages || 1;

          // Sort notifications: unread first, then by date
          const sortedNotifications = notifications.sort((a, b) => {
            if (a.read !== b.read) {
              return a.read ? 1 : -1; // Unread first
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          console.log('Backend sync results:', {
            totalNotifications: notifications.length,
            unreadCount,
            calculatedUnread: notifications.filter(n => !n.read).length
          });

          set({
            notifications: sortedNotifications,
            unreadCount,
            currentPage: 1,
            totalPages,
            hasMore: totalPages > 1,
            lastSynced: new Date().toISOString(),
            isLoading: false,
            error: null,
          });

          console.log('Notification sync completed successfully');
        } catch (error) {
          console.error('Notification sync failed:', error);
          set({ 
            error: 'Failed to sync notifications',
            isLoading: false 
          });
        }
      },

      /**
       * Adds a new notification (from real-time socket events)
       * Updates UI instantly and increments unread count
       */
      addNotification: (notification) => {
        console.log('Adding real-time notification:', notification);
        
        set(state => {
          // Check if notification already exists
          const exists = state.notifications.some(n => n._id === notification._id);
          if (exists) {
            console.log('Notification already exists, skipping');
            return state;
          }

          return {
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + (notification.read ? 0 : 1),
          };
        });
        
        // Show browser notification
        get().showBrowserNotification(notification);
      },

      /**
       * Marks a notification as read
       * Updates UI optimistically, syncs with backend
       */
      markAsRead: async (notificationId) => {
        // Find the notification to check if it's already read
        const notification = get().notifications.find(n => n._id === notificationId);
        if (!notification || notification.read) return;

        // Optimistic update
        set(state => ({
          notifications: state.notifications.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        // Sync with backend
        try {
          const { notificationAPI } = await import('../features/notifications/api/notificationAPI.js');
          await notificationAPI.markAsRead(notificationId);
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
          // Revert optimistic update
          set(state => ({
            notifications: state.notifications.map(n =>
              n._id === notificationId ? { ...n, read: false } : n
            ),
            unreadCount: state.unreadCount + 1,
          }));
        }
      },

      /**
       * Marks all notifications as read
       * Updates UI optimistically, syncs with backend
       */
      markAllAsRead: async () => {
        const unreadNotifications = get().notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) return;

        // Optimistic update
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));

        // Sync with backend
        try {
          const { notificationAPI } = await import('../features/notifications/api/notificationAPI.js');
          await notificationAPI.markAllAsRead();
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
          // Revert optimistic update
          set(state => ({
            notifications: state.notifications.map(n => {
              const wasUnread = unreadNotifications.find(un => un._id === n._id);
              return wasUnread ? { ...n, read: false } : n;
            }),
            unreadCount: unreadNotifications.length,
          }));
        }
      },

      /**
       * Deletes a notification
       * Updates UI optimistically, syncs with backend
       */
      deleteNotification: async (notificationId) => {
        const notification = get().notifications.find(n => n._id === notificationId);
        if (!notification) return;

        const wasUnread = !notification.read;

        // Optimistic update
        set(state => ({
          notifications: state.notifications.filter(n => n._id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        }));

        // Sync with backend
        try {
          const { notificationAPI } = await import('../features/notifications/api/notificationAPI.js');
          await notificationAPI.deleteNotification(notificationId);
        } catch (error) {
          console.error('Failed to delete notification:', error);
          // Revert optimistic update
          set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: wasUnread ? state.unreadCount + 1 : state.unreadCount,
          }));
        }
      },

      /**
       * Handle different socket events based on type
       */
      handleSocketEvent: (eventName, data) => {
        console.log(`Handling socket event: ${eventName}`, data);

        switch (eventName) {
          case 'new_notification':
            get().addNotification(data);
            break;
            
          case 'notification_read':
            get().markAsRead(data.notificationId || data._id);
            break;
            
          case 'notification_deleted':
            get().removeNotification(data.notificationId || data._id);
            break;
            
          case 'system_announcement':
            get().addNotification({
              ...data,
              type: 'system',
              priority: 'high'
            });
            break;
            
          default:
            console.warn(`Unhandled socket event: ${eventName}`, data);
        }
      },

      /**
       * Show Browser Notification
       */
      showBrowserNotification: async (notification) => {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
          console.log('Browser does not support notifications');
          return;
        }

        // Request permission if not already granted
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permission denied');
            return;
          }
        }

        // Show notification only if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification._id,
            badge: '/favicon.ico',
            timestamp: Date.now(),
          });
        }
      },

      /**
       * Loads more notifications (pagination)
       */
      loadMore: async () => {
        const { currentPage, totalPages, isLoading } = get();
        
        if (isLoading || currentPage >= totalPages) return;

        await get().fetchNotifications({ 
          page: currentPage + 1, 
          limit: 10, 
          append: true 
        });
      },

      /**
       * Clears all notifications (usually on logout)
       */
      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
          currentPage: 1,
          totalPages: 1,
          hasMore: false,
          lastSynced: null,
          error: null,
        });
      },

      // Connection status
      setConnected: (isConnected) => set({ isConnected }),

      // Initialize browser notifications
      requestNotificationPermission: async () => {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      },

      // Helper functions
      getNotificationsByType: (type) => {
        const { notifications } = get();
        return notifications.filter(n => n.type === type);
      },

      getRecentNotifications: () => {
        const { notifications } = get();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return notifications.filter(n => new Date(n.createdAt) > yesterday);
      },

      // Reset store
      reset: () => 
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          error: null,
          lastSynced: null,
          currentPage: 1,
          totalPages: 1,
          hasMore: false,
          isConnected: false,
        }),
    })),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastSynced: state.lastSynced,
      }),
    }
  )
);

// Subscribe to auth store changes to handle login/logout
// This will auto-sync notifications when user logs in
if (typeof window !== 'undefined') {
  import('./authStore.js').then(({ default: useAuthStore }) => {
    useAuthStore.subscribe((state, prevState) => {
      // User just logged in
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        console.log('User logged in, syncing notifications...');
        useNotificationStore.getState().syncWithBackend();
      }
      
      // User just logged out
      if (!state.isAuthenticated && prevState.isAuthenticated) {
        console.log('User logged out, clearing notifications...');
        useNotificationStore.getState().clearNotifications();
      }
    });
  });
}

export default useNotificationStore;
