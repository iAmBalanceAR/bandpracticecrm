import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Increase cache duration to 5 minutes to reduce token refresh attempts
const CACHE_DURATION = 300000; // 5 minutes

// Track the last refresh attempt time
const lastRefreshAttempt = new Map<string, number>();
const MIN_REFRESH_INTERVAL = 60000; // 1 minute minimum between refresh attempts

// Separate caches for different types of auth data
const sessionCache = new Map<string, { data: any; timestamp: number }>();
const userCache = new Map<string, { data: any; timestamp: number }>();
const subscriptionCache = new Map<string, { data: any; timestamp: number }>();

const protectedPaths = [
  '/',
  '/dashboard',
  '/account',
  '/members',
  '/bands',
  '/calendar',
  '/messages',
  '/settings',
  // Add any other paths that require subscription
]

const publicPaths = [
  '/test-email',  // Add test email route to public paths
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/callback?code=*',  // Allow callback with code parameter
  '/auth/callback?token_hash=*',  // Allow callback with token_hash parameter
  '/auth/auth-code-error',  // Add error page
  '/auth/reset-password',
  '/auth/forgot-password',
  '/auth/confirm',
  '/api/auth',
  '/api/sync-subscription',
  '/api/create-profile',
  '/pricing',  // Main pricing page
  '/pricing/success',  // Add success page
  '/pricing/cancelled',  // Add cancelled page
  '/about',
  '/contact',
  '/legal/privacy-policy',  // Legal pages
  '/legal/terms-of-service',
  '/legal/cookie-policy',
  '/support/contact',  // Support pages
  '/status',  // System status page
  '/help',
  '/faq',
  '/favicon.ico',
  '/_next',
  '/static',
  '/images',
  '/robots.txt',
  '/sitemap.xml',
  '/api/checkout',
  '/account/password',
  '/account/password/reset',  // Add standalone reset page
  '/account/password/reset?code=*',  // Allow reset page with code parameter
  '/auth/auth-code-error?error=*',  // Allow error page with error parameter
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  // Skip auth checks in development for specific paths
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname.startsWith('/test-email')) {
    return response;
  }

  // Check if the path is in the public paths list
  const isPublicPath = publicPaths.some(path => {
    // Handle paths with wildcards for query parameters
    if (path.includes('*')) {
      const [basePath, paramPattern] = path.split('?')
      const currentPath = request.nextUrl.pathname
      const currentSearch = request.nextUrl.search

      // If the path matches and there's no query pattern, it's a match
      if (currentPath === basePath && !paramPattern) {
        return true
      }

      // If there's a query pattern, check if the current URL matches the pattern
      if (paramPattern && currentSearch) {
        const paramName = paramPattern.split('=')[0]
        return currentPath === basePath && currentSearch.startsWith(`?${paramName}=`)
      }

      return false
    }

    // Regular path matching
    return request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  })

  if (isPublicPath) {
    return response
  }

  // Get the session token
  const sessionToken = request.cookies.get('sb-xasfpbzzvsgzvdpjqwqe-auth-token')?.value;
  
  // If there's no session token and it's not a public path, redirect to signin
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  const cacheKey = sessionToken;

  // Check if we've attempted a refresh recently
  const now = Date.now();
  const lastRefresh = lastRefreshAttempt.get(cacheKey) || 0;
  const shouldAttemptRefresh = now - lastRefresh >= MIN_REFRESH_INTERVAL;

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Check session cache first
    const cachedSession = sessionCache.get(cacheKey);
    let session;
    
    if (cachedSession && Date.now() - cachedSession.timestamp < CACHE_DURATION) {
      session = cachedSession.data;
    } else if (shouldAttemptRefresh) {
      try {
        lastRefreshAttempt.set(cacheKey, now);
        const { data: { session: newSession } } = await supabase.auth.getSession();
        session = newSession;
        if (newSession) {
          sessionCache.set(cacheKey, { 
            data: newSession, 
            timestamp: Date.now() 
          });
        }
      } catch (error: any) {
        if (error?.status === 429 && cachedSession) {
          session = cachedSession.data;
        } else if (!cachedSession) {
          return NextResponse.redirect(new URL('/auth/signin', request.url))
        }
      }
    } else {
      // Use cached session if available, otherwise redirect
      session = cachedSession?.data;
    }

    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Similar changes for user and subscription checks...
    // Only attempt to refresh if shouldAttemptRefresh is true
    const cachedUser = userCache.get(cacheKey);
    let user = cachedUser?.data;

    if (!cachedUser || (shouldAttemptRefresh && Date.now() - cachedUser.timestamp >= CACHE_DURATION)) {
      try {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          user = newUser;
          userCache.set(cacheKey, {
            data: newUser,
            timestamp: Date.now()
          });
        }
      } catch (error: any) {
        if (error?.status === 429 && cachedUser) {
          user = cachedUser.data;
        } else if (!cachedUser?.data) {
          return NextResponse.redirect(new URL('/auth/signin', request.url))
        }
      }
    }

    // For protected paths, check subscription
    if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      const cachedSubscription = subscriptionCache.get(user.id);
      let profile = cachedSubscription?.data;

      if (!cachedSubscription || (shouldAttemptRefresh && Date.now() - cachedSubscription.timestamp >= CACHE_DURATION)) {
        try {
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single();
          
          if (newProfile) {
            profile = newProfile;
            subscriptionCache.set(user.id, {
              data: newProfile,
              timestamp: Date.now()
            });
          }
        } catch (error: any) {
          if (error?.status === 429 && cachedSubscription) {
            profile = cachedSubscription.data;
          }
        }
      }

      if (!profile?.subscription_status || !['active', 'trialing'].includes(profile.subscription_status)) {
        return NextResponse.redirect(new URL('/pricing', request.url))
      }
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    // If we have cached data, use it instead of redirecting
    if (sessionCache.get(cacheKey)?.data) {
      return response
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean up session, user, and subscription caches
  [sessionCache, userCache, subscriptionCache].forEach(cache => {
    Array.from(cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    });
  });

  // Clean up refresh attempt tracking
  Array.from(lastRefreshAttempt.entries()).forEach(([key, timestamp]) => {
    if (now - timestamp > CACHE_DURATION) {
      lastRefreshAttempt.delete(key);
    }
  });
}, CACHE_DURATION);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}