/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import * as api from '@/lib/api'

// Mock the API module
jest.mock('@/lib/api')
const mockApi = api as jest.Mocked<typeof api>

// Mock React Toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Test component that uses the auth context
const TestComponent = () => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout, 
    updateProfile, 
    refreshToken 
  } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateProfile({ full_name: 'Updated Name' })}>
        Update Profile
      </button>
      <button onClick={() => refreshToken()}>Refresh Token</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset API mock to default resolved state
    mockApi.get.mockResolvedValue({ data: {} })
    mockApi.post.mockResolvedValue({ data: {} })
    mockApi.put.mockResolvedValue({ data: {} })
  })

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('should initialize authenticated user when valid token exists', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }
      
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
    })

    it('should handle initialization error gracefully', async () => {
      mockApi.get.mockRejectedValueOnce({
        response: { status: 401 }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  describe('Login functionality', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      // Mock initialization (no user)
      mockApi.get.mockResolvedValueOnce({
        data: {}
      })

      // Mock login success
      mockApi.post.mockResolvedValueOnce({
        data: {
          message: 'Login successful',
          user: mockUser
        }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Click login button
      fireEvent.click(screen.getByText('Login'))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password'
      })
    })

    it('should handle login error', async () => {
      // Mock initialization (no user)
      mockApi.get.mockResolvedValueOnce({
        data: {}
      })

      // Mock login failure
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: { error: 'Invalid credentials' }
        }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Click login button
      fireEvent.click(screen.getByText('Login'))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('should set loading state during login', async () => {
      // Mock initialization (no user)
      mockApi.get.mockResolvedValueOnce({
        data: {}
      })

      // Mock slow login response
      mockApi.post.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { user: {} } }), 100)
        )
      )

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Click login button
      fireEvent.click(screen.getByText('Login'))

      // Should show loading during login
      expect(screen.getByTestId('loading')).toHaveTextContent('true')

      // Wait for login to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
    })
  })

  describe('Logout functionality', () => {
    it('should logout user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      // Mock initialization with authenticated user
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      // Mock logout success
      mockApi.post.mockResolvedValueOnce({
        data: { message: 'Logged out successfully' }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization with user
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Click logout button
      fireEvent.click(screen.getByText('Logout'))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('should logout even if API call fails', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      // Mock initialization with authenticated user
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      // Mock logout API failure
      mockApi.post.mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Click logout button
      fireEvent.click(screen.getByText('Logout'))

      // Should still logout locally despite API failure
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  describe('Profile update functionality', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      const updatedUser = {
        ...mockUser,
        full_name: 'Updated Name'
      }

      // Mock initialization
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      // Mock profile update success
      mockApi.put.mockResolvedValueOnce({
        data: { user: updatedUser }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Click update profile button
      fireEvent.click(screen.getByText('Update Profile'))

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(updatedUser))
      })

      expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', {
        full_name: 'Updated Name'
      })
    })

    it('should handle profile update error', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      // Mock initialization
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      // Mock profile update failure
      mockApi.put.mockRejectedValueOnce({
        response: {
          data: { error: 'Update failed' }
        }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Click update profile button
      fireEvent.click(screen.getByText('Update Profile'))

      // User data should remain unchanged
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      })
    })
  })

  describe('Token refresh functionality', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      // Mock initialization
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      // Mock refresh success
      mockApi.post.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Click refresh token button
      fireEvent.click(screen.getByText('Refresh Token'))

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    it('should handle refresh token failure', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true
      }

      // Mock initialization
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      })

      // Mock refresh failure
      mockApi.post.mockRejectedValueOnce(new Error('Token expired'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Click refresh token button
      fireEvent.click(screen.getByText('Refresh Token'))

      // Should clear user data on refresh failure
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  describe('Error handling', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      spy.mockRestore()
    })
  })
})