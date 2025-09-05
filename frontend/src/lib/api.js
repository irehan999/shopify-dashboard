import axios from 'axios'

// Create base axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track refresh attempts to prevent infinite loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // No need to manually add tokens - httpOnly cookies handle auth
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with proper refresh token handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 errors (unauthorized) with proper refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints to prevent infinite loops
      if (originalRequest.url?.includes('/api/auth/')) {
        return Promise.reject(error)
      }
      
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true
      isRefreshing = true;
      
      console.log('Token expired, attempting refresh...')
      
      try {
        // Try to refresh the token using a separate axios instance to avoid interceptor loops
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, {
          baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
          withCredentials: true,
          timeout: 5000, // Short timeout for refresh
        })
        
        if (refreshResponse.status === 200) {
          console.log('Token refreshed successfully, retrying queued requests')
          isRefreshing = false;
          processQueue(null);
          
          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, log out the user
        console.log('Token refresh failed, logging out user:', refreshError.response?.data?.message || refreshError.message)
        
        isRefreshing = false;
        processQueue(refreshError);
        
        // Clear auth state - import dynamically to avoid circular dependency
        try {
          const { default: useAuthStore } = await import('@/stores/authStore')
          useAuthStore.getState().logout()
          
          // Only redirect if we're not already on login page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
            window.location.href = '/auth/login'
          }
        } catch (importError) {
          console.error('Failed to import auth store:', importError)
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    // Handle other errors
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

export { api }
export default api
