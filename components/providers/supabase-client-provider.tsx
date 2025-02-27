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

const PUBLIC_ROUTES = [
  '/pricing',
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/forgot-password'
]

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
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const isPublicRoute = (path: string) => {
    return PUBLIC_ROUTES.some(route => path.startsWith(route))
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
          if (!isPublicRoute(pathname)) {
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
          if (!isPublicRoute(pathname)) {
            router.push('/auth/signin')
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AuthSessionMissingError') {
          console.error('Error in auth initialization:', error)
        }
        setUser(null)
        setSession(null)
        if (!isPublicRoute(pathname)) {
          router.push('/auth/signin')
        }
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
        if (!isPublicRoute(pathname)) {
          router.push('/auth/signin')
        }
      } else if (event === 'TOKEN_REFRESHED') {
        await refreshUser()
      } else if (event === 'USER_UPDATED') {
        await refreshUser()
      }

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