'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { SupabaseClient, User, Session } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  user: User | null
  isLoading: boolean
  session: Session | null
  refreshUser: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error refreshing user:', error)
        setUser(null)
        setSession(null)
      } else {
        setUser(currentUser)
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
      }
    } catch (error) {
      console.error('Error in user refresh:', error)
      setUser(null)
      setSession(null)
    }
  }

  useEffect(() => {
    if (initialSession) {
      setUser(initialSession.user)
      setSession(initialSession)
      setIsLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error fetching user:', error)
          setUser(null)
          setSession(null)
          if (!pathname.includes('/auth/')) {
            router.push('/auth/signin')
          }
        } else {
          setUser(currentUser)
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          setSession(currentSession)
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
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN') {
        setUser(newSession?.user ?? null)
        setSession(newSession)
        if (pathname === '/auth/signin' || pathname === '/auth/signup') {
          router.push('/dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
        if (!pathname.includes('/auth/')) {
          router.push('/auth/signin')
        }
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession)
        await refreshUser()
      } else if (event === 'USER_UPDATED') {
        await refreshUser()
      }

      // Only refresh if we're not on a 404 page and not during auth transitions
      if (!pathname.includes('404') && !pathname.includes('/auth/')) {
        router.refresh()
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