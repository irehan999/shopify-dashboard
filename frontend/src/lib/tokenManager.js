/**
 * Token Manager - Handles JWT token lifecycle
 * Provides proactive token refresh and expiry management
 */

import { api } from './api.js';
import useAuthStore from '@/stores/authStore.js';

class TokenManager {
  constructor() {
    this.refreshTimer = null;
    this.isRefreshing = false;
  }

  /**
   * Start automatic token refresh cycle
   * Refreshes token 5 minutes before expiry
   */
  startTokenRefreshCycle() {
    // Clear any existing timer
    this.stopTokenRefreshCycle();
    
    // Set refresh timer for 55 minutes (5 minutes before 1-hour expiry)
    this.refreshTimer = setInterval(async () => {
      await this.refreshTokenSilently();
    }, 55 * 60 * 1000); // 55 minutes
    
    console.log('Token refresh cycle started - will refresh every 55 minutes');
  }

  /**
   * Stop automatic token refresh cycle
   */
  stopTokenRefreshCycle() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('Token refresh cycle stopped');
    }
  }

  /**
   * Refresh token silently in background
   */
  async refreshTokenSilently() {
    if (this.isRefreshing) {
      return;
    }

    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      this.stopTokenRefreshCycle();
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('Performing background token refresh...');
      
      const response = await api.post('/api/auth/refresh-token');
      
      if (response.status === 200) {
        console.log('Background token refresh successful');
      }
    } catch (error) {
      console.error('Background token refresh failed:', error);
      
      // If refresh fails, log out user
      if (error.response?.status === 401) {
        console.log('Refresh token expired, logging out user');
        useAuthStore.getState().logout();
        this.stopTokenRefreshCycle();
        
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/login';
        }
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check if we should start refresh cycle on app startup
   */
  initializeOnStartup() {
    const { isAuthenticated } = useAuthStore.getState();
    
    if (isAuthenticated) {
      // Verify current token is still valid
      this.verifyTokenAndStartCycle();
    }
  }

  /**
   * Verify current token and start refresh cycle if valid
   */
  async verifyTokenAndStartCycle() {
    try {
      // Make a simple API call to verify token
      const response = await api.get('/api/auth/current-user');
      
      if (response.status === 200) {
        console.log('Token verified on startup, starting refresh cycle');
        this.startTokenRefreshCycle();
      }
    } catch (error) {
      console.log('Token verification failed on startup, clearing auth state');
      useAuthStore.getState().logout();
    }
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

export default tokenManager;
