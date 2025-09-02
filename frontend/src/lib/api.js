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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access - clear auth and redirect
      console.log('Unauthorized access, redirecting to login');
      // You can dispatch logout action here
    }
    
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

export { api }
export default api
