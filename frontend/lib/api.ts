import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com/api' 
    : 'http://localhost:5001/api',
  timeout: 10000,
  withCredentials: true, // Enable cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (tokens now handled by cookies)
api.interceptors.request.use(
  (config) => {
    // Tokens are now automatically included via cookies
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Only try to refresh if this is not already a refresh request or login/logout
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh')
      const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/logout')
      
      if (!isRefreshRequest && !isAuthRequest) {
        try {
          // Try to refresh using cookies (no manual token handling needed)
          await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            {
              withCredentials: true
            }
          )

          // Retry original request - tokens are now refreshed in cookies
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, only redirect if we're not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api