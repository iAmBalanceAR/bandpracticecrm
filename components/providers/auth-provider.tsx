'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/utils/supabase'
import type { Database } from '@/types/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: { user } } = await supabase.auth.getUser()
          setUser(user)
          setSession(session)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        console.log('Auth state changed:', event)

        if (newSession) {
          const { data: { user } } = await supabase.auth.getUser()
          setUser(user)
          setSession(newSession)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setSession(null)
          setIsAuthenticated(false)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
} 