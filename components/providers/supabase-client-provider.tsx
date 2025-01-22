'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Database } from '@/types/supabase'

type UserResponse = Awaited<ReturnType<SupabaseClient['auth']['getUser']>>

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  user: User | null
  session: Session | null
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

interface Props {
  children: React.ReactNode
  initialSession: Session | null
}

export default function SupabaseProvider({ children, initialSession }: Props) {
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error refreshing session:', error)
        setUser(null)
        setSession(null)
        return
      }

      if (currentSession) {
        setUser(currentSession.user)
        setSession(currentSession)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error('Error in session refresh:', error)
      setUser(null)
      setSession(null)
    }
  }

  useEffect(() => {
    if (initialSession) {
      const verifyInitialSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          setUser(currentSession.user)
          setSession(currentSession)
        } else {
          setUser(null)
          setSession(null)
          if (!pathname.includes('/auth/')) {
            router.push('/auth/signin')
          }
        }
        setIsLoading(false)
      }
      verifyInitialSession()
      return
    }

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          setUser(currentSession.user)
          setSession(currentSession)
        } else {
          setUser(null)
          setSession(null)
          if (!pathname.includes('/auth/')) {
            router.push('/auth/signin')
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error)
        setUser(null)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        setSession(session)
        if (pathname === '/auth/signin' || pathname === '/auth/signup') {
          router.push('/')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
        if (!pathname.includes('/auth/')) {
          router.push('/auth/signin')
        }
      } else if (event === 'TOKEN_REFRESHED') {
        await refreshUser()
      } else if (event === 'USER_UPDATED') {
        await refreshUser()
      }

      // Only refresh on sign in/out and avoid refreshing on error pages
      if (
        (event === 'SIGNED_IN' || event === 'SIGNED_OUT') &&
        !pathname.includes('404') && 
        !pathname.includes('/auth/') &&
        !pathname.includes('/error')
      ) {
        router.replace(pathname)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname, initialSession])

  return (
    <Context.Provider value={{ supabase, user, session, isLoading, refreshUser }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 