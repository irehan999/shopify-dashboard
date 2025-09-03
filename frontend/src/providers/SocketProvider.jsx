import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useAuthStore from "@/stores/authStore";
import useNotificationStore from "@/stores/notificationStore";
import { socket } from "@/lib/socket";

/**
 * Socket Provider Component
 * 
 * Manages Socket.IO connection lifecycle and event handling.
 * Automatically connects/disconnects based on authentication state.
 * Integrates with notification store and React Query for real-time updates.
 * 
 * Backend Integration:
 * - Connects to main socket namespace (no /user)
 * - Uses httpOnly cookies for authentication
 * - Handles user-specific events and notifications
 * - Syncs real-time data with React Query cache
 * 
 * Event Flow:
 * 1. User authenticates → Socket connects automatically
 * 2. Backend sends events → SocketProvider handles them
 * 3. Events update notification store → UI updates reactively
 * 4. Related queries invalidated → Fresh data fetched
 * 
 * Supported Events from Backend:
 * - new_notification: Real-time notifications
 * - notification_read: Mark notification as read
 * - notification_deleted: Remove notification
 * - system_announcement: System-wide messages
 * - connect/disconnect: Connection status
 * - connect_error: Connection failures
 *
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { handleSocketEvent } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("SocketProvider: Authentication state changed");
    console.log("User authenticated:", isAuthenticated);
    console.log("User data:", user);
    
    // Disconnect if user is not authenticated
    if (!isAuthenticated || !user?._id) {
      console.log("SocketProvider: User not authenticated, disconnecting socket");
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    // Connect socket if not already connected
    if (!socket.connected) {
      console.log("SocketProvider: Connecting socket for user:", user.email);
      socket.connect();
    }

    /**
     * Handle notification-related socket events
     * Delegates to notification store for state management
     * Invalidates React Query cache for fresh data
     * 
     * @param {string} eventName - Socket event name
     * @param {Object} data - Event payload from backend
     */
    const handleNotificationEvent = (eventName, data) => {
      console.log(`SocketProvider: Received event: ${eventName}`, data);
      
      // Let notification store handle the event
      handleSocketEvent(eventName, data);
      
      // Invalidate notification queries for fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      // Handle specific business logic based on event type
      switch (eventName) {
        case 'new_notification':
          // Additional handling for new notifications if needed
          break;
          
        case 'notification_read':
          // Sync read status across tabs/devices
          break;
          
        case 'notification_deleted':
          // Remove from local cache
          break;
          
        case 'system_announcement':
          // Handle system-wide announcements
          queryClient.invalidateQueries({ queryKey: ["system", "announcements"] });
          break;
          
        default:
          // Log unhandled events
          console.log(`SocketProvider: Unhandled event: ${eventName}`);
      }
    };

    // Register event listeners for all notification events
    const notificationEvents = [
      'new_notification',
      'notification_read', 
      'notification_deleted',
      'system_announcement'
    ];

    notificationEvents.forEach(eventName => {
      socket.on(eventName, (data) => handleNotificationEvent(eventName, data));
    });

    // Connection status event handlers
    socket.on("connect", () => {
      console.log("SocketProvider: Socket connected successfully");
      // Update connection status in notification store
      useNotificationStore.getState().setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("SocketProvider: Socket disconnected:", reason);
      // Update connection status in notification store
      useNotificationStore.getState().setConnected(false);
    });

    // Minimal auth error handling without loops
    socket.on("auth_error", () => {
      console.error("SocketProvider: auth_error received");
      useAuthStore.getState().logout();
    });

    socket.on("session_expired", () => {
      console.warn("SocketProvider: session_expired received");
      useAuthStore.getState().logout();
    });

    // Handle token refresh needed signal from backend
    socket.on("token_refresh_needed", () => {
      console.log("SocketProvider: token_refresh_needed received");
      // Let HTTP layer handle refresh; keep socket simple
    });

  socket.on("connect_error", (error) => {
      console.error("SocketProvider: Socket connection error:", error.message);
      console.error("Error details:", {
        type: error.type,
        description: error.description,
        context: error.context
      });
      // Update connection status
      useNotificationStore.getState().setConnected(false);
    });

    // Cleanup function - remove all event listeners
    return () => {
      console.log("SocketProvider: Cleaning up socket listeners");
      
      // Remove notification event listeners
      notificationEvents.forEach(eventName => {
        socket.off(eventName);
      });
      
      // Remove connection event listeners
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("auth_error");
      socket.off("session_expired");
      socket.off("token_refresh_needed");
    };
  }, [isAuthenticated, user, handleSocketEvent, queryClient]);

  return children;
};
