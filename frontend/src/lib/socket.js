import { io } from "socket.io-client";

/**
 * Socket.IO Client Configuration
 * 
 * Creates a socket instance for real-time communication with the backend.
 * This socket handles user-specific events like notifications, status updates, etc.
 * 
 * Backend Expectations:
 * - Server runs on VITE_SOCKET_URL with '/user' namespace
 * - Uses httpOnly cookies for authentication (withCredentials: true)
 * - Supports both websocket and polling transports
 * - Auto-reconnection with exponential backoff
 * 
 * Usage:
 * ```javascript
 * import { socket } from '@/lib/socket';
 * 
 * // Connect (done automatically by SocketProvider)
 * socket.connect();
 * 
 * // Listen for events
 * socket.on('new_notification', (data) => {
 *   console.log('New notification:', data);
 * });
 * 
 * // Emit events
 * socket.emit('join_room', { roomId: 'user_123' });
 * ```
 */

// Create socket instance with proper reconnection strategy
export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false, // Manual connection control via SocketProvider
  withCredentials: true, // Ensures httpOnly cookies are sent for auth
  transports: ["websocket", "polling"], // Fallback transport methods
  reconnection: true, // Enable auto-reconnection
  reconnectionAttempts: 5, // Max reconnection attempts
  reconnectionDelay: 1000, // Initial delay between reconnections (ms)
  timeout: 10000, // Connection timeout (ms)
  upgrade: true // Allow transport upgrades
});

/**
 * Socket Event Types Expected from Backend:
 * 
 * User Notifications:
 * - 'new_notification': Real-time notification delivery
 * - 'notification_read': Notification marked as read
 * - 'notification_deleted': Notification removed
 * 
 * System Events:
 * - 'system_announcement': Broadcast system messages
 * - 'maintenance_mode': Server maintenance notifications
 * 
 * Connection Events:
 * - 'connect': Successful connection established
 * - 'disconnect': Connection lost
 * - 'connect_error': Connection failed
 * - 'reconnect': Successfully reconnected
 * - 'reconnect_error': Reconnection failed
 * 
 * Authentication Events:
 * - 'auth_error': Authentication failed
 * - 'session_expired': User session expired
 */

export default socket;
