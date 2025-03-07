'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
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

// Debounce time in milliseconds
const DEBOUNCE_TIME = 2000;
// Maximum retry attempts
const MAX_RETRIES = 3;

// Simple debounce to prevent excessive auth checks
const AUTH_CHECK_COOLDOWN = 30000; // 30 seconds between checks
let lastAuthCheck = 0;
let isRefreshing = false;

// Safely import the request monitor at runtime
let requestMonitor: any = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Dynamic import to avoid SSR issues
  import('@/utils/dev-request-monitor').then(module => {
    requestMonitor = module.default;
  }).catch(err => {
    console.error('Failed to load request monitor:', err);
  });
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
  
  // Use refs to track retry attempts and debounce timer
  const retryCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isAuthInitialized = useRef(false);

  const refreshUser = async () => {
    // Don't run multiple refreshes simultaneously
    if (isRefreshing) {
      console.log('Auth refresh already in progress, skipping');
      return;
    }
    
    // Don't check more than once per cooldown period
    const now = Date.now();
    if (now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
      console.log(`Skipping auth check - last check was ${Math.round((now - lastAuthCheck) / 1000)}s ago`);
      return;
    }
    
    try {
      isRefreshing = true;
      lastAuthCheck = now;
      
      console.log('Checking auth state...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error);
        
        // Handle rate limit errors specifically
        if (error.status === 429) {
          console.warn('Rate limit hit during auth check. Will retry later.');
          // Don't update state on rate limit, just wait for next attempt
          return;
        }
        
        // For other errors, update state
        setUser(null);
        setSession(null);
        return;
      }
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
    } finally {
      isRefreshing = false;
      setIsLoading(false);
    }
  }

  const isPublicRoute = (path: string) => {
    return PUBLIC_ROUTES.some(route => path.startsWith(route))
  }

  useEffect(() => {
    // Prevent multiple initializations
    if (isAuthInitialized.current) {
      return;
    }
    
    isAuthInitialized.current = true;

    if (initialSession) {
      const verifyInitialSession = async () => {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session verification error:', error);
            setUser(null);
            setSession(null);
            if (!isPublicRoute(pathname)) {
              router.push('/auth/signin')
            }
          } else if (currentSession) {
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
          console.error('Unexpected error during session verification:', error);
          setUser(null);
          setSession(null);
          if (!isPublicRoute(pathname)) {
            router.push('/auth/signin')
          }
        } finally {
          setIsLoading(false)
        }
      }
      
      verifyInitialSession()
      return
    }

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth initialization error:', error);
          setUser(null);
          setSession(null);
          if (!isPublicRoute(pathname)) {
            router.push('/auth/signin')
          }
        } else if (currentSession) {
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

    // Track Supabase requests in development mode
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' 
          ? input 
          : input instanceof Request ? input.url : input.toString();
        
        // Only track Supabase auth requests
        if (url.includes('supabase') && url.includes('auth') && requestMonitor) {
          try {
            if (typeof requestMonitor.recordRequest === 'function') {
              requestMonitor.recordRequest(url, init?.method || 'GET');
            }
          } catch (error) {
            console.error('Error recording request:', error);
          }
        }
        
        return originalFetch(input, init);
      };
      
      // Restore original fetch on cleanup
      return () => {
        window.fetch = originalFetch;
        subscription.unsubscribe();
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }

    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
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