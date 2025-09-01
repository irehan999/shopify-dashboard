import { api } from '../../../lib/api.js';

/**
 * User API Module
 * 
 * Handles all user-related API calls to the backend.
 * Manages user profile, preferences, avatar, and account operations.
 * 
 * Backend Integration:
 * - Base URL: /api/user
 * - Authentication: Required for all endpoints
 * - File Upload: Multipart/form-data for avatar uploads
 * - CRUD Operations: Full user profile management
 * 
 * Expected Backend Responses:
 * ```json
 * {
 *   "statusCode": 200,
 *   "data": { user: {...}, avatar: {...} },
 *   "message": "Success message",
 *   "success": true
 * }
 * ```
 * 
 * Usage:
 * ```javascript
 * import { userAPI } from '@/features/user/api/userAPI';
 * 
 * // Get user profile
 * const profile = await userAPI.getProfile();
 * 
 * // Upload avatar
 * const file = event.target.files[0];
 * const result = await userAPI.uploadAvatar(file);
 * ```
 */

export const userAPI = {
  /**
   * Get User Profile
   * 
   * Backend Endpoint: GET /api/user/profile
   * Backend Expects: Valid authentication token
   * Backend Returns: { user } - Complete user profile data from database
   * 
   * @returns {Promise<Object>} Backend response with user profile
   */
  getProfile: () => {
    return api.get('/api/user/profile');
  },

  /**
   * Update User Profile
   * 
   * Backend Endpoint: PATCH /api/user/profile
   * Backend Expects: { fullName?, email?, username? }
   * Backend Returns: { user } - Updated user data
   * Validation: Checks for unique email/username
   * 
   * @param {Object} profileData - Profile update data
   * @param {string} [profileData.fullName] - User's full name
   * @param {string} [profileData.email] - User's email
   * @param {string} [profileData.username] - User's username
   * @returns {Promise<Object>} Backend response with updated profile
   */
  updateProfile: (profileData) => {
    return api.patch('/api/user/profile', profileData);
  },

  /**
   * Upload/Update User Avatar
   * 
   * Backend Endpoint: POST /api/user/avatar
   * Backend Expects: FormData with 'avatar' file + action='upload'
   * Backend Returns: { user, avatar } - Updated user with new avatar
   * Special Features:
   * - Automatically replaces existing avatar
   * - Deletes old Cloudinary image before uploading new one
   * - Handles both new uploads and replacements
   * 
   * @param {File} avatarFile - Image file to upload (jpg, png, gif)
   * @returns {Promise<Object>} Backend response with avatar data
   */
  uploadAvatar: (avatarFile) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    formData.append('action', 'upload');
    
    return api.post('/api/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete User Avatar
   * 
   * Backend Endpoint: DELETE /api/user/avatar
   * Backend Expects: No body (uses authentication token)
   * Backend Returns: { user } - User data without avatar
   * Special: Removes avatar from Cloudinary and user document
   * 
   * @returns {Promise<Object>} Backend response confirming deletion
   */
  deleteAvatar: () => {
    return api.delete('/api/user/avatar');
  },

  /**
   * Get User Statistics
   * 
   * Backend Endpoint: GET /api/user/stats
   * Backend Expects: Valid authentication token
   * Backend Returns: { stats } - User activity and account statistics
   * Includes: Account creation date, last login, verification status
   * 
   * @returns {Promise<Object>} Backend response with user stats
   */
  getStats: () => {
    return api.get('/api/user/stats');
  },

  /**
   * Deactivate User Account (Temporary)
   * 
   * Backend Endpoint: POST /api/user/deactivate
   * Backend Expects: { password, reason? }
   * Backend Returns: { message } - Confirmation message
   * Effects:
   * - Sets isBlocked: true
   * - Clears refresh token
   * - Clears authentication cookies
   * - Account can be reactivated later
   * 
   * @param {string} password - User's current password for verification
   * @param {string} [reason] - Optional reason for deactivation
   * @returns {Promise<Object>} Backend response confirming deactivation
   */
  deactivateAccount: (password, reason) => {
    return api.post('/api/user/deactivate', { password, reason });
  },
};
