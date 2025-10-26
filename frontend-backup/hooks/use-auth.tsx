'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Types
export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  is_email_verified: boolean
  kyc_status: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  balance_neon: string
  referrer?: number
  ref_source_code?: string
  avatar?: string
  phone_number?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      if (isCheckingAuth || !isMounted) {
        console.log('checkAuth: Already checking auth or component unmounted, skipping...')
        return
      }
      
      // Check if we have valid data in localStorage
      const existingToken = localStorage.getItem('token')
      const existingUser = localStorage.getItem('user')
      
      console.log('🔍 CHECK_AUTH: localStorage check:', {
        hasToken: !!existingToken,
        hasUser: !!existingUser,
        tokenValue: existingToken ? existingToken.substring(0, 20) + '...' : 'No token',
        userValue: existingUser ? 'User data found' : 'No user data'
      })
      
      if (existingToken && existingUser && existingToken !== 'null' && existingToken !== 'undefined' && existingToken !== 'No token') {
        console.log('🔍 CHECK_AUTH: Valid token and user found in localStorage, setting user state...')
        try {
          const userData = JSON.parse(existingUser)
          setUser(userData)
          console.log('🔍 CHECK_AUTH: User state set from localStorage:', userData)
          setIsLoading(false)
          setAuthLoading(false)
          return
        } catch (parseError) {
          console.error('🔍 CHECK_AUTH: Failed to parse user data from localStorage:', parseError)
        }
      }
      
      setIsCheckingAuth(true)
      
      try {
        console.log('checkAuth: Starting authentication check...')
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        console.log('checkAuth: localStorage contents:', {
          token: token ? token.substring(0, 20) + '...' : 'No token',
          userData: userData ? 'User data found' : 'No user data',
          allKeys: Object.keys(localStorage)
        })
        
        if (token && userData && token !== 'No token' && token !== 'null' && token !== 'undefined') {
          try {
            console.log('checkAuth: Attempting to verify token...')
            
            // Verify token with backend
            const verifyResponse = await fetch('http://localhost:8000/api/auth/verify-token/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
            
            console.log('checkAuth: Token verification response status:', verifyResponse.status)
            
            if (verifyResponse.ok) {
              const responseData = await verifyResponse.json()
              console.log('checkAuth: Token verification response data:', responseData)
              
              if (responseData.valid && responseData.user) {
                console.log('checkAuth: Token is valid, setting user:', responseData.user)
                setUser(responseData.user)
                localStorage.setItem('user', JSON.stringify(responseData.user))
              } else {
                console.log('checkAuth: Token verification failed - invalid response')
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setUser(null)
              }
            } else {
              console.log('checkAuth: Token verification failed - HTTP error')
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setUser(null)
            }
          } catch (verifyError) {
            console.error('checkAuth: Token verification failed:', verifyError)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          }
        } else if (userData && (!token || token === 'No token' || token === 'null' || token === 'undefined')) {
          console.log('checkAuth: Found user data without valid token, keeping data for now...')
          // Don't clear data immediately, let user try to use the app
        } else {
          console.log('checkAuth: No token or user data found, setting user to null')
          setUser(null)
        }
        
        setIsLoading(false)
        setAuthLoading(false)
      } catch (error) {
        console.error('checkAuth: Auth check failed:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setIsLoading(false)
        setAuthLoading(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuth()
    
    // Listen for clearUserState event
    const handleClearUserState = () => {
      console.log('use-auth: Received clearUserState event, clearing user data')
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('password')
    }
    
    window.addEventListener('clearUserState', handleClearUserState)
    
    return () => {
      isMounted = false
      window.removeEventListener('clearUserState', handleClearUserState)
    }
  }, []) // Empty dependency array

  // Reset loading state when user changes
  useEffect(() => {
    if (user) {
      setIsLoading(false)
      setAuthLoading(false)
    }
  }, [user])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    console.log('🔐 LOGIN: Starting login process for:', email)
    setAuthLoading(true)
    try {
      console.log('🔐 LOGIN: Attempting login with:', { email })
      
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('🔐 LOGIN: Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔐 LOGIN: Failed with status', response.status, ':', errorData)
        return { success: false, error: errorData.error || 'Login failed' }
      }

      const data = await response.json()
      console.log('🔐 LOGIN: Response data received:', data)
      
      const { access, refresh, user: userData } = data
      
      console.log('🔐 LOGIN: Extracted data:', {
        hasAccess: !!access,
        hasRefresh: !!refresh,
        hasUser: !!userData,
        accessLength: access ? access.length : 0,
        refreshLength: refresh ? refresh.length : 0
      })
      
      if (!access || !refresh || !userData) {
        console.error('🔐 LOGIN: Missing required data from login response:', { access: !!access, refresh: !!refresh, user: !!userData })
        return { success: false, error: 'Invalid login response' }
      }
      
      // Store tokens and user data
      console.log('🔐 LOGIN: Storing data in localStorage...')
      localStorage.setItem('token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(userData))
      
      console.log('🔐 LOGIN: Data stored in localStorage:', {
        token: access.substring(0, 20) + '...',
        refresh_token: refresh.substring(0, 20) + '...',
        user: userData
      })
      
      // Clear old keys if they exist
      localStorage.removeItem('auth_token')
      
      // Set user state
      console.log('🔐 LOGIN: Setting user state:', userData)
      setUser(userData)
      setAuthLoading(false)
      
      // Final verification that everything is stored
      console.log('🔐 LOGIN: Final localStorage verification:', {
        token: localStorage.getItem('token') ? 'Stored' : 'Missing',
        refresh_token: localStorage.getItem('refresh_token') ? 'Stored' : 'Missing',
        user: localStorage.getItem('user') ? 'Stored' : 'Missing'
      })
      
      console.log('🔐 LOGIN: Login completed successfully! 🎉')
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      setAuthLoading(false)
      return { success: false, error: 'Login failed' }
    }
  }, [])

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, username: string, fullName?: string) => {
    setAuthLoading(true)
    try {
      console.log('Attempting registration with:', { email, username, fullName })
      
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username, first_name: fullName }),
      })

      console.log('Registration response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Registration failed:', errorData)
        return { success: false, error: errorData.error || 'Registration failed' }
      }

      const data = await response.json()
      console.log('Registration response data:', data)
      
      const { access, refresh, user: userData } = data
      
      if (!access || !refresh || !userData) {
        console.error('Missing required data from registration response:', { access: !!access, refresh: !!refresh, user: !!userData })
        return { success: false, error: 'Invalid registration response' }
      }
      
      // Store tokens and user data
      localStorage.setItem('token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(userData))
      
      console.log('Stored in localStorage:', {
        token: access.substring(0, 20) + '...',
        refresh_token: refresh.substring(0, 20) + '...',
        user: userData
      })
      
      // Clear old keys if they exist
      localStorage.removeItem('auth_token')
      
      setUser(userData)
      setAuthLoading(false)
      
      return { success: true }
    } catch (error) {
      console.error('Sign up failed:', error)
      setAuthLoading(false)
      return { success: false, error: 'Registration failed' }
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      console.log('signOut: Clearing authentication data...')
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('password')
      localStorage.removeItem('auth_token')
      setUser(null)
      console.log('signOut: Authentication data cleared successfully')
    } catch (error) {
      console.error('signOut: Sign out failed:', error)
      throw error
    }
  }, [])

  // Refresh user function
  const refreshUser = useCallback(async () => {
    try {
      console.log('refreshUser: Starting token refresh...')
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        console.log('refreshUser: No refresh token found')
        return
      }
      
      // Try to refresh the token
      console.log('refreshUser: Attempting to refresh token...')
      const refreshResponse = await fetch('http://localhost:8000/api/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      
      console.log('refreshUser: Token refresh response status:', refreshResponse.status)
      
      if (refreshResponse.ok) {
        const { access } = await refreshResponse.json()
        console.log('refreshUser: Token refreshed successfully')
        localStorage.setItem('token', access)
        
        // Get updated user data
        console.log('refreshUser: Fetching updated user data...')
        const userResponse = await fetch('http://localhost:8000/api/auth/user/', {
          headers: {
            'Authorization': `Bearer ${access}`
          }
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log('refreshUser: User data updated:', userData)
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } else {
          console.error('refreshUser: Failed to get user data:', userResponse.status)
        }
      } else {
        console.log('refreshUser: Token refresh failed, clearing storage')
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
      }
    } catch (error) {
      console.error('refreshUser: Failed to refresh user:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }, [])

  // Auto-refresh token when it expires
  useEffect(() => {
    if (!user) return
    
    const checkTokenExpiry = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        // Decode JWT token to check expiry
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiresAt = payload.exp * 1000
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now
        
        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('🔄 Token expires soon, refreshing...')
          await refreshUser()
        }
      } catch (error) {
        console.error('Failed to check token expiry:', error)
      }
    }
    
    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000)
    checkTokenExpiry() // Check immediately
    
    return () => clearInterval(interval)
  }, [user, refreshUser])

  return (
    <AuthContext.Provider value={{ user, isLoading, loading: isLoading, isAuthenticated: !!user, setUser, login, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
