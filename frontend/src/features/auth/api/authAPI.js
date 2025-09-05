import { api } from '../../../lib/api.js';

/**
 * Authentication API Module
 * 
 * Handles all authentication-related API calls to the backend.
 * Integrates with backend auth routes and manages user authentication flow.
 * 
 * Backend Integration:
 * - Base URL: /api/auth
 * - Authentication: JWT tokens in httpOnly cookies
 * - CSRF Protection: Handled by backend middleware
 * - Rate Limiting: Applied on backend for security
 * 
 * Expected Backend Responses:
 * ```json
 * {
 *   "statusCode": 200,
 *   "data": {
 *     "user": { ... },
 *     "accessToken": "...",
 *     "refreshToken": "..."
 *   },
 *   "message": "Success message",
 *   "success": true
 * }
 * ```
 * 
 * Usage:
 * ```javascript
 * import { authAPI } from '@/features/auth/api/authAPI';
 * 
 * // Login user
 * const response = await authAPI.login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * ```
 */

// Auth API endpoints
export const authAPI = {
  /**
   * Register New User
   * 
   * Backend Endpoint: POST /api/auth/register
   * Backend Expects: { fullName, username, email, password }
   * Backend Returns: { user, accessToken, refreshToken }
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.fullName - User's full name
   * @param {string} userData.username - Unique username
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Backend response with user data and tokens
   */
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  /**
   * Login User
   * 
   * Backend Endpoint: POST /api/auth/login
   * Backend Expects: { email, password }
   * Backend Returns: { user, accessToken, refreshToken }
   * Sets httpOnly cookies: accessToken, refreshToken
   * 
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Backend response with user data and tokens
   */
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Logout User
   * 
   * Backend Endpoint: POST /api/auth/logout
   * Backend Expects: No body (uses cookies)
   * Backend Returns: { message }
   * Clears httpOnly cookies: accessToken, refreshToken
   * 
   * @returns {Promise<Object>} Backend response confirming logout
   */
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  /**
   * Refresh Access Token
   * 
   * Backend Endpoint: POST /api/auth/refresh-token
   * Backend Expects: Valid refresh token in cookies
   * Backend Returns: { user, accessToken, refreshToken }
   * Used when: Access token expires, automatic token refresh
   * 
   * @returns {Promise<Object>} Backend response with new tokens
   */
  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh-token');
    return response.data;
  },

  /**
   * Get Current User
   * 
   * Backend Endpoint: GET /api/auth/current-user
   * Backend Expects: Valid access token in cookies
   * Backend Returns: { user }
   * Used for: Auto-login, token validation, user data refresh
   * 
   * @returns {Promise<Object>} Backend response with current user data
   */
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/current-user');
    return response.data;
  },

  /**
   * Change Password
   * 
   * Backend Endpoint: POST /api/auth/change-password
   * Backend Expects: { oldPassword, newPassword }
   * Backend Returns: { message }
   * Requires: Valid authentication
   * 
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.oldPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Backend response confirming password change
   */
  changePassword: async (passwordData) => {
    const response = await api.post('/api/auth/change-password', passwordData);
    return response.data;
  },
};
