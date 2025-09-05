'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import api from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  phone?: string
  created_at: string
  last_login?: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  updateProfile: (data: UpdateProfileData) => Promise<boolean>
  refreshToken: () => Promise<boolean>
}

interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

interface UpdateProfileData {
  username?: string
  email?: string
  full_name?: string
  phone?: string
  current_password?: string
  new_password?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Initialize auth state by checking if we have valid cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Make a simple request to check if we have valid cookies
        const response = await api.get('/auth/profile')
        setUser(response.data.user)
      } catch (error: any) {
        // If 401, we're not authenticated - this is normal
        if (error?.response?.status === 401) {
          setUser(null)
        } else {
          console.error('Auth initialization error:', error)
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const clearAuthData = () => {
    // Cookies are cleared by the server, just clear user state
    setUser(null)
  }

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const response = await api.post('/auth/refresh')
      setUser(response.data.user)
      return true
    } catch (error) {
      clearAuthData()
      return false
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await api.post('/auth/login', credentials)

      // Tokens are now stored in HttpOnly cookies by the server
      setUser(response.data.user)
      toast.success('Login successful!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    clearAuthData()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const updateProfile = async (data: UpdateProfileData): Promise<boolean> => {
    try {
      const response = await api.put('/auth/profile', data)
      setUser(response.data.user)
      toast.success('Profile updated successfully!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.error || 'Profile update failed'
      toast.error(message)
      return false
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    refreshToken: refreshTokens,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}