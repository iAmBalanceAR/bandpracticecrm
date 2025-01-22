'use client'

import { createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useSupabase } from './supabase-client-provider'
import { createServerClient } from '@supabase/ssr'

export interface AuthContextType {
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
  const { user, session, isLoading } = useSupabase()
  
  const value: AuthContextType = {
    user,
    session: session,
    loading: isLoading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
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