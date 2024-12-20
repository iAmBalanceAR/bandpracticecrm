'use client'

import { createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useSupabase } from './supabase-client-provider'

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
  const { user, session, isLoading } = useSupabase()
  
  const value = {
    user,
    session,
    loading: isLoading,
    isAuthenticated: !!session
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