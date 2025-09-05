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

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await api.get('/auth/profile')
          setUser(response.data.user)
        } catch (error) {
          // Token might be expired, try refresh
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            const refreshSuccess = await refreshTokens()
            if (!refreshSuccess) {
              clearAuthData()
            }
          } else {
            clearAuthData()
          }
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const clearAuthData = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) return false

      const response = await api.post('/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      })

      localStorage.setItem('access_token', response.data.access_token)
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

      // Store tokens
      localStorage.setItem('access_token', response.data.access_token)
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }

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