import { api } from '../../../lib/api.js';

/**
 * Notification API Module
 * 
 * Handles all notification-related API calls to the backend.
 * Follows the same pattern as your e-commerce app for consistency.
 * 
 * Backend Integration:
 * - Base URL: /api/notifications
 * - Authentication: Required for all endpoints
 * - Pagination: Supports page and limit parameters
 * - Real-time: Works with Socket.IO for live updates
 * 
 * Expected Backend Responses:
 * ```json
 * {
 *   "statusCode": 200,
 *   "data": {
 *     "notifications": [...],
 *     "count": 10,
 *     "totalPages": 3
 *   },
 *   "message": "Success message",
 *   "success": true
 * }
 * ```
 */

export const notificationAPI = {
  /**
   * Get User Notifications (Paginated)
   * 
   * Backend Endpoint: GET /api/notifications
   * Backend Expects: ?page=1&limit=10
   * Backend Returns: { notifications, count, totalPages }
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @returns {Promise<Object>} Backend response with notifications
   */
  getUserNotifications: (params = {}) => {
    return api.get('/api/notifications', { params });
  },

  /**
   * Get Unread Notification Count
   * 
   * Backend Endpoint: GET /api/notifications/unread-count
   * Backend Expects: Valid authentication token
   * Backend Returns: { count }
   * 
   * @returns {Promise<Object>} Backend response with unread count
   */
  getUnreadCount: () => {
    return api.get('/api/notifications/unread-count');
  },

  /**
   * Mark Notification as Read
   * 
   * Backend Endpoint: PATCH /api/notifications/:id/read
   * Backend Expects: Valid notification ID in params
   * Backend Returns: { notification }
   * 
   * @param {string} notificationId - Notification ID to mark as read
   * @returns {Promise<Object>} Backend response with updated notification
   */
  markAsRead: (notificationId) => {
    return api.patch(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Mark All Notifications as Read
   * 
   * Backend Endpoint: PATCH /api/notifications/mark-all-read
   * Backend Expects: Valid authentication token
   * Backend Returns: { message }
   * 
   * @returns {Promise<Object>} Backend response confirming bulk update
   */
  markAllAsRead: () => {
    return api.patch('/api/notifications/mark-all-read');
  },

  /**
   * Delete Notification
   * 
   * Backend Endpoint: DELETE /api/notifications/:id
   * Backend Expects: Valid notification ID in params
   * Backend Returns: { message }
   * 
   * @param {string} notificationId - Notification ID to delete
   * @returns {Promise<Object>} Backend response confirming deletion
   */
  deleteNotification: (notificationId) => {
    return api.delete(`/api/notifications/${notificationId}`);
  },
};
